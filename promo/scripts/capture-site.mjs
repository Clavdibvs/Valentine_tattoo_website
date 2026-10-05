/**
 * Captures the running site for the promo video.
 *
 *   npm run build && npx next start -p 3123
 *   node promo/scripts/capture-site.mjs http://localhost:3123
 *
 *   ONLY=desktop-creazioni node promo/scripts/capture-site.mjs …   re-shoots single shots
 *
 * Motion stays ON (the molten backdrop only mounts with motion allowed); the
 * intro clip is skipped with Escape and every section is scrolled through
 * slowly first, so each reveal has run and every lazy image has loaded before
 * anything is captured.
 */
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Playwright from the project if it is installed there, else the global install. */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return import(pathToFileURL(path.join(root, "playwright", "index.mjs")).href);
  }
}
const { chromium } = await loadPlaywright();

const BASE = process.argv[2] || "http://localhost:3123";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "captures");
fs.mkdirSync(OUT, { recursive: true });

const SECTIONS = ["home", "instagram", "creazioni", "flash", "merch", "booking", "about"];

/** Shots to take, e.g. ONLY=desktop-creazioni; everything when unset. */
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const wanted = (name) => !ONLY || ONLY.has(name);

/**
 * Cards to move a section's rail on before its desktop shot. The Creazioni
 * rail opens on a photograph of Valentina at work (its third card); the film
 * shows her only in the site's own portrait, so its shot starts at the fourth.
 */
const RAIL_START = { desktop: { creazioni: 3 } };

async function settle(page) {
  // Let the opening clip finish on its own (about 4 s; the page is locked while
  // it plays), then walk the page so every reveal and lazy load fires.
  await page.waitForTimeout(7000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(140);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
}

async function sectionShots(page, prefix, offsetFor, wait = 1600) {
  for (const id of SECTIONS) {
    if (!wanted(`${prefix}-${id}`)) continue;
    const top = await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    }, id);
    if (top == null) { console.log("missing section", id); continue; }
    await page.evaluate((v) => window.scrollTo(0, v), Math.max(0, top - offsetFor(id)));
    const cards = RAIL_START[prefix]?.[id];
    if (cards) {
      // Straight to a snap point, as the rail's own arrows would land.
      await page.evaluate(([sid, n]) => {
        const rail = document.querySelector(`#${sid} ul`);
        const card = rail.querySelector("li");
        const step = card.offsetWidth + (Number.parseFloat(getComputedStyle(rail).columnGap) || 0);
        rail.scrollTo({ left: step * n, behavior: "instant" });
      }, [id, cards]);
    }
    await page.waitForTimeout(wait);
    const file = path.join(OUT, `${prefix}-${id}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 93, timeout: 240000 });
    console.log("wrote", file);
  }
}

(async () => {
  const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });

  // Desktop at 1.5x: one screenshot per section, plus the full page at 1x for
  // scroll shots. (At 2x the software-rendered WebGL backdrop slows the page so
  // much that the gallery reveals have not run by the time of the screenshot.)
  if (!process.env.SKIP_DESKTOP && SECTIONS.some((id) => wanted(`desktop-${id}`))) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await settle(page);
    await sectionShots(page, "desktop", (id) => (id === "home" ? 0 : 40), 4500);
    await ctx.close();
  }
  if (wanted("desktop-fullpage")) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await settle(page);
    const file = path.join(OUT, "desktop-fullpage.jpg");
    await page.screenshot({ path: file, type: "jpeg", quality: 90, fullPage: true, timeout: 240000 });
    console.log("wrote", file);
    await ctx.close();
  }
  // Mobile (iPhone-sized), 3x.
  if (!process.env.SKIP_MOBILE && [...SECTIONS, "fullpage"].some((id) => wanted(`mobile-${id}`))) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await settle(page);
    await sectionShots(page, "mobile", (id) => (id === "home" ? 0 : 10), 3500);
    if (wanted("mobile-fullpage")) {
      const file = path.join(OUT, "mobile-fullpage.jpg");
      await page.screenshot({ path: file, type: "jpeg", quality: 88, fullPage: true, timeout: 240000 });
      console.log("wrote", file);
    }
    await ctx.close();
  }
  await browser.close();
})();
