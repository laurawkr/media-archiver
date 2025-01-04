import os
import subprocess
import json
import re
import logging

# Set up logging
logging.basicConfig(
    filename="tiktok_downloader.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def sanitize_filename(filename, max_length=100):
    """
    Sanitize file names to ensure compatibility across file systems.
    Truncates filenames if they exceed max_length.
    """
    sanitized = re.sub(r'[^\w\-_\. ]', '_', filename)
    if len(sanitized) > max_length:
        base, ext = os.path.splitext(sanitized)
        sanitized = f"{base[:max_length-len(ext)-3]}...{ext}"
    return sanitized

def extract_tiktok_metadata(video_url, output_folder="/Volumes/media-archiver/TikTok"):
    """
    Extract metadata and download TikTok videos using yt-dlp.
    Matches metadata format to existing project for consistency.
    """
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

        # Save refined metadata to a file
        metadata_filename = os.path.join(
            output_folder, f"{sanitize_filename(raw_metadata['id'])}_metadata.json"
        )
        with open(metadata_filename, "w") as metadata_file:
            json.dump(refined_metadata, metadata_file, indent=4)

        logging.info(f"Refined metadata saved: {metadata_filename}")

        # Download video
        best_format_id = refined_metadata["best_format"]["format_id"]
        video_filename = sanitize_filename(raw_metadata["title"]) + ".mp4"
        video_path = os.path.join(output_folder, video_filename)

        download_command = [
            "yt-dlp",
            "-f", best_format_id,
            video_url,
            "-o", video_path
        ]
        subprocess.run(download_command, check=True)
        logging.info(f"Video downloaded: {video_path}")

    except subprocess.CalledProcessError as e:
        logging.error(f"Error occurred: {e.stderr}")
    except KeyError as e:
        logging.error(f"Missing key in metadata: {e}")

if __name__ == "__main__":
    video_url = input("Enter a TikTok video URL: ").strip()
    extract_tiktok_metadata(video_url)