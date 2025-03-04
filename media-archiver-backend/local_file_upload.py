import os
import json
import shutil
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    filename="local_media_uploader_debug.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def sanitize_filename(filename):
    """Sanitize file names to ensure compatibility across file systems."""
    return "".join(c if c.isalnum() or c in " ._-()" else "_" for c in filename)

def buffered_copy(src, dest, buffer_size=1024 * 1024):
    """Copy a file in chunks to handle large files."""
    with open(src, "rb") as src_file, open(dest, "wb") as dest_file:
        while chunk := src_file.read(buffer_size):
            dest_file.write(chunk)

def upload_local_media(file_path, output_folder="/Volumes/media-archiver/LocalUpload"):
    """
    Upload a local media file, generate metadata, and save the file in a dedicated folder.
    """
    try:
        # Normalize and resolve the file path
        file_path = os.path.abspath(file_path)
        logging.debug(f"Raw input file path: {file_path}")
        logging.debug(f"Normalized file path: {file_path}")

        # Check if the input file exists
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            raise FileNotFoundError(f"File not found: {file_path}")

        # Ensure the output folder exists
        if not os.path.exists(output_folder):
            logging.info(f"Creating output folder: {output_folder}")
            os.makedirs(output_folder, exist_ok=True)

        # Generate folder and file paths
        file_name = os.path.basename(file_path)
        sanitized_name = sanitize_filename(file_name)
        video_folder = os.path.join(output_folder, os.path.splitext(sanitized_name)[0])
        
        if not os.path.exists(video_folder):
            logging.info(f"Creating video folder: {video_folder}")
            os.makedirs(video_folder, exist_ok=True)

        # Copy the file to the new folder using buffered copy
        destination_path = os.path.join(video_folder, sanitized_name)
        logging.info(f"Copying file to: {destination_path}")
        buffered_copy(file_path, destination_path)
        logging.info(f"File uploaded to: {destination_path}")

        # Generate metadata
        metadata = {
            "id": os.path.splitext(sanitized_name)[0],
            "title": os.path.splitext(file_name)[0],
            "source_url": "Local Path",
            "duration": None,  # Duration can be added if needed
            "uploader": "Local User",
            "upload_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "thumbnail": "https://static.thenounproject.com/png/82078-200.png",
            "best_format": {
                "format_id": "Local File",
                "filesize": os.path.getsize(destination_path),
                "ext": os.path.splitext(file_name)[-1],
                "resolution": None,
                "fps": None
            }
        }

        # Save metadata in the same folder
        metadata_filename = os.path.join(video_folder, f"{metadata['id']}_metadata.json")
        with open(metadata_filename, "w") as metadata_file:
            json.dump(metadata, metadata_file, indent=4)
        logging.info(f"Metadata saved to: {metadata_filename}")

        return metadata_filename, destination_path

    except Exception as e:
        logging.error(f"Error occurred: {e}")
        raise
