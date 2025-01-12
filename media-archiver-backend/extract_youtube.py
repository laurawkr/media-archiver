import os
import subprocess
import json
import re
import sys
import requests

def sanitize_filename(filename):
    """Sanitize file names to ensure compatibility across file systems."""
    return re.sub(r'[^\w\-_\. ]', '_', filename)

def get_media_folder():
    response = requests.get("http://localhost:5000/get-root")
    if response.ok:
        return os.path.join(response.json()["root_path"], "YouTube")
    else:
        raise Exception("Failed to fetch MEDIA_FOLDER from the backend")

output_folder = get_media_folder()

def extract_youtube_metadata(video_url, output_folder = get_media_folder()):
    """Extract metadata, save it, and download the best video format."""
    os.makedirs(output_folder, exist_ok=True)

    try:
        # Fetch metadata
        command = ["yt-dlp", "--dump-json", video_url]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        raw_metadata = json.loads(result.stdout)

        # Refine metadata
        refined_metadata = {
            "id": raw_metadata["id"],
            "title": raw_metadata["title"],
            "duration": raw_metadata.get("duration"),
            "uploader": raw_metadata.get("uploader"),
            "upload_date": raw_metadata.get("upload_date"),
            "thumbnail": raw_metadata.get("thumbnail"),
            "best_format": {
                "format_id": raw_metadata["formats"][-1]["format_id"],
                "filesize": raw_metadata["formats"][-1].get("filesize"),
                "ext": raw_metadata["formats"][-1]["ext"],
                "resolution": raw_metadata["formats"][-1].get("resolution"),
                "fps": raw_metadata["formats"][-1].get("fps"),
            }
        }

        # Append comments at the end of metadata
        comments = raw_metadata.get("comments", [])
        refined_metadata["comments"] = comments

        # Create a dedicated folder for this video
        video_id = raw_metadata["id"]
        video_folder = os.path.join(output_folder, sanitize_filename(video_id))
        os.makedirs(video_folder, exist_ok=True)

        # Update metadata filename and video path to include the folder
        metadata_filename = os.path.join(video_folder, f"{sanitize_filename(raw_metadata['id'])}_metadata.json")
        video_path = os.path.join(video_folder, sanitize_filename(raw_metadata["title"]) + ".mp4")

        # Save refined metadata to a file
        with open(metadata_filename, "w") as metadata_file:
            json.dump(refined_metadata, metadata_file, indent=4)

        print(f"Refined metadata saved: {metadata_filename}")

        # Download video
        best_format_id = refined_metadata["best_format"]["format_id"]
        download_command = [
            "yt-dlp",
            "-f", "bestvideo+bestaudio[ext=m4a]/best",
            "--merge-output-format", "mp4",
            video_url,
            "-o", video_path
        ]

        subprocess.run(download_command, check=True)
        print(f"Video downloaded: {video_path}")

    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
    except KeyError as e:
        print(f"Missing key in metadata: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No URL provided.")
        sys.exit(1)
    video_url = sys.argv[1]
    extract_youtube_metadata(video_url)