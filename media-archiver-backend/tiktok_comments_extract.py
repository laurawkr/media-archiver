import logging
import os
import sys
import json
import re
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By

logging.basicConfig(
    filename="tiktok_comments_extract.log",
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

def save_comments_to_metadata(video_id, comments, metadata_file_path):
    """
    Save extracted comments into the metadata JSON file.
    """
    # If metadata doesn't exist yet, create a minimal skeleton.
    if not os.path.exists(metadata_file_path):
        logging.warning(f"Metadata file not found. Creating one at: {metadata_file_path}")
        with open(metadata_file_path, "w") as f:
            # Basic skeleton with just ID and empty comments
            json.dump({"id": video_id, "comments": []}, f, indent=4)

    # Load existing metadata
    with open(metadata_file_path, "r") as file:
        metadata = json.load(file)

    # Append or overwrite the "comments" field
    metadata["comments"] = comments

    # Save updated metadata back to the file
    with open(metadata_file_path, "w") as file:
        json.dump(metadata, file, indent=4)
    print(f"Comments saved to metadata file: {metadata_file_path}")
    logging.info(f"Comments saved to metadata file: {metadata_file_path}")

def main():
    """
    Usage:
      python3 tiktok_comments_extract.py "https://www.tiktok.com/@someuser/video/123..."
    """
    if len(sys.argv) < 2:
        print("Error: No TikTok URL provided.")
        sys.exit(1)

    tiktok_url = sys.argv[1]
    output_folder = "/Volumes/media-archiver/TikTok"  # same as your other script

    logging.info("Starting TikTok comments extraction script...")
    logging.info(f"Using URL: {tiktok_url}")

    # 1) Quickly fetch metadata (ID, title, etc.) with skip-download
    import subprocess
    try:
        logging.info("Fetching TikTok metadata with yt-dlp (skip-download)...")
        command = ["yt-dlp", "--dump-json", "--skip-download", tiktok_url]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        raw_metadata = json.loads(result.stdout)

        video_id = raw_metadata["id"]
        logging.info(f"Extracted video_id: {video_id}")

        # Build folder and metadata path, mirroring your existing approach
        video_folder = os.path.join(output_folder, sanitize_filename(video_id))
        os.makedirs(video_folder, exist_ok=True)

        metadata_file_path = os.path.join(
            video_folder,
            f"{sanitize_filename(video_id)}_metadata.json"
        )

    except subprocess.CalledProcessError as e:
        logging.error(f"yt-dlp metadata fetch error: {e.stderr}")
        print("Error: Unable to fetch metadata with yt-dlp.")
        sys.exit(1)

    # 2) Initialize WebDriver and scrape comments
    driver = webdriver.Chrome()
    logging.info("Chrome WebDriver launched successfully.")

    logging.info(f"Navigating to TikTok URL: {tiktok_url}")
    driver.get(tiktok_url)

    # Wait a bit so you can solve puzzle/CAPTCHA if needed
    wait_time = 15
    logging.info(f"Waiting {wait_time} seconds for puzzle solving, if any...")
    sleep(wait_time)
    logging.info("Continuing after initial wait period...")

    # Scroll to load comments
    logging.info("Scrolling to load comments...")
    for _ in range(10):
        driver.execute_script("window.scrollBy(0, 1000);")
        sleep(3)

    # Extract comments
    logging.info("Extracting comments...")
    comments_elements = driver.find_elements(By.CSS_SELECTOR, "p.TUXText--tiktok-sans")
    comments = [element.text for element in comments_elements]
    logging.info(f"Found {len(comments)} comments.")

    driver.quit()
    logging.info("Chrome WebDriver closed.")

    # 3) Save comments to metadata file
    save_comments_to_metadata(video_id, comments, metadata_file_path)

    logging.info("TikTok comments extraction script completed.")

if __name__ == "__main__":
    main()

