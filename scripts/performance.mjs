import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {serverFor} from './serve.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const server=serverFor(resolve('dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const results=[];
try {
for(const mode of ['desktop','mobile']){
 for(let run=0;run<3;run++){
  const context=await browser.newContext({viewport:mode==='desktop'?{width:1440,height:1000}:{width:390,height:844},isMobile:mode==='mobile',hasTouch:mode==='mobile'});
  const page=await context.newPage();
  const session=await context.newCDPSession(page);
  if(mode==='mobile'){await session.send('Emulation.setCPUThrottlingRate',{rate:4});await session.send('Network.enable');await session.send('Network.emulateNetworkConditions',{offline:false,downloadThroughput:200000,uploadThroughput:93750,latency:150});}
  await page.addInitScript(()=>{
   window.metrics={lcp:0,cls:0,eventDurations:[]};
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.metrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.metrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.metrics.eventDurations.push(e.duration);}).observe({type:'event',buffered:true,durationThreshold:16});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/portfolio/');
  await page.waitForTimeout(2000);
  const frames=await page.evaluate(()=>new Promise(resolve=>{
   let prior=performance.now();const deltas=[];function sample(now){deltas.push(now-prior);prior=now;if(deltas.length<90)requestAnimationFrame(sample);else resolve(deltas.slice(1));}requestAnimationFrame(sample);
  }));
  await page.locator('[data-scenario="failed"]').click();
  await page.waitForTimeout(200);
  const metrics=await page.evaluate(()=>window.metrics);
  const sorted=frames.sort((a,b)=>a-b);
  results.push({mode,run:run+1,...metrics,frameMedianMs:sorted[Math.floor(sorted.length/2)],frameP95Ms:sorted[Math.floor(sorted.length*.95)]});
  await context.close();
 }
}
console.log(JSON.stringify(results,null,2));
await writeFile('test-results/performance.json',JSON.stringify({note:'Local Chromium lab measurements. Mobile: 4x CPU, 1.6 Mbps download, 150ms latency. Event durations are a synthetic interaction sample, not field INP.',samples:results},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
