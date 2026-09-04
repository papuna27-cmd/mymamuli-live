/** Full-page screenshots at 390px for design review. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist', PORT = 4321;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json' };
const server = createServer((req,res)=>{
  let p = decodeURIComponent((req.url||'/').split('?')[0]);
  let f = join(DIST,p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f,'index.html');
  if (!existsSync(f)) f = join(DIST,p+'.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});
  res.end(readFileSync(f));
});
await new Promise(r=>server.listen(PORT,r));

const ROUTES = {
  home:'/', assembly:'/services/assembly', delivery:'/services/delivery', moving:'/services/moving',
  commercial:'/commercial', calculator:'/calculator', about:'/about', contact:'/contact',
  'thank-you':'/thank-you', privacy:'/privacy', '404':'/404', mississauga:'/service-areas/mississauga',
};
mkdirSync('screenshots',{recursive:true});
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const page = await ctx.newPage();
for (const [name,route] of Object.entries(ROUTES)) {
  await page.goto(`http://localhost:${PORT}${route}`,{waitUntil:'networkidle'});
  await page.waitForTimeout(250);
  await page.screenshot({ path:`screenshots/${name}-full.png`, fullPage:true });
  await page.screenshot({ path:`screenshots/${name}-fold.png` });
}
// Desktop pass too.
const dctx = await browser.newContext({ viewport:{width:1280,height:900}, deviceScaleFactor:1 });
const dpage = await dctx.newPage();
for (const name of ['home','moving','calculator','commercial']) {
  await dpage.goto(`http://localhost:${PORT}${ROUTES[name]}`,{waitUntil:'networkidle'});
  await dpage.waitForTimeout(250);
  await dpage.screenshot({ path:`screenshots/desk-${name}.png` });
}
await browser.close(); server.close();
console.log('shots written');
