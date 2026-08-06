import asyncio
from playwright.async_api import async_playwright
import os
import shutil
import time

BASE_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media"

HIGHLIGHTS = [
    ("creazioni", "https://www.instagram.com/stories/highlights/18138808534098679/"),
    ("flash", "https://www.instagram.com/stories/highlights/17907459131894011/"),
    ("merch", "https://www.instagram.com/stories/highlights/17859497229473696/")
]

def prepare_profile():
    src_profile = os.path.expanduser("~/Library/Application Support/Google/Chrome")
    target_profile = "/Users/claudiorosito/.gemini/antigravity-ide/brain/779ad648-071c-4cb2-a3a1-a67780fab747/scratch/chrome_profile_work"
    
    # Remove old locks if any
    for lock in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
        f = os.path.join(target_profile, lock)
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
                
    if not os.path.exists(os.path.join(target_profile, "Default")):
        os.makedirs(os.path.join(target_profile, "Default"), exist_ok=True)
        src_default = os.path.join(src_profile, "Default")
        tgt_default = os.path.join(target_profile, "Default")
        for item in ["Cookies", "Network", "Local Storage", "Session Storage"]:
            s = os.path.join(src_default, item)
            t = os.path.join(tgt_default, item)
            if os.path.exists(s):
                if os.path.isdir(s):
                    shutil.copytree(s, t, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, t)
    return target_profile

async def download_highlight(context, name, url):
    dest_dir = os.path.join(BASE_DIR, "highlights", name)
    os.makedirs(dest_dir, exist_ok=True)
    print(f"\n==========================================")
    print(f"  Downloading Highlight: {name}")
    print(f"==========================================")

    page = await context.new_page()
    captured_buffers = []
    saved_hashes = set()

    async def on_response(response):
        u = response.url
        if ("scontent" in u or "cdninstagram.com" in u) and not any(skip in u for skip in ["rsrc.php", "logging", "telemetry"]):
            ct = response.headers.get("content-type", "")
            if ("image" in ct or "video" in ct) and "svg" not in ct:
                try:
                    buf = await response.body()
                    if len(buf) > 15000:
                        b_hash = (len(buf), buf[:100])
                        if b_hash not in saved_hashes:
                            saved_hashes.add(b_hash)
                            captured_buffers.append((ct, buf))
                            print(f"  [{name}] Captured media #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                except Exception:
                    pass

    page.on("response", on_response)

    print(f"Navigating to {url}...")
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)

    try:
        btn = page.locator("button:has-text('Allow'), button:has-text('Consenti'), button:has-text('Accept')")
        if await btn.count() > 0:
            await btn.first.click()
            await page.wait_for_timeout(1000)
    except Exception:
        pass

    for step in range(30):
        if len(captured_buffers) >= 12:
            print(f"✓ Reached {len(captured_buffers)} items for highlight {name}!")
            break
        await page.keyboard.press("ArrowRight")
        await page.wait_for_timeout(1200)

    items_to_save = captured_buffers[:12]
    for idx, (ct, buf) in enumerate(items_to_save):
        ext = ".mp4" if "video" in ct else ".jpg"
        filename = f"story_{idx+1:02d}{ext}"
        filepath = os.path.join(dest_dir, filename)
        with open(filepath, "wb") as f:
            f.write(buf)
        print(f" Saved {name}/{filename} ({len(buf)} bytes)")

    print(f"✓ Completed highlight {name}: {len(items_to_save)} stories saved in {dest_dir}")
    await page.close()


async def download_posts(context):
    posts_dir = os.path.join(BASE_DIR, "posts")
    os.makedirs(posts_dir, exist_ok=True)
    print(f"\n==========================================")
    print(f"  Downloading Latest 12 Posts for @valentine.ttt")
    print(f"==========================================")

    page = await context.new_page()
    print("Opening profile page...")
    await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
    await page.wait_for_timeout(4000)

    await page.evaluate("window.scrollBy(0, 600)")
    await page.wait_for_timeout(2000)

    links = await page.locator("a[href*='/p/']").all()
    shortcodes = []
    for link in links:
        href = await link.get_attribute("href")
        if href and "/p/" in href:
            sc = href.split("/p/")[1].split("/")[0]
            if sc not in shortcodes:
                shortcodes.append(sc)

    print(f"Found {len(shortcodes)} post shortcodes: {shortcodes}")
    target_shortcodes = shortcodes[:12]
    await page.close()

    for idx, sc in enumerate(target_shortcodes):
        post_num = idx + 1
        post_folder = os.path.join(posts_dir, f"post-{post_num:02d}")
        os.makedirs(post_folder, exist_ok=True)
        post_url = f"https://www.instagram.com/p/{sc}/"

        print(f"\n--- Post {post_num}/12 ({sc}): {post_url} ---")
        p_page = await context.new_page()

        captured_buffers = []
        saved_hashes = set()

        async def on_post_resp(response):
            u = response.url
            if ("scontent" in u or "cdninstagram.com" in u) and not any(skip in u for skip in ["rsrc.php", "logging", "telemetry"]):
                ct = response.headers.get("content-type", "")
                if ("image" in ct or "video" in ct) and "svg" not in ct:
                    try:
                        buf = await response.body()
                        if len(buf) > 15000:
                            b_hash = (len(buf), buf[:100])
                            if b_hash not in saved_hashes:
                                saved_hashes.add(b_hash)
                                captured_buffers.append((ct, buf))
                                print(f"  [post-{post_num:02d}] Captured item #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                    except Exception:
                        pass

        p_page.on("response", on_post_resp)

        await p_page.goto(post_url, wait_until="domcontentloaded")
        await p_page.wait_for_timeout(3000)

        for _ in range(6):
            try:
                next_btn = p_page.locator("button[aria-label='Next'], button[aria-label='Avanti']")
                if await next_btn.count() > 0 and await next_btn.first.is_visible():
                    await next_btn.first.click()
                    await p_page.wait_for_timeout(1000)
                else:
                    await p_page.keyboard.press("ArrowRight")
                    await p_page.wait_for_timeout(800)
            except Exception:
                break

        for item_idx, (ct, buf) in enumerate(captured_buffers):
            ext = ".mp4" if "video" in ct else ".jpg"
            filename = f"media_{item_idx+1:02d}{ext}"
            filepath = os.path.join(post_folder, filename)
            with open(filepath, "wb") as f:
                f.write(buf)
            print(f" Saved post-{post_num:02d}/{filename} ({len(buf)} bytes)")

        print(f"✓ Post {post_num:02d} done ({len(captured_buffers)} files saved in {post_folder})")
        await p_page.close()

async def main():
    profile_dir = prepare_profile()
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=True,
            channel="chrome",
            args=["--no-sandbox"]
        )

        # 1. Highlights
        for name, url in HIGHLIGHTS:
            await download_highlight(context, name, url)

        # 2. Posts
        await download_posts(context)

        await context.close()

if __name__ == "__main__":
    asyncio.run(main())
