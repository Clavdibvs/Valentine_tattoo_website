// Ampiezza della banda ai giunti: delta vicino al giunto contro delta lontano.
import puppeteer from "./node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import sharp from "sharp";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--force-device-scale-factor=1","--autoplay-policy=no-user-gesture-required","--hide-scrollbars","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:4423/", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__vtIntroDone === true, { timeout: 15000 });
await new Promise(r => setTimeout(r, 2700));
await p.evaluate(() => { const s=document.createElement("style");
  s.textContent="main,header,footer,.skip-link{visibility:hidden!important}"; document.head.appendChild(s); });
await new Promise(r=>setTimeout(r,400));
const joins = await p.evaluate(() => {
  const plates=[...document.querySelector("[data-backdrop-strip]").children];
  const rs=plates.map(el=>{const r=el.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY};});
  const j=[];for(let i=1;i<rs.length;i++)j.push(Math.round((rs[i].top+rs[i-1].bottom)/2));
  return j.filter(y=>y>1000&&y<document.documentElement.scrollHeight-1200);
});
// colonne centrali: è lì che la banda si stacca dal fondo scuro
const prof=async(buf)=>{const{data,info}=await sharp(buf).greyscale().raw().toBuffer({resolveWithObject:true});
  const x0=Math.floor(info.width*0.30), x1=Math.floor(info.width*0.70);
  const rows=[];for(let y=0;y<info.height;y++){let s=0;for(let x=x0;x<x1;x++)s+=data[y*info.width+x];rows.push(s/(x1-x0));}return rows;};

const WIN=245;
const acc=new Array(WIN*2+1).fill(0); let n=0;
// il giunto viene messo a quote diverse del viewport, così la struttura del
// campo molten (che vive in coordinate schermo) si media via
const SLOTS=[300, 420, 540, 660];
for (const [i,j] of joins.entries()) {
  const at = SLOTS[i % SLOTS.length];
  await p.evaluate(v=>window.scrollTo({top:v,behavior:"instant"}), j-at);
  await new Promise(r=>setTimeout(r,700));
  const e=await prof(await p.screenshot({type:"png"}));
  await p.evaluate(()=>{document.querySelector('[class*="layer"][data-decor]').style.display="none";});
  await new Promise(r=>setTimeout(r,300));
  const a=await prof(await p.screenshot({type:"png"}));
  await p.evaluate(()=>{document.querySelector('[class*="layer"][data-decor]').style.display="";});
  await new Promise(r=>setTimeout(r,500));
  for(let k=-WIN;k<=WIN;k++){ const y=at+k; if(y>=0&&y<e.length) acc[k+WIN]+=e[y]-a[y]; }
  n++;
}
await b.close();
const d=acc.map(v=>v/n);
const at=(lo,hi)=>{let s=0,c=0;for(let k=-WIN;k<=WIN;k++){const A=Math.abs(k);if(A>=lo&&A<=hi){s+=d[k+WIN];c++;}}return s/c;};
const near=at(0,45), far=at(150,245);
console.log("delta medio (effetto - sfondo), colonne centrali, "+n+" giunti\n");
for(let k=-WIN;k<=WIN;k+=15){
  console.log(`  ${String(k).padStart(4)}   ${d[k+WIN].toFixed(2).padStart(6)}  ${"█".repeat(Math.max(0,Math.round(d[k+WIN]*8)))}${Math.abs(k)<=15?"  <== GIUNTO":""}`);
}
console.log(`\nvicino al giunto (±45px): ${near.toFixed(3)}`);
console.log(`lontano (150-245px)     : ${far.toFixed(3)}`);
console.log(`AMPIEZZA BANDA          : ${(near/far).toFixed(2)}x`);
