import puppeteer from "./node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import sharp from "sharp";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--force-device-scale-factor=1","--autoplay-policy=no-user-gesture-required","--hide-scrollbars","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:4423/", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__vtIntroDone === true, { timeout: 15000 });
await new Promise(r => setTimeout(r, 2700));

const joins = await p.evaluate(() => {
  const plates = [...document.querySelector("[data-backdrop-strip]").children];
  const rs = plates.map(el => { const r = el.getBoundingClientRect(); return { top: r.top+scrollY, bottom: r.bottom+scrollY }; });
  const j = []; for (let i=1;i<rs.length;i++) j.push(Math.round((rs[i].top + rs[i-1].bottom)/2));
  return j.filter(y => y > 900 && y < document.documentElement.scrollHeight - 1000);
});
console.log(`${joins.length} giunti campionati: ${joins.join(", ")}\n`);

const prof = async (buf) => {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (let y=0;y<info.height;y++){ let s=0; for (let x=0;x<info.width;x++) s+=data[y*info.width+x]; rows.push(s/info.width); }
  return rows;
};

const WIN = 130, CENTRE = 450;
const accOff = new Array(WIN*2+1).fill(0), accOn = new Array(WIN*2+1).fill(0);
for (const j of joins) {
  await p.evaluate(y => window.scrollTo({ top: y - 450, behavior: "instant" }), j);
  await new Promise(r => setTimeout(r, 700));
  const on = await p.screenshot({ type: "png" });
  await p.evaluate(() => { document.querySelector('[class*="layer"][data-decor]').style.display = "none"; });
  await new Promise(r => setTimeout(r, 250));
  const off = await p.screenshot({ type: "png" });
  await p.evaluate(() => { document.querySelector('[class*="layer"][data-decor]').style.display = ""; });
  await new Promise(r => setTimeout(r, 250));
  const A = await prof(off), B = await prof(on);
  for (let k=-WIN;k<=WIN;k++){ accOff[k+WIN]+=A[CENTRE+k]; accOn[k+WIN]+=B[CENTRE+k]; }
}
await b.close();

console.log("media su tutti i giunti — offset 0 = giunto\n");
console.log(" offset   sfondo   effetto   rapporto");
for (let k=-WIN;k<=WIN;k+=10) {
  const a = accOff[k+WIN]/joins.length, bb = accOn[k+WIN]/joins.length;
  const r = a>0.2 ? bb/a : 0;
  const mark = Math.abs(k) <= 10 ? "  <== GIUNTO" : "";
  console.log(`  ${String(k).padStart(4)}   ${a.toFixed(2).padStart(6)}   ${bb.toFixed(2).padStart(6)}   ${r.toFixed(3)}  ${"█".repeat(Math.round((r-1)*60))}${mark}`);
}
