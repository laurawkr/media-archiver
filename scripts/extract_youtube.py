import os
import subprocess
import json

def extract_youtube_metadata(video_url, output_folder="data/youtube"):
    os.makedirs(output_folder, exist_ok=True)

    # Use yt-dlp to fetch metadata
    command = [
        "yt-dlp",
        "--dump-json",  # Output metadata as JSON
        "--skip-download",  # Only fetch metadata
        video_url
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        raw_metadata = json.loads(result.stdout)

        # Extract relevant metadata
        refined_metadata = {
            "id": raw_metadata["id"],
            "title": raw_metadata["title"],
            "duration": raw_metadata.get("duration"),
            "uploader": raw_metadata.get("uploader"),
            "upload_date": raw_metadata.get("upload_date"),
            "thumbnail": raw_metadata.get("thumbnail"),
            "formats": [
                {
                    "format_id": f["format_id"],
                    "url": f["url"],
                    "filesize": f.get("filesize") or f.get("filesize_approx"),
                    "ext": f["ext"],
                    "resolution": f.get("resolution"),
                    "fps": f.get("fps")
                }
                for f in raw_metadata.get("formats", [])
            ]
        }

        # Save metadata to JSON
        output_file = os.path.join(output_folder, f"{refined_metadata['id']}.json")
        with open(output_file, "w") as f:
            json.dump(refined_metadata, f, indent=4)
        print(f"Metadata saved: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Failed to fetch metadata for {video_url}: {e}")

# Example usage
if __name__ == "__main__":
    video_url = input("Enter a YouTube video URL: ")
    extract_youtube_metadata(video_url)