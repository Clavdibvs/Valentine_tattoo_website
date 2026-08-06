import asyncio
from playwright.async_api import async_playwright
import os
import json
import requests

HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

HIGHLIGHT_MAP = [
    ("creazioni", "18138808534098679"),
    ("flash", "17907459131894011"),
    ("merch", "17859497229473696")
]

def download_file(url, filepath):
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
            print(f"    HTTP {r.status_code}, size={len(r.content)}")
            return 0
    except Exception as e:
        print(f"    Error: {e}")
        return 0

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        # Step 1: Login
        print("Navigating to Instagram login...")
        await page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Accept cookies if prompted
        try:
            cookie_btn = page.locator("button:has-text('Consenti'), button:has-text('Allow'), button:has-text('Accept')")
            if await cookie_btn.count() > 0:
                await cookie_btn.first.click()
                await page.wait_for_timeout(1000)
        except:
            pass

        print("Entering credentials...")
        username_input = page.locator("input[name='username']")
        password_input = page.locator("input[name='password']")

        await username_input.fill("dropfxforthewin@gmail.com")
        await page.wait_for_timeout(500)
        await password_input.fill("V*RY/Va_7z4HP29")
        await page.wait_for_timeout(500)

        # Click login button
        login_btn = page.locator("button[type='submit']")
        await login_btn.click()
        print("Login submitted, waiting for response...")
        await page.wait_for_timeout(6000)

        # Check if login succeeded
        cookies = await context.cookies()
        session_cookie = next((c for c in cookies if c['name'] == 'sessionid'), None)
        if session_cookie:
            print(f"Login successful! Session ID obtained.")
        else:
            print("Checking login status...")
            # Maybe there's a 2FA or "save login" prompt
            try:
                not_now = page.locator("button:has-text('Non ora'), button:has-text('Not Now'), button:has-text('Not now')")
                if await not_now.count() > 0:
                    await not_now.first.click()
                    await page.wait_for_timeout(2000)
            except:
                pass
            
            # Check again
            cookies = await context.cookies()
            session_cookie = next((c for c in cookies if c['name'] == 'sessionid'), None)
            if session_cookie:
                print("Login successful after dismissing prompt!")
            else:
                current_url = page.url
                print(f"Current URL: {current_url}")
                # Take screenshot for debugging
                print("Login may have failed or requires verification. Trying to proceed anyway...")

        # Dismiss any "turn on notifications" prompt
        try:
            not_now = page.locator("button:has-text('Non ora'), button:has-text('Not Now'), button:has-text('Not now')")
            if await not_now.count() > 0:
                await not_now.first.click()
                await page.wait_for_timeout(1000)
        except:
            pass

        # Step 2: Extract CSRF token
        cookies = await context.cookies()
        csrf_token = ""
        for c in cookies:
            if c['name'] == 'csrftoken':
                csrf_token = c['value']
                break

        print(f"CSRF token: {'found' if csrf_token else 'not found'}")

        # Step 3: Fetch highlights via API
        all_results = {}

        for name, h_id in HIGHLIGHT_MAP:
            print(f"\nFetching highlight '{name}' ({h_id})...")
            
            result = await page.evaluate(f"""
                (async () => {{
                    try {{
                        const response = await fetch('/api/v1/feed/reels_media/?reel_ids=highlight%3A{h_id}', {{
                            headers: {{
                                'X-CSRFToken': '{csrf_token}',
                                'X-Requested-With': 'XMLHttpRequest',
                                'X-IG-App-ID': '936619743392459'
                            }},
                            credentials: 'include'
                        }});
                        const data = await response.json();
                        let items = [];
                        if (data.reels_media && data.reels_media.length > 0) {{
                            items = data.reels_media[0].items || [];
                        }} else if (data.reels) {{
                            const key = 'highlight:{h_id}';
                            if (data.reels[key]) items = data.reels[key].items || [];
                        }}
                        return items.slice(-12).map((item, idx) => {{
                            if (item.video_versions && item.video_versions.length > 0) {{
                                return {{ index: idx+1, type: 'video', url: item.video_versions[0].url, w: item.video_versions[0].width, h: item.video_versions[0].height }};
                            }} else if (item.image_versions2 && item.image_versions2.candidates) {{
                                const best = item.image_versions2.candidates[0];
                                return {{ index: idx+1, type: 'image', url: best.url, w: best.width, h: best.height }};
                            }}
                            return null;
                        }}).filter(Boolean);
                    }} catch(e) {{
                        return [{{"error": e.toString()}}];
                    }}
                }})()
            """)

            all_results[name] = result
            print(f"  Found {len(result)} items for '{name}'")
            for item in result:
                if 'error' in item:
                    print(f"  ERROR: {item['error']}")
                else:
                    print(f"  {item['index']}. [{item['type']}] {item.get('w','?')}x{item.get('h','?')}")

        # Step 4: Download all media
        print("\n==========================================")
        print("  DOWNLOADING HIGHLIGHT MEDIA")
        print("==========================================")

        total = 0
        for name, items in all_results.items():
            dest_dir = os.path.join(HIGHLIGHTS_DIR, name)
            os.makedirs(dest_dir, exist_ok=True)
            
            # Clean existing files
            for existing in os.listdir(dest_dir):
                fp = os.path.join(dest_dir, existing)
                if os.path.isfile(fp):
                    os.remove(fp)

            print(f"\n--- {name}: {len(items)} items ---")
            for item in items:
                if 'error' in item:
                    continue
                idx = item['index']
                ext = ".mp4" if item['type'] == 'video' else ".jpg"
                filename = f"story_{idx:02d}{ext}"
                filepath = os.path.join(dest_dir, filename)
                
                print(f"  Downloading {filename}...", end=" ")
                size = download_file(item['url'], filepath)
                if size > 0:
                    print(f"OK ({size:,} bytes)")
                    total += 1
                else:
                    print("FAILED")

        await browser.close()

        print(f"\n==========================================")
        print(f"  COMPLETED: {total} files downloaded")
        print(f"==========================================")

if __name__ == "__main__":
    asyncio.run(main())
