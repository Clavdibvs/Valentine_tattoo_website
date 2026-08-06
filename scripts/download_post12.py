import asyncio
from playwright.async_api import async_playwright
import os

async def download_p12():
    target_profile = "/Users/claudiorosito/.gemini/antigravity-ide/brain/779ad648-071c-4cb2-a3a1-a67780fab747/scratch/chrome_profile_work"
    for lock in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
        f = os.path.join(target_profile, lock)
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass

    post_folder = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/posts/post-12"
    os.makedirs(post_folder, exist_ok=True)
    post_url = "https://www.instagram.com/p/DXJf3JtDXuh/"

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=target_profile,
            headless=True,
            channel="chrome",
            args=["--no-sandbox"]
        )
        page = await context.new_page()

        captured_buffers = []
        saved_hashes = set()

        async def on_resp(response):
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
                                print(f"  [post-12] Captured item #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                    except Exception:
                        pass

        page.on("response", on_resp)

        print(f"Navigating to post 12: {post_url}")
        await page.goto(post_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        for _ in range(6):
            try:
                next_btn = page.locator("button[aria-label='Next'], button[aria-label='Avanti']")
                if await next_btn.count() > 0 and await next_btn.first.is_visible():
                    await next_btn.first.click()
                    await page.wait_for_timeout(1000)
                else:
                    await page.keyboard.press("ArrowRight")
                    await page.wait_for_timeout(800)
            except Exception:
                break

        for item_idx, (ct, buf) in enumerate(captured_buffers):
            ext = ".mp4" if "video" in ct else ".jpg"
            filename = f"media_{item_idx+1:02d}{ext}"
            filepath = os.path.join(post_folder, filename)
            with open(filepath, "wb") as f:
                f.write(buf)
            print(f" Saved post-12/{filename} ({len(buf)} bytes)")

        print(f"✓ Post 12 done ({len(captured_buffers)} files saved)")
        await context.close()

if __name__ == "__main__":
    asyncio.run(download_p12())
