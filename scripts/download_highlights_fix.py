import asyncio
from playwright.async_api import async_playwright
import os
import shutil

BASE_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

HIGHLIGHTS = [
    ("creazioni", "https://www.instagram.com/stories/highlights/18138808534098679/"),
    ("flash", "https://www.instagram.com/stories/highlights/17907459131894011/"),
    ("merch", "https://www.instagram.com/stories/highlights/17859497229473696/")
]

def prepare_profile():
    target_profile = "/Users/claudiorosito/.gemini/antigravity-ide/brain/779ad648-071c-4cb2-a3a1-a67780fab747/scratch/chrome_profile_work"
    for lock in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
        f = os.path.join(target_profile, lock)
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
    return target_profile

async def download_highlight(context, name, url):
    dest_dir = os.path.join(BASE_DIR, name)
    os.makedirs(dest_dir, exist_ok=True)
    print(f"\n==========================================")
    print(f"  Downloading Stories for Highlight: {name}")
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
                            print(f"  [{name}] Captured story #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                except Exception:
                    pass

    page.on("response", on_response)

    print(f"Navigating to profile first...")
    await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)

    print(f"Navigating to highlight URL {url}...")
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)

    # Click on the story player canvas / overlay to start playback
    try:
        await page.mouse.click(640, 400)
        await page.wait_for_timeout(1000)
    except Exception:
        pass

    # Press Space or ArrowRight repeatedly to trigger story slides
    for step in range(35):
        if len(captured_buffers) >= 12:
            print(f"✓ Reached {len(captured_buffers)} stories for {name}!")
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

    print(f"✓ Highlight {name} finished ({len(items_to_save)} stories saved in {dest_dir})")
    await page.close()

async def main():
    profile_dir = prepare_profile()
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=True,
            channel="chrome",
            args=["--no-sandbox"]
        )

        for name, url in HIGHLIGHTS:
            await download_highlight(context, name, url)

        await context.close()

if __name__ == "__main__":
    asyncio.run(main())
