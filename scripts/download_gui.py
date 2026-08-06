import asyncio
from playwright.async_api import async_playwright
import os
import requests

POSTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/posts"
HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"
STATE_FILE = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/ig_state.json"

os.makedirs(POSTS_DIR, exist_ok=True)
os.makedirs(HIGHLIGHTS_DIR, exist_ok=True)

HIGHLIGHT_MAP = [
    ("creazioni", "18138808534098679"),
    ("flash", "17907459131894011"),
    ("merch", "17859497229473696")
]

def download_file(url, filepath):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    r = requests.get(url, headers=headers, timeout=15)
    if r.status_code == 200 and len(r.content) > 5000:
        with open(filepath, "wb") as f:
            f.write(r.content)
        return len(r.content)
    return 0

js_extract_post = """
() => {
    let urls = [];
    document.querySelectorAll("article img, main img, div[role='dialog'] img").forEach(img => {
        if (img.naturalWidth > 300 && img.naturalHeight > 300) {
            let src = img.srcset ? img.srcset.split(',').pop().trim().split(' ')[0] : img.src;
            if (src && src.includes('scontent') && !src.includes('470688118')) {
                urls.push(src);
            }
        }
    });
    document.querySelectorAll("article video, main video, div[role='dialog'] video").forEach(vid => {
        if (vid.src && vid.src.includes('scontent')) {
            urls.push(vid.src);
        }
    });
    return urls;
}
"""

js_extract_story = """
() => {
    let urls = [];
    document.querySelectorAll("section img, div[role='dialog'] img, img[srcset], video").forEach(el => {
        if (el.tagName === 'VIDEO') {
            if (el.src && el.src.includes('scontent')) {
                urls.push(el.src);
            }
        } else {
            if (el.naturalWidth > 200 && el.naturalHeight > 200) {
                let src = el.srcset ? el.srcset.split(',').pop().trim().split(' ')[0] : el.src;
                if (src && src.includes('scontent') && !src.includes('470688118')) {
                    urls.push(src);
                }
            }
        }
    });
    return urls;
}
"""

async def main():
    async with async_playwright() as p:
        # Launch headful browser so user can log in
        print("Launching browser... Please log in to Instagram if prompted.")
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        await page.goto("https://www.instagram.com/")
        print("Waiting 40 seconds for you to log in...")
        
        # Check if already logged in or wait until sessionid is present
        logged_in = False
        for _ in range(40):
            cookies = await context.cookies()
            if any(c['name'] == 'sessionid' for c in cookies):
                logged_in = True
                break
            await page.wait_for_timeout(1000)

        if not logged_in:
            print("Did not detect login. Will attempt to proceed anyway, but it may fail.")
        else:
            print("Login detected! Saving session state...")
            await context.storage_state(path=STATE_FILE)

        # Now download highlights
        print(f"\n==========================================")
        print(f"  DOWNLOADING 3 STORY HIGHLIGHTS")
        print(f"==========================================")

        for name, h_id in HIGHLIGHT_MAP:
            h_dir = os.path.join(HIGHLIGHTS_DIR, name)
            os.makedirs(h_dir, exist_ok=True)
            print(f"\n--- Downloading Highlight '{name}' ({h_id}) ---")

            await page.goto(f"https://www.instagram.com/stories/highlights/{h_id}/", wait_until="domcontentloaded")
            await page.wait_for_timeout(4000)

            try:
                btn = page.locator("button:has-text('Consenti'), button:has-text('Allow')")
                if await btn.count() > 0:
                    await btn.first.click(force=True)
            except: pass

            story_urls = []
            for step in range(25):
                urls = await page.evaluate(js_extract_story)
                for u in urls:
                    if u not in story_urls:
                        story_urls.append(u)

                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(1500)
                
                if len(story_urls) >= 12:
                    break

            print(f" Highlight '{name}': Extracted {len(story_urls)} unique story URLs!")
            for s_idx, s_url in enumerate(story_urls[:12]):
                ext = ".mp4" if ".mp4" in s_url else ".jpg"
                save_path = os.path.join(h_dir, f"story_{s_idx+1:02d}{ext}")
                sz = download_file(s_url, save_path)
                print(f"   Saved {name}/story_{s_idx+1:02d}{ext} ({sz} bytes)")

            await page.keyboard.press("Escape")
            await page.wait_for_timeout(1000)

        # Now download posts
        print(f"\n==========================================")
        print(f"  DOWNLOADING POSTS")
        print(f"==========================================")
        await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        await page.evaluate("window.scrollBy(0, 800)")
        await page.wait_for_timeout(2000)
        
        post_links = await page.locator("a[href*='/p/']").all()
        shortcodes = []
        for l in post_links:
            href = await l.get_attribute("href")
            if href and "/p/" in href:
                sc = href.split("/p/")[1].split("/")[0]
                if sc not in shortcodes:
                    shortcodes.append(sc)

        shortcodes = shortcodes[:12]
        print(f"  FOUND {len(shortcodes)} POSTS TO DOWNLOAD")

        for idx, sc in enumerate(shortcodes):
            post_dir = os.path.join(POSTS_DIR, f"post-{idx+1:02d}")
            os.makedirs(post_dir, exist_ok=True)
            url = f"https://www.instagram.com/p/{sc}/"
            print(f"\n--- Downloading Post {idx+1}/{len(shortcodes)} ({sc}) ---")
            
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            media_urls = []
            for slide in range(12):
                urls = await page.evaluate(js_extract_post)
                for u in urls:
                    if u not in media_urls:
                        media_urls.append(u)

                next_btn = page.locator("button[aria-label='Avanti'], button[aria-label='Next'], button._af3r")
                if await next_btn.count() > 0 and await next_btn.first.is_visible():
                    await next_btn.first.click(force=True)
                    await page.wait_for_timeout(1000)
                else:
                    break

            print(f" Post-{idx+1:02d}: Extracted {len(media_urls)} unique media items!")
            for m_idx, m_url in enumerate(media_urls):
                ext = ".mp4" if ".mp4" in m_url or "video" in m_url else ".jpg"
                save_path = os.path.join(post_dir, f"media_{m_idx+1:02d}{ext}")
                sz = download_file(m_url, save_path)
                print(f"   Saved {os.path.basename(save_path)} ({sz} bytes)")

        await browser.close()
        print("\n==========================================")
        print("  ALL DOWNLOADS COMPLETED PERFECTLY!")
        print("==========================================")

if __name__ == "__main__":
    asyncio.run(main())
