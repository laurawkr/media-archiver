import os
import requests
import json
import logging
import time
import sys
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor

# Set up logging
logging.basicConfig(
    filename="archive_downloader.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def sanitize_filename(name):
    """
    Sanitize file and folder names to ensure compatibility across file systems.
    """
    return "".join(c if c.isalnum() or c in " ._-()" else "_" for c in name)

def download_archive_item(item_id, output_folder="/Volumes/media-archiver/InternetArchive", threads=4):
    """
    Download metadata, media files, and thumbnails for an Internet Archive item.
    Folder and video are named with the 'id'. Metadata remains unchanged.
    """
    logging.info(f"Starting download for item: {item_id}")
    os.makedirs(output_folder, exist_ok=True)
    api_url = f"https://archive.org/metadata/{item_id}"

    try:
        # Fetch metadata
        logging.info(f"Fetching metadata for item: {item_id}")
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()
        metadata = response.json()

        # Filter metadata for video files
        files_to_download = [
            file for file in metadata.get("files", [])
            if file["name"].endswith(".mp4") and not file["name"].endswith(".ia.mp4")
        ]

        # Filter metadata for thumbnails
        thumbnails = [
            file for file in metadata.get("files", [])
            if file["name"].endswith((".jpg", ".jpeg", ".png"))
        ]

        # Download each video
        with ThreadPoolExecutor(max_workers=threads) as executor:
            for file in files_to_download:
                video_id = sanitize_filename(file["name"].split("/")[-1].split(".")[0])
                video_folder = os.path.join(output_folder, video_id)
                os.makedirs(video_folder, exist_ok=True)

                # Download the video
                file_url = f"https://archive.org/download/{item_id}/{file['name']}"
                output_file = os.path.join(video_folder, f"{video_id}.mp4")
                executor.submit(download_file, file_url, output_file)

                # Determine thumbnail URL (use first available thumbnail)
                thumbnail = next(iter(thumbnails), None)
                thumbnail_url = (
                    f"https://archive.org/download/{item_id}/{thumbnail['name']}" if thumbnail else None
                )

                # If no thumbnail, fallback to system video preview
                if not thumbnail_url:
                    thumbnail_url = f"Preview for {video_id}.mp4 (use system thumbnail rendering)"

                # Safely construct metadata JSON
                video_metadata = {
                    "id": video_id,
                    "title": metadata.get("metadata", {}).get("title", "Unknown Title"),
                    "duration": int(float(file.get("length", 0) or 0)),  # Default to 0 if missing
                    "uploader": metadata.get("metadata", {}).get("creator", "Unknown Uploader"),
                    "upload_date": metadata.get("created", "Unknown Date"),  # Default string if missing
                    "thumbnail": thumbnail_url,
                    "best_format": {
                        "format_id": file.get("format", "Unknown Format"),
                        "filesize": int(file.get("size", 0) or 0),  # Default to 0 if missing
                        "ext": file["name"].split(".")[-1],
                        "resolution": f"{file.get('width', 0)}x{file.get('height', 0)}",
                        "fps": None,
                    }
                }

                # Save metadata JSON
                metadata_file = os.path.join(video_folder, f"{video_id}_metadata.json")
                with open(metadata_file, "w") as f:
                    json.dump(video_metadata, f, indent=4)

    except requests.RequestException as e:
        logging.error(f"Failed to fetch or process item {item_id}: {e}")

def download_file(url, output_path):
    """
    Download a file from a given URL and save it to the specified path.
    Logs progress every 30 seconds.
    """
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        last_log_time = time.time()
        with requests.get(url, stream=True, timeout=30) as response:
            response.raise_for_status()
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    current_time = time.time()
                    if current_time - last_log_time >= 30:
                        logging.info(f"Downloading: {url} - {downloaded}/{total_size} bytes")
                        last_log_time = current_time
        logging.info(f"File saved: {output_path}")
    except requests.RequestException as e:
        logging.error(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No URL provided.")
        sys.exit(1)
    video_url = sys.argv[1]
    item_id = urlparse(video_url).path.replace("/details/", "").strip("/")
    download_archive_item(item_id)