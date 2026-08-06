import asyncio
from playwright.async_api import async_playwright
import os
import shutil

BASE_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

HIGHLIGHTS = [
    ("creazioni", "18138808534098679"),
    ("flash", "17907459131894011"),
    ("merch", "17859497229473696")
]

async def download_highlights():
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

        for name, h_id in HIGHLIGHTS:
            dest_dir = os.path.join(BASE_DIR, name)
            os.makedirs(dest_dir, exist_ok=True)
            print(f"\n==========================================")
            print(f"  Downloading Highlight '{name}' (ID: {h_id})")
            print(f"==========================================")

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
                                    print(f"  [{name}] Captured story #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                        except Exception:
                            pass

            page.on("response", on_resp)

            print("Opening profile page...")
            await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Try clicking cookie consent button if visible
            try:
                cookie_btn = page.locator("button:has-text('Allow'), button:has-text('Consenti'), button:has-text('Accept')")
                if await cookie_btn.count() > 0:
                    await cookie_btn.first.click(force=True)
                    await page.wait_for_timeout(1000)
            except Exception:
                pass

            # Click the exact highlight link via DOM evaluate (bypasses overlays)
            link_selector = f"a[href*='{h_id}']"
            link = page.locator(link_selector).first
            if await link.count() > 0:
                print(f"Found highlight link for {name}! Triggering click...")
                await link.evaluate("el => el.click()")
                await page.wait_for_timeout(3000)
            else:
                print(f"Warning: link {link_selector} not found on profile!")

            # Step through story slides
            for step in range(30):
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

            print(f"✓ Completed {name}: {len(items_to_save)} stories saved in {dest_dir}")
            await page.close()

        await context.close()

if __name__ == "__main__":
    asyncio.run(download_highlights())
