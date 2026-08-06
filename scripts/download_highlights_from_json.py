"""
Downloader per media Instagram highlights.
Legge il file highlight_urls.json generato dallo script JS della console
e scarica tutti i media nelle cartelle corrette.
"""
import json
import os
import requests
import sys

HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

def download_file(url, filepath):
    """Download a file from URL with proper headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
        "Origin": "https://www.instagram.com"
    }
    try:
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(filepath, "wb") as f:
                f.write(r.content)
            return len(r.content)
        else:
            print(f"  ⚠️  HTTP {r.status_code}, size={len(r.content)} — skipped")
            return 0
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def main():
    # Look for highlight_urls.json in common locations
    possible_paths = [
        os.path.expanduser("~/Downloads/highlight_urls.json"),
        "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/highlight_urls.json",
        "highlight_urls.json"
    ]
    
    json_path = None
    for p in possible_paths:
        if os.path.exists(p):
            json_path = p
            break
    
    if not json_path:
        print("❌ File highlight_urls.json non trovato!")
        print("   Cercato in:")
        for p in possible_paths:
            print(f"   - {p}")
        print("\n   Esegui prima lo script JS nella console del browser.")
        sys.exit(1)
    
    print(f"📂 Trovato file: {json_path}")
    
    with open(json_path, "r") as f:
        data = json.load(f)
    
    total_downloaded = 0
    
    for highlight_name, items in data.items():
        dest_dir = os.path.join(HIGHLIGHTS_DIR, highlight_name)
        os.makedirs(dest_dir, exist_ok=True)
        
        # Clean existing files
        for existing in os.listdir(dest_dir):
            os.remove(os.path.join(dest_dir, existing))
        
        print(f"\n==========================================")
        print(f"  Downloading Highlight: {highlight_name}")
        print(f"  {len(items)} media items")
        print(f"==========================================")
        
        for item in items:
            idx = item["index"]
            media_type = item["type"]
            url = item["url"]
            ext = ".mp4" if media_type == "video" else ".jpg"
            filename = f"story_{idx:02d}{ext}"
            filepath = os.path.join(dest_dir, filename)
            
            print(f"  📥 {filename} [{media_type}] {item.get('width','?')}x{item.get('height','?')}...", end=" ")
            size = download_file(url, filepath)
            if size > 0:
                print(f"✅ {size:,} bytes")
                total_downloaded += 1
            else:
                print("❌ failed")
    
    print(f"\n==========================================")
    print(f"  DOWNLOAD COMPLETATO!")
    print(f"  {total_downloaded} file scaricati in {HIGHLIGHTS_DIR}")
    print(f"==========================================")

if __name__ == "__main__":
    main()
