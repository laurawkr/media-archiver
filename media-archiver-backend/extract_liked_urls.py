from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from time import sleep
import sys


def get_public_video_urls(username):
    """
    Retrieves public video URLs from a TikTok user's profile.
    No login required.
    """
    # Initialize Selenium WebDriver (Ensure the correct driver is installed, e.g., ChromeDriver)
    driver = webdriver.Chrome()  # Or use your specific WebDriver, e.g., Firefox
    base_url = f"https://www.tiktok.com/@{username}"
    
    try:
        # Navigate to the TikTok user's public profile
        driver.get(base_url)
        wait_time = 15    
        sleep(wait_time)
        time.sleep(3)
        for _ in range(10):
            driver.execute_script("window.scrollBy(0, 1000);")
            sleep(3)
            time.sleep(2)  # Allow time for the page to load

        # Collect video URLs
        video_urls = []
        videos = driver.find_elements(By.CSS_SELECTOR, "a[href*='/video/']")
        for video in videos:
            video_urls.append(video.get_attribute("href"))

        return video_urls

    except Exception as e:
        print(f"Error occurred: {e}")
        return []

    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No Username provided.", file=sys.stderr)
        sys.exit(1)
    username = sys.argv[1]
    urls = get_public_video_urls(username)
    for url in urls:
        print(url)  # This ensures URLs are output line by line


