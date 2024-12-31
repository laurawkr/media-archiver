import os
import subprocess

def download_youtube_video(video_url, output_folder="data/youtube"):
    """
    Download a YouTube video with its metadata using yt-dlp.
    
    Args:
        video_url (str): URL of the YouTube video.
        output_folder (str): Folder to save the video and metadata.
    """
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Command to download video and metadata
    command = [
        "yt-dlp",
        "--write-info-json",  # Save metadata as JSON
        "--merge-output-format", "mp4",  # Ensure output is a single MP4 file
        "--output", os.path.join(output_folder, "%(title)s.%(ext)s"),  # Save video with its title
        video_url
    ]

    # Run the command
    try:
        subprocess.run(command, check=True)
        print(f"Video and metadata downloaded successfully for {video_url}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to download video for {video_url}: {e}")

# Example usage
if __name__ == "__main__":
    video_url = input("Enter a YouTube video URL: ")
    download_youtube_video(video_url)