"""
Download Instagram highlights using instagrapi (direct API, no browser needed).
"""
import os
import sys
import json
import requests
from instagrapi import Client

HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"
SESSION_FILE = "/tmp/ig_session.json"

HIGHLIGHT_IDS = {
    "creazioni": "18138808534098679",
    "flash": "17907459131894011",
    "merch": "17859497229473696"
}

TARGET_USERNAME = "valentine.ttt"

def download_url(url, filepath):
    headers = {
        "User-Agent": "Instagram 275.0.0.27.98 Android",
        "Referer": "https://www.instagram.com/"
    }
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(filepath, "wb") as f:
                f.write(r.content)
            return len(r.content)
    except Exception as e:
        print(f"    Download error: {e}")
    return 0

def main():
    print("=" * 50)
    print("  INSTAGRAM HIGHLIGHT DOWNLOADER (instagrapi)")
    print("=" * 50)

    cl = Client()
    cl.delay_range = [1, 3]

    # Try to load existing session
    if os.path.exists(SESSION_FILE):
        print("Loading existing session...")
        try:
            cl.load_settings(SESSION_FILE)
            cl.login("dropfxforthewin@gmail.com", "V*RY/Va_7z4HP29")
            print("Session restored!")
        except Exception as e:
            print(f"Session restore failed: {e}")
            print("Logging in fresh...")
            cl = Client()
            cl.login("dropfxforthewin@gmail.com", "V*RY/Va_7z4HP29")
            cl.dump_settings(SESSION_FILE)
    else:
        print("Logging in...")
        cl.login("dropfxforthewin@gmail.com", "V*RY/Va_7z4HP29")
        cl.dump_settings(SESSION_FILE)
        print("Login successful! Session saved.")

    # Get user ID for valentine.ttt
    print(f"\nLooking up user @{TARGET_USERNAME}...")
    user_id = cl.user_id_from_username(TARGET_USERNAME)
    print(f"User ID: {user_id}")

    # Get highlights
    print(f"\nFetching highlights for user {user_id}...")
    highlights = cl.user_highlights(user_id)
    print(f"Found {len(highlights)} highlights total")

    for h in highlights:
        print(f"  - {h.title} (ID: {h.pk}, items: {len(h.items) if h.items else '?'})")

    # Download each target highlight
    for name, h_id in HIGHLIGHT_IDS.items():
        dest_dir = os.path.join(HIGHLIGHTS_DIR, name)
        os.makedirs(dest_dir, exist_ok=True)

        # Clean existing files
        for existing in os.listdir(dest_dir):
            fp = os.path.join(dest_dir, existing)
            if os.path.isfile(fp):
                os.remove(fp)

        print(f"\n{'=' * 50}")
        print(f"  Downloading Highlight: {name} (ID: {h_id})")
        print(f"{'=' * 50}")

        # Find matching highlight
        target_highlight = None
        for h in highlights:
            if str(h.pk) == h_id or h_id in str(h.pk):
                target_highlight = h
                break

        if not target_highlight:
            # Try fetching by highlight ID directly
            print(f"  Highlight not found by PK, trying highlight_info...")
            try:
                target_highlight = cl.highlight_info(h_id)
            except Exception as e:
                print(f"  Could not fetch highlight {h_id}: {e}")
                continue

        if not target_highlight:
            print(f"  ERROR: Highlight '{name}' not found!")
            continue

        items = target_highlight.items or []
        print(f"  Total items in highlight: {len(items)}")

        # Get last 12 items
        items_to_download = items[-12:] if len(items) > 12 else items

        for idx, item in enumerate(items_to_download):
            media_idx = idx + 1

            if item.media_type == 2 and item.video_url:
                # Video
                url = str(item.video_url)
                ext = ".mp4"
            elif item.thumbnail_url:
                # Image - use highest res
                url = str(item.thumbnail_url)
                ext = ".jpg"
            elif item.image_versions2 and item.image_versions2.candidates:
                url = str(item.image_versions2.candidates[0].url)
                ext = ".jpg"
            else:
                print(f"  {media_idx}. No media URL found, skipping")
                continue

            filename = f"story_{media_idx:02d}{ext}"
            filepath = os.path.join(dest_dir, filename)

            print(f"  {media_idx}. Downloading {filename}...", end=" ")
            size = download_url(url, filepath)
            if size > 0:
                print(f"OK ({size:,} bytes)")
            else:
                # Try alternative: use instagrapi's built-in download
                print("retrying with direct download...", end=" ")
                try:
                    if item.media_type == 2:
                        path = cl.story_download(item.pk, folder=dest_dir, filename=f"story_{media_idx:02d}")
                    else:
                        path = cl.story_download(item.pk, folder=dest_dir, filename=f"story_{media_idx:02d}")
                    if path and os.path.exists(str(path)):
                        print(f"OK ({os.path.getsize(str(path)):,} bytes)")
                    else:
                        print("FAILED")
                except Exception as e:
                    print(f"FAILED: {e}")

        saved_count = len([f for f in os.listdir(dest_dir) if os.path.isfile(os.path.join(dest_dir, f))])
        print(f"  ✓ {name}: {saved_count} files saved")

    print(f"\n{'=' * 50}")
    print(f"  ALL HIGHLIGHTS DOWNLOADED!")
    print(f"{'=' * 50}")

    # Summary
    for name in HIGHLIGHT_IDS:
        dest_dir = os.path.join(HIGHLIGHTS_DIR, name)
        if os.path.exists(dest_dir):
            files = [f for f in os.listdir(dest_dir) if os.path.isfile(os.path.join(dest_dir, f))]
            total_size = sum(os.path.getsize(os.path.join(dest_dir, f)) for f in files)
            print(f"  {name}: {len(files)} files ({total_size:,} bytes)")

if __name__ == "__main__":
    main()
