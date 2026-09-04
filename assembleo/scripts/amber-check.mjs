/** Design principle 3: at most one filled --signal control in the viewport. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
const DIST='dist', PORT=4322;
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{let p=decodeURIComponent((req.url||'/').split('?')[0]);let f=join(DIST,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f))f=join(DIST,p+'.html');if(!existsSync(f)){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});res.end(readFileSync(f));});
await new Promise(r=>server.listen(PORT,r));

const ROUTES=['/','/services/moving','/services/assembly','/calculator','/contact','/commercial','/about','/service-areas/toronto'];
const problems=[];
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await ctx.newPage();

for (const route of ROUTES){
  await page.goto(`http://localhost:${PORT}${route}`,{waitUntil:'networkidle'});
  const height=await page.evaluate(()=>document.body.scrollHeight);
  for (let y=0; y<height; y+=400){
    await page.evaluate((yy)=>window.scrollTo({top:yy,behavior:'instant'}),y);
    await page.waitForTimeout(120);
    const n=await page.evaluate(()=>{
      const vis=[];
      // Anything sitting behind the opaque fixed bar is not on screen.
      let ceiling = window.innerHeight;
      for (const fixed of document.querySelectorAll('.actionbar,.calc__sticky')) {
        if (getComputedStyle(fixed).display === 'none') continue;
        ceiling = Math.min(ceiling, fixed.getBoundingClientRect().top);
      }
      for (const el of document.querySelectorAll('.btn--signal')){
        const cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden') continue;
        const p=el.closest('.actionbar,.calc__sticky');
        if(p && getComputedStyle(p).display==='none') continue;
        const r=el.getBoundingClientRect();
        if(r.width===0) continue;
        const limit = p ? window.innerHeight : ceiling;   // the bar itself is never occluded
        if(r.bottom>0 && r.top<limit) vis.push((el.textContent||'').trim().slice(0,24));
      }
      return vis;
    });
    if(n.length>1) problems.push(`${route} @y=${y}: ${n.length} amber controls visible — ${n.join(' + ')}`);
  }
}
await browser.close(); server.close();
if(problems.length===0) console.log('PASS — never more than one amber control on screen.');
else { console.log(`FAIL — ${problems.length}:`); problems.slice(0,12).forEach(p=>console.log('  • '+p)); process.exitCode=1; }
