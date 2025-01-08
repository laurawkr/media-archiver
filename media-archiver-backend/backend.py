from flask import Flask, request, jsonify, send_from_directory
import os
import json
import subprocess
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Apply CORS to the Flask app

MEDIA_FOLDER = "/Volumes/media-archiver"  # Adjust to your media folder path

def determine_source(url):
    """Determine the source of the URL (YouTube, TikTok, or Internet Archive)."""
    if "youtube.com" in url or "youtu.be" in url:
        return "YouTube"
    elif "tiktok.com" in url:
        return "TikTok"
    elif "archive.org" in url:
        return "InternetArchive"
    return None

@app.route('/process-url', methods=['POST'])
def process_url():
    """Endpoint to process a media URL."""
    data = request.json
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    source = determine_source(url)
    if not source:
        return jsonify({"error": "Unsupported URL"}), 400

    try:
        if source == "YouTube":
            subprocess.run(["python3", "extract_youtube.py", url], check=True)
        elif source == "TikTok":
            subprocess.run(["python3", "extract_tiktok.py", url], check=True)
            subprocess.run(["python3", "tiktok_comments_extract.py", url], check=True)
        elif source == "InternetArchive":
            item_id = re.search(r"/details/([^/]+)", url).group(1)
            subprocess.run(["python3", "extract_internet_archive.py", item_id], check=True)

        return jsonify({"message": f"{source} processing started for URL: {url}"})
    except Exception as e:
        print(f"Error processing URL: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500

def list_saved_media():
    """List all saved media from the media folder."""
    media = []
    for source in ["YouTube", "TikTok", "InternetArchive", "LocalUpload"]:
        source_folder = os.path.join(MEDIA_FOLDER, source)
        if not os.path.exists(source_folder):
            continue

        for item in os.listdir(source_folder):
            item_folder = os.path.join(source_folder, item)
            if os.path.isdir(item_folder):
                metadata_file = next(
                    (file for file in os.listdir(item_folder) if file.endswith(".json")), None
                )
                media_file = next(
                    (file for file in os.listdir(item_folder) if file.endswith((".mp4", ".mp3"))), None
                )

                if metadata_file and media_file:
                    metadata_path = os.path.join(item_folder, metadata_file)
                    with open(metadata_path, "r") as f:
                        try:
                            metadata = json.load(f)
                            metadata["media_url"] = f"http://localhost:5000/files/{source}/{item}/{media_file}"  # Adjust path
                            media.append(metadata)
                        except json.JSONDecodeError:
                            print(f"Invalid JSON in file: {metadata_path}")  # Debug log
    return media

@app.route('/list-media', methods=['GET'])
def list_media():
    """Endpoint to list all saved media."""
    try:
        media = list_saved_media()
        return jsonify(media)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/files/<source>/<item>/<filename>', methods=['GET'])
def serve_file(source, item, filename):
    """Serve static files from the media folder."""
    file_path = os.path.join(MEDIA_FOLDER, source, item, filename)
    if os.path.exists(file_path):
        return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path))
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/update-metadata', methods=['POST'])
def update_metadata():
    """
    Endpoint to update the metadata file for a specific media item.
    """
    data = request.json

    if not data or "id" not in data:
        return jsonify({"error": "Invalid request. 'id' is required."}), 400

    media_id = data["id"]
    media_folder = None

    # Search for the metadata file in the media folder
    for source in ["YouTube", "TikTok", "InternetArchive"]:
        source_folder = os.path.join(MEDIA_FOLDER, source)
        if not os.path.exists(source_folder):
            continue

        for item in os.listdir(source_folder):
            if item == media_id:
                media_folder = os.path.join(source_folder, item)
                break
        if media_folder:
            break

    if not media_folder:
        return jsonify({"error": "Media ID not found."}), 404

    # Locate the metadata file
    metadata_file = next(
        (os.path.join(media_folder, file) for file in os.listdir(media_folder) if file.endswith("_metadata.json")),
        None
    )

    if not metadata_file:
        return jsonify({"error": "Metadata file not found."}), 404

    try:
        # Update the metadata file with the new data
        with open(metadata_file, "r") as f:
            existing_metadata = json.load(f)

        updated_metadata = {**existing_metadata, **data}

        with open(metadata_file, "w") as f:
            json.dump(updated_metadata, f, indent=4)

        return jsonify({"message": "Metadata updated successfully."})
    except Exception as e:
        print(f"Error updating metadata: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500
    

@app.route('/download-comments', methods=['POST', 'OPTIONS'])
def download_comments():
    """
    Endpoint to trigger TikTok comments extraction.
    """
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight passed."}), 200

    try:
        # If you want to pass a custom TikTok URL from the front-end:
        data = request.get_json()
        tiktok_url = data.get('tiktokUrl') if data else None

        # Build the command; if no URL was provided, it uses the default in the script
        cmd = ["python3", "tiktok_comments_extract.py", tiktok_url ]
        if tiktok_url:
            cmd.append(tiktok_url)

        result = subprocess.run(
            cmd,
            capture_output=True, text=True, check=True
        )
        print("Script Output:", result.stdout)  # For debugging in Flask logs
        return jsonify({"message": "Script executed successfully.", "output": result.stdout}), 200

    except subprocess.CalledProcessError as e:
        print("Error executing script:", e.stderr)  # Debug log
        return jsonify({"error": "Failed to execute the script.", "details": e.stderr}), 500


for rule in app.url_map.iter_rules():
    print(f"Endpoint: {rule.endpoint}, URL: {rule}")

@app.route('/upload-local', methods=['POST'])
def upload_local():
    """Handle local file uploads."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    output_folder = "/Volumes/media-archiver/LocalUpload"
    file_path = os.path.join(output_folder, file.filename)
    file.save(file_path)

    try:
        from local_file_upload import upload_local_media
        metadata_file, destination_path = upload_local_media(file_path)
        return jsonify({"message": "File uploaded successfully", "metadata": metadata_file})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)