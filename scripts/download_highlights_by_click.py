import asyncio
from playwright.async_api import async_playwright
import os
import shutil

BASE_DIR = "/Users/claudiorosito/Documents/LAVORO 2026/AGOSTO/Valentine tattoo website/public/instagram-media/highlights"

HIGHLIGHT_NAMES = ["creazioni", "flash", "merch"]

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
        page = context.pages[0] if context.pages else await context.new_page()

        for h_name in HIGHLIGHT_NAMES:
            dest_dir = os.path.join(BASE_DIR, h_name)
            os.makedirs(dest_dir, exist_ok=True)
            print(f"\n==========================================")
            print(f"  Downloading Highlight: {h_name}")
            print(f"==========================================")

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
                                    print(f"  [{h_name}] Captured story #{len(captured_buffers)}: type={ct}, size={len(buf)} bytes")
                        except Exception:
                            pass

            page.on("response", on_resp)

            print("Opening profile page...")
            await page.goto("https://www.instagram.com/valentine.ttt/", wait_until="domcontentloaded")
            await page.wait_for_timeout(4000)

            # Find and click highlight by name or index
            print(f"Clicking highlight '{h_name}' on profile...")
            clicked = False
            # Find all highlight items in header
            items = await page.locator("header canvas, header button, header span").all()
            for item in items:
                txt = await item.inner_text()
                if h_name.lower() in txt.lower():
                    await item.click()
                    clicked = True
                    print(f" Clicked highlight element with text '{txt}'")
                    break

            if not clicked:
                print(f" Falling back to index click for '{h_name}'...")
                canvases = await page.locator("header canvas").all()
                idx_map = {"creazioni": 0, "flash": 1, "merch": 2}
                target_idx = idx_map.get(h_name, 0)
                if len(canvases) > target_idx:
                    await canvases[target_idx].click()
                    clicked = True
                    print(f" Clicked canvas index {target_idx}")

            await page.wait_for_timeout(3000)

            # Step through story slides
            for step in range(25):
                if len(captured_buffers) >= 12:
                    print(f"✓ Reached {len(captured_buffers)} stories for {h_name}!")
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
                print(f" Saved {h_name}/{filename} ({len(buf)} bytes)")

            print(f"✓ Completed {h_name}: {len(items_to_save)} stories saved in {dest_dir}")
            
            # Remove response listener before next iteration
            page.remove_listener("response", on_resp)
            # Close story modal if open
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(1000)

        await context.close()

if __name__ == "__main__":
    asyncio.run(download_highlights())
