from flask import Flask, request, jsonify, send_from_directory
import os
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Apply CORS to the Flask app

MEDIA_FOLDER = "/Volumes/media-archiver"  # Adjust to your media folder path

def list_saved_media():
    """List all saved media from the media folder."""
    media = []
    for source in ["YouTube", "TikTok", "InternetArchive"]:
        source_folder = os.path.join(MEDIA_FOLDER, source)
        if not os.path.exists(source_folder):
            continue

        for item in os.listdir(source_folder):
            item_folder = os.path.join(source_folder, item)
            if os.path.isdir(item_folder):
                # Look for a JSON file and a media file (.mp4 or .mp3) in the folder
                metadata_file = next(
                    (file for file in os.listdir(item_folder) if file.endswith(".json")), None
                )
                media_file = next(
                    (file for file in os.listdir(item_folder) if file.endswith((".mp4", ".mp3"))), None
                )

                if metadata_file and media_file:
                    metadata_path = os.path.join(item_folder, metadata_file)
                    media_path = os.path.join(item_folder, media_file)

                    with open(metadata_path, "r") as f:
                        try:
                            metadata = json.load(f)
                            # Add media file URL for front-end linking
                            metadata["media_url"] = f"/files/{source}/{item}/{media_file}"
                            media.append(metadata)
                        except json.JSONDecodeError:
                            print(f"Invalid JSON in file: {metadata_path}")  # Log invalid JSON
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)