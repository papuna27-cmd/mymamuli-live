/**
 * Design review contact sheets: every page at 390px, plus key interaction
 * states and a desktop pass, composited into two labelled images.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const DIST='dist', PORT=4327;
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json'};
const server=createServer((q,r)=>{let p=decodeURIComponent((q.url||'/').split('?')[0]);let f=join(DIST,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f))f=join(DIST,p+'.html');if(!existsSync(f)){r.writeHead(404);return r.end('404');}r.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});r.end(readFileSync(f));});
await new Promise(r=>server.listen(PORT,r));
mkdirSync('screenshots',{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

// ---------- mobile ----------
const MOB=[
  ['Home','/'],['Assembly','/services/assembly'],['Delivery','/services/delivery'],
  ['Moving','/services/moving'],['Commercial','/commercial'],['Calculator','/calculator'],
  ['About','/about'],['Contact','/contact'],['Mississauga','/service-areas/mississauga'],
  ['Thank you','/thank-you'],['Terms','/terms'],['404','/404'],
];
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage();
const mobShots=[];
for (const [label,route] of MOB){
  await page.goto(`http://localhost:${PORT}${route}`,{waitUntil:'networkidle'});
  await page.waitForTimeout(200);
  const f=`screenshots/m-${label.toLowerCase().replace(/\W+/g,'-')}.png`;
  await page.screenshot({path:f});
  mobShots.push([label,f]);
}

// ---------- interaction states ----------
const states=[];
// calculator result
await page.goto(`http://localhost:${PORT}/calculator`,{waitUntil:'networkidle'});
await page.click('.calc__choice:nth-child(2)');
await page.waitForSelector('.input');
await page.fill('input[inputmode="numeric"]','18');
await page.click('.calc__submit');
await page.waitForSelector('.calc__total',{timeout:8000});
await page.waitForTimeout(400);
await page.screenshot({path:'screenshots/s-calc-result.png'});
states.push(['Calculator result','screenshots/s-calc-result.png']);
// error state
await page.goto(`http://localhost:${PORT}/calculator`,{waitUntil:'networkidle'});
await page.click('.calc__choice:nth-child(1)');
await page.waitForSelector('.input');
await page.fill('input[inputmode="numeric"]','999');
await page.click('.calc__submit');
await page.waitForTimeout(600);
await page.screenshot({path:'screenshots/s-calc-error.png'});
states.push(['Validation','screenshots/s-calc-error.png']);
// nav open
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
await page.click('.navbtn'); await page.waitForSelector('.navsheet__panel'); await page.waitForTimeout(350);
await page.screenshot({path:'screenshots/s-nav.png'});
states.push(['Menu open','screenshots/s-nav.png']);
// form filled
await page.goto(`http://localhost:${PORT}/contact`,{waitUntil:'networkidle'});
await page.evaluate(()=>document.querySelector('.bform').scrollIntoView());
await page.waitForTimeout(250);
await page.screenshot({path:'screenshots/s-form.png'});
states.push(['Booking form','screenshots/s-form.png']);
await ctx.close();

// ---------- desktop ----------
const DESK=[['Home','/'],['Moving','/services/moving'],['Calculator','/calculator'],['Commercial','/commercial'],['About','/about'],['Contact','/contact']];
const dctx=await browser.newContext({viewport:{width:1280,height:820},deviceScaleFactor:1});
const dpage=await dctx.newPage();
const deskShots=[];
for (const [label,route] of DESK){
  await dpage.goto(`http://localhost:${PORT}${route}`,{waitUntil:'networkidle'});
  await dpage.waitForTimeout(200);
  const f=`screenshots/d-${label.toLowerCase().replace(/\W+/g,'-')}.png`;
  await dpage.screenshot({path:f});
  deskShots.push([label,f]);
}
await browser.close(); server.close();

// ---------- composite ----------
const INK='#12283C', PAPER='#F4F6F8', SLATE='#46617C';
async function sheet(items, cols, tileW, outfile, title){
  const gap=18, labelH=26, pad=28, headH=64;
  const first=await sharp(items[0][1]).metadata();
  const tileH=Math.round(tileW*(first.height/first.width));
  const rows=Math.ceil(items.length/cols);
  const W=pad*2+cols*tileW+(cols-1)*gap;
  const H=headH+pad*2+rows*(tileH+labelH)+(rows-1)*gap;
  const layers=[];
  for (let i=0;i<items.length;i++){
    const c=i%cols, r=Math.floor(i/cols);
    const x=pad+c*(tileW+gap);
    const y=headH+pad+r*(tileH+labelH+gap);
    layers.push({ input: await sharp(items[i][1]).resize(tileW,tileH,{fit:'cover',position:'top'}).png().toBuffer(), left:x, top:y });
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${labelH}"><text x="0" y="17" font-family="IBM Plex Sans" font-size="13" font-weight="600" fill="${INK}">${items[i][0]}</text></svg>`), left:x, top:y+tileH+4 });
  }
  layers.unshift({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${headH}"><text x="${pad}" y="38" font-family="Archivo SemiBold" font-size="24" font-weight="800" fill="${INK}">${title}</text></svg>`), left:0, top:0 });
  await sharp({create:{width:W,height:H,channels:3,background:PAPER}}).composite(layers).png({compressionLevel:9}).toFile(outfile);
  console.log(outfile, `${W}x${H}`);
}

await sheet(mobShots, 6, 300, 'screenshots/SHEET-mobile-390.png', 'Assembleo — every page at 390px (iPhone 14 Pro)');
await sheet(states, 4, 340, 'screenshots/SHEET-states.png', 'Assembleo — interaction states at 390px');
await sheet(deskShots, 3, 560, 'screenshots/SHEET-desktop.png', 'Assembleo — desktop at 1280px');
