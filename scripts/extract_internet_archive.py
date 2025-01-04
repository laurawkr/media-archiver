import os
import requests
import json
import logging
import time
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
    Download metadata and media files for an Internet Archive item.
    Filters out .ia.mp4 files and excludes unnecessary metadata.
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

        # Filter metadata for .mp4 files (excluding .ia.mp4)
        files_to_download = [
            file for file in metadata.get("files", [])
            if file["name"].endswith(".mp4") and not file["name"].endswith(".ia.mp4")
        ]

        # Save filtered metadata
        metadata_file = os.path.join(output_folder, f"{sanitize_filename(item_id)}_filtered.json")
        filtered_metadata = {"files": files_to_download}
        with open(metadata_file, "w") as f:
            json.dump(filtered_metadata, f, indent=4)
        logging.info(f"Filtered metadata saved for item: {item_id} at {metadata_file}")

        # Download files in parallel
        with ThreadPoolExecutor(max_workers=threads) as executor:
            for file in files_to_download:
                file_url = f"https://archive.org/download/{item_id}/{file['name']}"
                output_file = os.path.join(output_folder, sanitize_filename(file["name"]))
                executor.submit(download_file, file_url, output_file)

    except requests.RequestException as e:
        logging.error(f"Failed to fetch or process item {item_id}: {e}")

def download_file(url, output_path):
    """
    Download a file from a given URL and save it to the specified path.
    Logs progress every 30 seconds.
    """
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        last_log_time = time.time()  # Initialize the last log time
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
                        last_log_time = current_time  # Update the last log time
        logging.info(f"File saved: {output_path}")
    except requests.RequestException as e:
        logging.error(f"Failed to download {url}: {e}")

# Example usage
if __name__ == "__main__":
    item_id = input("Enter the Internet Archive item ID: ")
    download_archive_item(item_id)