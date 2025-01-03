import os
import requests
import json
import logging
import re

# Set up logging
logging.basicConfig(
    filename="archive_downloader.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def sanitize_filename(name):
    """Sanitize file and folder names to ensure compatibility across file systems."""
    return re.sub(r'[^\w\-_\. ()]', '_', name)

def download_archive_item(item_id, output_folder="data/internet_archive"):
    """
    Download metadata and prioritize .mp4 files for an item from the Internet Archive.
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

        # Refine metadata
        refined_metadata = {
            "id": metadata.get("metadata", {}).get("identifier"),
            "title": metadata.get("metadata", {}).get("title"),
            "description": metadata.get("metadata", {}).get("description"),
            "creator": metadata.get("metadata", {}).get("creator"),
            "files": [
                {
                    "name": file.get("name"),
                    "size": file.get("size"),
                    "format": file.get("format"),
                    "original": f"https://archive.org/download/{item_id}/{file.get('name')}"
                }
                for file in metadata.get("files", []) if file.get("name").endswith(".mp4")
            ]
        }

        # Save refined metadata to a file
        metadata_file = os.path.join(output_folder, f"{sanitize_filename(item_id)}_metadata.json")
        with open(metadata_file, "w") as f:
            json.dump(refined_metadata, f, indent=4)
        logging.info(f"Refined metadata saved: {metadata_file}")

        # Download .mp4 files
        for file_info in refined_metadata["files"]:
            name = file_info["name"]
            file_url = file_info["original"]
            sanitized_name = sanitize_filename(name)
            target_file = os.path.join(output_folder, sanitized_name)

            logging.info(f"Starting download for file: {file_url}")
            download_file(file_url, target_file)

    except requests.RequestException as e:
        logging.error(f"Failed to fetch or process item {item_id}: {e}")

def download_file(url, output_path):
    """Download a file from a given URL and save it to the specified path."""
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with requests.get(url, stream=True, timeout=30) as response:
            response.raise_for_status()
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    logging.info(f"Downloading: {url} - {downloaded}/{total_size} bytes")
        logging.info(f"File saved: {output_path}")
    except requests.RequestException as e:
        logging.error(f"Failed to download {url}: {e}")

# Example usage
if __name__ == "__main__":
    item_id = input("Enter the Internet Archive item ID: ").strip()
    download_archive_item(item_id)