"""
Download Instagram highlights using direct HTTP requests.
Login via web API, then fetch highlight data and download media.
"""
import os
import json
import time
import requests

HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

HIGHLIGHT_IDS = {
    "creazioni": "18138808534098679",
    "flash": "17907459131894011",
    "merch": "17859497229473696"
}

TARGET_USERNAME = "valentine.ttt"
IG_EMAIL = "dropfxforthewin@gmail.com"
IG_PASS = "V*RY/Va_7z4HP29"

def create_session():
    """Create an authenticated Instagram session via web login."""
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.instagram.com/",
        "Origin": "https://www.instagram.com",
    })

    # Step 1: Load the login page to get CSRF token
    print("Step 1: Getting CSRF token...")
    r = s.get("https://www.instagram.com/accounts/login/", headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    })
    
    csrf_token = None
    if "csrftoken" in s.cookies:
        csrf_token = s.cookies["csrftoken"]
    
    if not csrf_token:
        # Try to extract from page content
        import re
        match = re.search(r'"csrf_token":"([^"]+)"', r.text)
        if match:
            csrf_token = match.group(1)
    
    if not csrf_token:
        # Try the API endpoint
        r2 = s.get("https://www.instagram.com/api/v1/web/accounts/login/ajax/")
        if "csrftoken" in s.cookies:
            csrf_token = s.cookies["csrftoken"]
    
    print(f"  CSRF token: {'found (' + csrf_token[:8] + '...)' if csrf_token else 'NOT FOUND'}")

    if not csrf_token:
        print("  ERROR: Could not get CSRF token")
        return None

    # Step 2: Submit login
    print("Step 2: Logging in...")
    s.headers.update({
        "X-CSRFToken": csrf_token,
        "X-IG-App-ID": "936619743392459",
    })

    login_data = {
        "enc_password": f"#PWD_INSTAGRAM_BROWSER:0:{int(time.time())}:{IG_PASS}",
        "username": IG_EMAIL,
        "queryParams": "{}",
        "optIntoOneTap": "false"
    }

    r = s.post(
        "https://www.instagram.com/api/v1/web/accounts/login/ajax/",
        data=login_data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": csrf_token,
        }
    )

    print(f"  Login response: {r.status_code}")
    
    try:
        login_resp = r.json()
        print(f"  Response: {json.dumps(login_resp, indent=2)[:500]}")
        
        if login_resp.get("authenticated"):
            print("  ✅ Login successful!")
            # Update CSRF token after login
            if "csrftoken" in s.cookies:
                s.headers["X-CSRFToken"] = s.cookies["csrftoken"]
            return s
        elif login_resp.get("two_factor_required"):
            print("  ⚠️ Two-factor authentication required!")
            return None
        elif login_resp.get("checkpoint_url"):
            print("  ⚠️ Checkpoint/verification required!")
            return None
        else:
            print(f"  ❌ Login failed: {login_resp.get('message', 'unknown error')}")
            return None
    except Exception as e:
        print(f"  Error parsing response: {e}")
        print(f"  Raw response: {r.text[:500]}")
        return None


def get_user_id(session, username):
    """Get user ID from username."""
    print(f"\nLooking up @{username}...")
    r = session.get(f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}")
    if r.status_code == 200:
        data = r.json()
        user_id = data.get("data", {}).get("user", {}).get("id")
        print(f"  User ID: {user_id}")
        return user_id
    print(f"  Error: {r.status_code}")
    return None


def get_highlights(session, user_id):
    """Get list of highlights for a user."""
    print(f"\nFetching highlights for user {user_id}...")
    
    # GraphQL query for highlights
    variables = json.dumps({
        "user_id": str(user_id),
        "include_chaining": False,
        "include_reel": False,
        "include_suggested_users": False,
        "include_logged_out_extras": False,
        "include_highlight_reels": True,
        "include_live_status": False
    })
    
    r = session.get(
        "https://www.instagram.com/graphql/query/",
        params={
            "query_hash": "d4d88dc1500312af6f937f7b804c68c3",
            "variables": variables
        }
    )
    
    if r.status_code == 200:
        data = r.json()
        edges = data.get("data", {}).get("user", {}).get("edge_highlight_reels", {}).get("edges", [])
        print(f"  Found {len(edges)} highlights")
        for edge in edges:
            node = edge.get("node", {})
            print(f"    - {node.get('title', '?')} (ID: {node.get('id', '?')})")
        return edges
    
    print(f"  Error fetching highlights: {r.status_code}")
    return []


def get_highlight_items(session, highlight_id):
    """Get items in a highlight reel."""
    print(f"  Fetching items for highlight {highlight_id}...")
    
    # Try the reels_media endpoint
    r = session.get(
        f"https://www.instagram.com/api/v1/feed/reels_media/",
        params={"reel_ids": f"highlight:{highlight_id}"}
    )
    
    if r.status_code == 200:
        data = r.json()
        
        # Try different response formats
        items = []
        if "reels_media" in data and data["reels_media"]:
            items = data["reels_media"][0].get("items", [])
        elif "reels" in data:
            key = f"highlight:{highlight_id}"
            if key in data["reels"]:
                items = data["reels"][key].get("items", [])
        
        print(f"  Found {len(items)} items")
        return items
    
    print(f"  Error: {r.status_code} - {r.text[:200]}")
    
    # Try GraphQL fallback
    print("  Trying GraphQL fallback...")
    variables = json.dumps({
        "highlight_reel_ids": [str(highlight_id)],
        "reel_ids": [],
        "location_ids": [],
        "precomposed_overlay": False
    })
    
    r = session.get(
        "https://www.instagram.com/graphql/query/",
        params={
            "query_hash": "45246d3fe16ccc6577e0bd297a5db1ab",
            "variables": variables
        }
    )
    
    if r.status_code == 200:
        data = r.json()
        reels = data.get("data", {}).get("reels_media", [])
        if reels:
            items = reels[0].get("items", [])
            print(f"  GraphQL: Found {len(items)} items")
            return items
    
    print(f"  GraphQL error: {r.status_code}")
    return []


def download_file(url, filepath):
    """Download a media file."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/"
    }
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(filepath, "wb") as f:
                f.write(r.content)
            return len(r.content)
    except Exception as e:
        print(f"    Error: {e}")
    return 0


def main():
    print("=" * 50)
    print("  INSTAGRAM HIGHLIGHT DOWNLOADER")
    print("=" * 50)

    session = create_session()
    if not session:
        print("\n❌ Login failed. Cannot proceed.")
        return

    # Download highlights
    total = 0
    for name, h_id in HIGHLIGHT_IDS.items():
        dest_dir = os.path.join(HIGHLIGHTS_DIR, name)
        os.makedirs(dest_dir, exist_ok=True)

        # Clean existing
        for f in os.listdir(dest_dir):
            fp = os.path.join(dest_dir, f)
            if os.path.isfile(fp):
                os.remove(fp)

        print(f"\n{'=' * 50}")
        print(f"  Highlight: {name} (ID: {h_id})")
        print(f"{'=' * 50}")

        items = get_highlight_items(session, h_id)
        if not items:
            print(f"  No items found for {name}")
            continue

        # Get last 12 items
        items_to_dl = items[-12:]

        for idx, item in enumerate(items_to_dl):
            media_idx = idx + 1
            media_type = item.get("media_type", 1)

            url = None
            ext = ".jpg"

            if media_type == 2:
                # Video
                videos = item.get("video_versions", [])
                if videos:
                    url = videos[0].get("url")
                    ext = ".mp4"

            if not url:
                # Image
                candidates = item.get("image_versions2", {}).get("candidates", [])
                if candidates:
                    # Get highest resolution
                    best = max(candidates, key=lambda c: c.get("width", 0) * c.get("height", 0))
                    url = best.get("url")
                    ext = ".jpg"

            if not url:
                print(f"  {media_idx}. No URL found, skipping")
                continue

            filename = f"story_{media_idx:02d}{ext}"
            filepath = os.path.join(dest_dir, filename)

            print(f"  {media_idx}. {filename}...", end=" ")
            size = download_file(url, filepath)
            if size > 0:
                print(f"✅ {size:,} bytes")
                total += 1
            else:
                print("❌")

        time.sleep(1)  # Rate limit

    print(f"\n{'=' * 50}")
    print(f"  COMPLETED: {total} files downloaded")
    print(f"{'=' * 50}")

    # Summary
    for name in HIGHLIGHT_IDS:
        d = os.path.join(HIGHLIGHTS_DIR, name)
        if os.path.exists(d):
            files = [f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))]
            sz = sum(os.path.getsize(os.path.join(d, f)) for f in files)
            print(f"  {name}: {len(files)} files ({sz:,} bytes)")


if __name__ == "__main__":
    main()
