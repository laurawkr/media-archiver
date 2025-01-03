import os
import requests
import json

def download_archive_metadata(item_id, output_folder="data/internet_archive"):
    os.makedirs(output_folder, exist_ok=True)
    api_url = f"https://archive.org/metadata/{item_id}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        raw_metadata = response.json()

        # Extract relevant metadata
        refined_metadata = {
            "id": item_id,
            "title": raw_metadata.get("metadata", {}).get("title"),
            "duration": None,  # Internet Archive API may not provide this
            "uploader": raw_metadata.get("metadata", {}).get("creator"),
            "upload_date": raw_metadata.get("metadata", {}).get("date"),
            "thumbnail": None,  # No direct thumbnail in metadata
            "formats": [
                {
                    "format_id": f.get("name"),
                    "url": f"https://archive.org/download/{item_id}/{f['name']}",
                    "filesize": f.get("size"),
                    "ext": os.path.splitext(f.get("name", ""))[1][1:],  # Extract extension
                    "resolution": None,
                    "fps": None
                }
                for f in raw_metadata.get("files", []) if f.get("name", "").endswith(".mp4")
            ]
        }

        # Save metadata to JSON
        output_file = os.path.join(output_folder, f"{refined_metadata['id']}.json")
        with open(output_file, "w") as f:
            json.dump(refined_metadata, f, indent=4)
        print(f"Metadata saved: {output_file}")

    except requests.RequestException as e:
        print(f"Failed to fetch metadata for {item_id}: {e}")

# Example usage
if __name__ == "__main__":
    item_id = input("Enter the Internet Archive item ID: ")
    download_archive_metadata(item_id)