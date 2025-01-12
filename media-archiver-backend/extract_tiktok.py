import os
import subprocess
import json
import re
import logging
import sys

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
    Extract metadata, download comments, and download TikTok videos using yt-dlp.
    Matches metadata format to existing project for consistency.
    """
    os.makedirs(output_folder, exist_ok=True)

    try:
        # Fetch metadata with comments
        command = ["yt-dlp", "--dump-json", "--write-comments", video_url]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        raw_metadata = json.loads(result.stdout)

        # Refine metadata
        refined_metadata = {
            "id": raw_metadata["id"],
            "title": raw_metadata["title"],
            "source_url": video_url,
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
            },
            "comments": raw_metadata.get("comments", [])
        }



        # Create a dedicated folder for this video
        video_id = raw_metadata["id"]
        video_folder = os.path.join(output_folder, sanitize_filename(video_id))
        if os.path.exists(video_folder):
            logging.info(f"Folder already exists for video ID {video_id}: {video_folder}. Skipping the rest.")
            return
        else:
            os.makedirs(video_folder, exist_ok=True)

            # Save refined metadata to a file
            metadata_filename = os.path.join(video_folder, f"{sanitize_filename(video_id)}_metadata.json")

            with open(metadata_filename, "w") as metadata_file:
                json.dump(refined_metadata, metadata_file, indent=4)
            logging.info(f"Metadata and comments saved: {metadata_filename}")

            # Download video
            best_format_id = refined_metadata["best_format"]["format_id"]
            video_path = os.path.join(video_folder, sanitize_filename(raw_metadata["title"]) + ".mp4")

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
    if len(sys.argv) < 2:
        print("Error: No URL provided.")
        sys.exit(1)
    video_url = sys.argv[1]
    extract_tiktok_metadata(video_url)
