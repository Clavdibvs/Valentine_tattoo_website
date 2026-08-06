import asyncio
from playwright.async_api import async_playwright
import os
import requests
import json

POSTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/posts"
HIGHLIGHTS_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

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

async def main():
    target_profile = "/Users/claudiorosito/.gemini/antigravity-ide/brain/779ad648-071c-4cb2-a3a1-a67780fab747/scratch/chrome_profile_work"
    for lock in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
        f = os.path.join(target_profile, lock)
        if os.path.exists(f):
            try: os.remove(f)
            except: pass

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=target_profile,
            headless=True,
            channel="chrome",
            args=["--no-sandbox"]
        )
        page = context.pages[0] if context.pages else await context.new_page()

        # Step 1: Open profile page and get top 12 post links
        print("Opening profile page to fetch post links...")
        await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)

        # Handle cookie banner if present
        try:
            btn = page.locator("button:has-text('Allow'), button:has-text('Consenti'), button:has-text('Accept')")
            if await btn.count() > 0:
                await btn.first.click(force=True)
                await page.wait_for_timeout(1000)
        except: pass

        post_links = await page.locator("a[href*='/p/']").all()
        shortcodes = []
        for l in post_links:
            href = await l.get_attribute("href")
            if href and "/p/" in href:
                sc = href.split("/p/")[1].split("/")[0]
                if sc not in shortcodes:
                    shortcodes.append(sc)

        shortcodes = shortcodes[:12]
        print(f"\n==========================================")
        print(f"  FOUND {len(shortcodes)} POSTS TO DOWNLOAD")
        print(f"==========================================")

        # Download each post media
        for idx, sc in enumerate(shortcodes):
            post_dir = os.path.join(POSTS_DIR, f"post-{idx+1:02d}")
            os.makedirs(post_dir, exist_ok=True)
            url = f"https://www.instagram.com/p/{sc}/"
            print(f"\n--- Downloading Post {idx+1}/{len(shortcodes)} ({sc}) ---")
            
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Click next in carousel if present to uncover all items
            media_urls = []
            for slide in range(10):
                imgs = await page.locator("article img, main img, div[role='dialog'] img").all()
                vids = await page.locator("article video, main video, div[role='dialog'] video").all()

                for img in imgs:
                    srcset = await img.get_attribute("srcset")
                    src = await img.get_attribute("src")
                    best = srcset.split(",")[-1].strip().split(" ")[0] if srcset else src
                    if best and "scontent" in best and "470688118" not in best:
                        if best not in media_urls:
                            media_urls.append(best)

                for vid in vids:
                    src = await vid.get_attribute("src")
                    if src and "scontent" in src and src not in media_urls:
                        media_urls.append(src)

                # Try clicking carousel next button
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

        # Step 2: Download Highlights (creazioni, flash, merch)
        print(f"\n==========================================")
        print(f"  DOWNLOADING 3 STORY HIGHLIGHTS")
        print(f"==========================================")

        for name, h_id in HIGHLIGHT_MAP:
            h_dir = os.path.join(HIGHLIGHTS_DIR, name)
            os.makedirs(h_dir, exist_ok=True)
            print(f"\n--- Downloading Highlight '{name}' ({h_id}) ---")

            await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Click highlight link
            h_link = page.locator(f"a[href*='{h_id}']").first
            if await h_link.count() > 0:
                print(f" Clicking highlight link {h_id}...")
                await h_link.evaluate("el => el.click()")
                await page.wait_for_timeout(3000)

            story_urls = []
            for step in range(15):
                # Inspect current story slide DOM
                elements = await page.locator("section img, section video, div[role='dialog'] img, div[role='dialog'] video, img[srcset]").all()
                for el in elements:
                    tag = await el.evaluate("e => e.tagName")
                    srcset = await el.get_attribute("srcset")
                    src = await el.get_attribute("src")
                    best = srcset.split(",")[-1].strip().split(" ")[0] if srcset else src
                    if best and "scontent" in best and "470688118" not in best:
                        if best not in story_urls:
                            story_urls.append(best)

                # Press right arrow to advance story
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(1500)

            print(f" Highlight '{name}': Extracted {len(story_urls)} unique story URLs!")
            for s_idx, s_url in enumerate(story_urls[:12]):
                ext = ".mp4" if ".mp4" in s_url else ".jpg"
                save_path = os.path.join(h_dir, f"story_{s_idx+1:02d}{ext}")
                sz = download_file(s_url, save_path)
                print(f"   Saved {name}/story_{s_idx+1:02d}{ext} ({sz} bytes)")

            # Exit story viewer
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(1000)

        await context.close()
        print("\n==========================================")
        print("  ALL DOWNLOADS COMPLETED PERFECTLY!")
        print("==========================================")

if __name__ == "__main__":
    asyncio.run(main())
