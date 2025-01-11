from flask import Flask, request, jsonify, send_from_directory
import os
import json
import subprocess
import re
from flask_cors import CORS
import subprocess
from flask_socketio import SocketIO, emit
from datetime import datetime


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 80 * 1024 * 1024 * 1024  # 80GB limit
CORS(app)  # Apply CORS to the Flask app

socketio = SocketIO(app, cors_allowed_origins="*")


def transcode_mkv(file_path):
    """Transcode MKV file to ensure compatibility."""
    output_path = file_path.replace(".mkv", "_compatible.mp4")
    output_path = file_path.replace(".mkv", ".mp4")
    command = [
        "ffmpeg", "-i", file_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-strict", "experimental",
        "-y", output_path
    ]
    subprocess.run(command, check=True)
    return output_path

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
    for source in ["YouTube", "TikTok", "InternetArchive", "LocalUpload", "MediaStudioSavedClips"]:
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
                    (file for file in os.listdir(item_folder) if file.endswith((".mp4", ".mkv", ".mov", ".mp3"))), None
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
    print("Incoming request: POST /upload-local")  # Debug log

    if 'file' not in request.files:
        print("Error: No file part in the request")  # Debug log
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        print("Error: Empty filename")  # Debug log
        return jsonify({"error": "Empty filename"}), 400

    try:
        print(f"Uploading file: {file.filename}")  # Debug log
        output_folder = "/Volumes/media-archiver/LocalUpload"
        os.makedirs(output_folder, exist_ok=True)

        file_path = os.path.join(output_folder, file.filename)
        print(f"Saving file: {file.filename} to {file_path}")
        file.save(file_path)
        print(f"File saved successfully: {file_path}")

        if file.filename.endswith('.mkv'):
            file_path = transcode_mkv(file_path)
            print(f"File transcoded: {file_path}")  # Debug log

        from local_file_upload import upload_local_media
        metadata_file, destination_path = upload_local_media(file_path)
        return jsonify({"message": "File uploaded successfully", "metadata": metadata_file})

    except Exception as e:
        print(f"Error during upload-local: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500

    
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "File is too large. Maximum allowed size is 80GB."}), 413


@app.route("/save-clip", methods=["POST"])
def save_clip():
    data = request.json

    video_url = data.get("video_url")
    audio_url = data.get("audio_url")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    clip_name = data.get("clip_name")

    if not video_url or not clip_name or start_time is None or end_time is None:
        return jsonify({"error": "Missing required fields"}), 400

    # Resolve file paths
    video_input = f"/Volumes/media-archiver/{'/'.join(video_url.split('/')[-3:])}"
    audio_input = f"/Volumes/media-archiver/{'/'.join(audio_url.split('/')[-3:])}" if audio_url else None
    output_path = f"/Volumes/media-archiver/MediaStudioSavedClips/{clip_name}.mp4"
    clip_folder = f"/Volumes/media-archiver/MediaStudioSavedClips/{clip_name}/"
    os.makedirs(clip_folder, exist_ok=True)
    output_path = os.path.join(clip_folder, f"{clip_name}.mp4")

    try:
        # Build ffmpeg command based on presence of audio_url
        if audio_url:
            command = [
                "ffmpeg", "-i", video_input, "-i", audio_input,
                "-ss", str(start_time), "-to", str(end_time),
                "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0",
                output_path
            ]
        else:
            command = [
                "ffmpeg", "-i", video_input,
                "-ss", str(start_time), "-to", str(end_time),
                "-c:v", "copy", "-an", output_path
            ]

        # Execute ffmpeg command
        print("Running command:", " ".join(command))  # Debug log
        subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        # Create metadata
        metadata = {
            "id": clip_name,
            "title": clip_name,
            "duration": end_time - start_time,
            "uploader": "local_user",
            "upload_date": datetime.now().strftime("%Y-%m-%d"),
            "thumbnail": None,
            "original_audio_source": audio_input,
            "original_video_source": video_input,
            "best_format": {
                "format_id": None,  # Populate based on actual data
                "filesize": os.path.getsize(output_path),
                "ext": "mp4",
                "resolution": None,  # Populate based on actual data
                "fps": None  # Populate based on actual data
            }
        }

        # Save metadata to a file
        metadata_path = f"{clip_folder}clip_name_metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=4)

        return jsonify({"message": "Clip saved successfully", "path": output_path})
    except subprocess.CalledProcessError as e:
        print("Error running ffmpeg:", e.stderr.decode())  # Debug log
        return jsonify({"error": e.stderr.decode()}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

