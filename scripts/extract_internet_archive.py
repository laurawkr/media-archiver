import os
import requests
import json

def download_archive_item(item_id, output_folder="data/internet_archive"):
    """
    Download metadata and files for an item from the Internet Archive.
    
    Args:
        item_id (str): The identifier for the item on the Internet Archive (e.g., "ExampleID").
        output_folder (str): Folder to save the files and metadata.
    """
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Base URL for the Internet Archive API
    api_url = f"https://archive.org/metadata/{item_id}"

    try:
        # Fetch metadata
        response = requests.get(api_url)
        response.raise_for_status()
        metadata = response.json()

        # Save metadata as a JSON file
        metadata_file = os.path.join(output_folder, f"{item_id}.json")
        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=4)
        print(f"Metadata saved: {metadata_file}")

        # Download media files
        for file in metadata.get("files", []):
            name = file.get("name")
            if name.endswith((".mp4", ".avi", ".mkv", ".mp3", ".flac", ".wav")):  # Adjust extensions as needed
                file_url = f"https://archive.org/download/{item_id}/{name}"
                output_file = os.path.join(output_folder, name)
                print(f"Downloading: {file_url}")
                with requests.get(file_url, stream=True) as file_response:
                    file_response.raise_for_status()
                    with open(output_file, "wb") as f:
                        for chunk in file_response.iter_content(chunk_size=8192):
                            f.write(chunk)
                print(f"File saved: {output_file}")
    except requests.RequestException as e:
        print(f"Failed to fetch data for {item_id}: {e}")

# Example usage
if __name__ == "__main__":
    item_id = input("Enter the Internet Archive item ID: ")
    download_archive_item(item_id)