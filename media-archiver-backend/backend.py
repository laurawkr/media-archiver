from flask import Flask, request, jsonify
import subprocess
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Apply CORS to the Flask app

def determine_source(url):
    """Determine the source of the URL (YouTube, TikTok, or Internet Archive)."""
    if "youtube.com" in url or "youtu.be" in url:
        return "YouTube"
    elif "tiktok.com" in url:
        return "TikTok"
    elif "archive.org" in url:
        return "InternetArchive"
    return None

@app.route('/process-url', methods=['POST'])
def process_url():
    """Endpoint to process a media URL."""
    data = request.json
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    source = determine_source(url)
    if not source:
        return jsonify({"error": "Unsupported URL"}), 400

    try:
        if source == "YouTube":
            subprocess.run(["python3", "extract_youtube.py", url], check=True)
        elif source == "TikTok":
            subprocess.run(["python3", "extract_tiktok.py", url], check=True)
        elif source == "InternetArchive":
            item_id = re.search(r"/details/([^/]+)", url).group(1)
            subprocess.run(["python3", "extract_internet_archive.py", item_id], check=True)

        return jsonify({"message": f"{source} processing started for URL: {url}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)