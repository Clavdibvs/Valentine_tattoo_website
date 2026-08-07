import puppeteer from "./node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import sharp from "sharp";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--force-device-scale-factor=1","--autoplay-policy=no-user-gesture-required","--hide-scrollbars","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:4423/", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__vtIntroDone === true, { timeout: 15000 });
await new Promise(r=>setTimeout(r,2700));
await p.evaluate(()=>{const s=document.createElement("style");
  s.textContent="main,header,footer,.skip-link{visibility:hidden!important}";document.head.appendChild(s);});
await new Promise(r=>setTimeout(r,400));
const TOP=1800;
await p.evaluate(v=>window.scrollTo({top:v,behavior:"instant"}),TOP);
await new Promise(r=>setTimeout(r,700));
const joinsV = await p.evaluate((top)=>{
  const plates=[...document.querySelector("[data-backdrop-strip]").children];
  const rs=plates.map(el=>{const r=el.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY};});
  const j=[];for(let i=1;i<rs.length;i++)j.push(Math.round((rs[i].top+rs[i-1].bottom)/2));
  return j.map(y=>y-top).filter(v=>v>-200&&v<1100);},TOP);
const on=await p.screenshot({type:"png"});
await p.evaluate(()=>{document.querySelector('[class*="layer"][data-decor]').style.display="none";});
await new Promise(r=>setTimeout(r,300));
const off=await p.screenshot({type:"png"});
await b.close();
const A=await sharp(off).raw().toBuffer({resolveWithObject:true});
const B=await sharp(on).raw().toBuffer({resolveWithObject:true});
const ch=A.info.channels,W=A.info.width,H=A.info.height;
const out=Buffer.alloc(W*H*3);
for(let i=0,o=0;i<A.data.length;i+=ch,o+=3){
  const d=((B.data[i]-A.data[i])+(B.data[i+1]-A.data[i+1])+(B.data[i+2]-A.data[i+2]))/3;
  const v=Math.max(0,Math.min(255,d*22)); out[o]=v;out[o+1]=v;out[o+2]=v;
}
for(const jy of joinsV){ if(jy<0||jy>=H)continue;
  for(let x=0;x<W;x++){const o=(jy*W+x)*3;out[o]=255;out[o+1]=40;out[o+2]=40;} }
await sharp(out,{raw:{width:W,height:H,channels:3}}).resize(700).png().toFile(process.env.OUT||"/tmp/molten/differenza.png");
console.log(`giunti a y ${joinsV.join(", ")} -> ${process.env.OUT||"/tmp/molten/differenza.png"}`);
