import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {serverFor} from './serve.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=resolve('dist');
const server=serverFor(root);
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const base=origin+'/portfolio/';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const report={checks:[],errors:[],performance:{},accessibility:null};
const check=(name)=>{report.checks.push(name);console.log('PASS '+name);};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url());});
 await page.addInitScript(()=>{
  window.__perf={lcp:0,cls:0,longTasks:[]};
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__perf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__perf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__perf.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});
 });
 await page.goto(base);
 await page.locator('.canvas-ready').waitFor();
 await page.waitForTimeout(1100);
 assert.equal(await page.locator('h1').count(),1);
 assert.ok(await page.locator('h1').isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.screenshot({path:'test-results/hero.png'});
 report.performance.desktop=await page.evaluate(()=>({...window.__perf,resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,bytes:r.transferSize})),navigation:performance.getEntriesByType('navigation')[0].toJSON()}));
 check('Desktop renders without overflow or blocking loader');
 await page.locator('.project-open').first().click();
 assert.equal(await page.locator('#case-prisma').getAttribute('open'),'');
 assert.ok(page.url().endsWith('#case-prisma'));
 await page.reload();
 await page.locator('#case-prisma[open]').waitFor();
 check('Project links open native case studies and survive reload');
 for(const [scenario,route,latency] of [['failed','Standby','85 ms'],['recovered','Primary','45 ms'],['healthy','Primary','40 ms']]){
  await page.locator('[data-scenario="'+scenario+'"]').click();
  assert.equal(await page.locator('#model-route').textContent(),route);
  assert.equal(await page.locator('#model-latency').textContent(),latency);
  assert.equal(await page.locator('[data-scenario="'+scenario+'"]').getAttribute('aria-pressed'),'true');
 }
 check('Failure, recovery and normal scenarios update route, latency and selected state');
 await page.locator('.lab').screenshot({path:'test-results/lab.png'});
 await page.locator('.motion-toggle').click();
 assert.equal(await page.locator('html').getAttribute('data-motion'),'reduce');
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('data-motion'),'reduce');
 check('Motion preference persists');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('html').getAttribute('data-motion'),'reduce');
 check('System reduced-motion preference respected');
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const staticPage=await noJS.newPage();
 await staticPage.goto(base);
 assert.ok(await staticPage.locator('h1').isVisible());
 assert.ok(await staticPage.locator('#main-nav').isVisible());
 await staticPage.locator('#case-clinic summary').click();
 assert.ok(await staticPage.locator('#case-clinic .case-body').isVisible());
 check('No-JavaScript mobile content, navigation and case studies usable');
 await noJS.close();
 const limited=await browser.newContext({viewport:{width:390,height:844}});
 await limited.addInitScript(()=>{
   HTMLCanvasElement.prototype.getContext=()=>null;
   Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};
   Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};
 });
 const fallback=await limited.newPage();
 await fallback.goto(base);
 assert.ok(await fallback.locator('.network-fallback').isVisible());
 await fallback.locator('.motion-toggle').click();
 assert.equal(await fallback.locator('html').getAttribute('data-motion'),'reduce');
 await fallback.locator('[data-scenario="failed"]').click();
 assert.equal(await fallback.locator('.mobile-route').textContent(),'Standby service');
 await limited.close();
 check('Canvas unavailable and blocked storage preserve a usable mobile experience');
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);
 await page.locator('.menu-toggle').click();
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 await page.locator('.menu-toggle').click();
 await page.locator('#main-nav a[href="#thinking"]').click();
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 for(const width of [320,390,768,1024]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width);
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 check('Mobile menu, Escape, anchor navigation and 320–1024px layout');
 await page.keyboard.press('Tab');
 // Focus is also exercised directly to avoid browser-specific initial tab order.
 await page.locator('.skip-link').focus();
 await page.keyboard.press('Enter');
 assert.ok(page.url().endsWith('#main'));
 await page.locator('[data-scenario="failed"]').focus();
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('#model-route').textContent(),'Standby');
 check('Keyboard skip link and scenario controls');
 await page.goto(base+'profile.html');
 await page.emulateMedia({media:'print'});
 await page.pdf({path:'test-results/daniel-gonzalez-profile.pdf',format:'A4',printBackground:true});
 assert.ok((await stat('test-results/daniel-gonzalez-profile.pdf')).size>1000);
 check('Printable profile exports as PDF');
 await page.emulateMedia({media:'screen'});
 // Generate the social image from the original SVG composition, without external assets.
 await page.setViewportSize({width:1200,height:630});
 await page.goto(base+'assets/social-card.svg');
 await page.screenshot({path:'assets/social-card.png'});
 await copyFile('assets/social-card.png','dist/assets/social-card.png');
 check('1200×630 social preview generated');
 const axePath=process.env.AXE_PATH || 'axe-core';
 if(axePath){
  const axe=require(axePath);
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base);
  await page.addScriptTag({content:axe.source});
  report.accessibility=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations,incomplete:r.incomplete.map(x=>({id:x.id,impact:x.impact,targets:x.nodes.map(n=>n.target)})),passes:r.passes.length};});
  assert.equal(report.accessibility.violations.length,0,JSON.stringify(report.accessibility.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  check('Automated WCAG A/AA checks have no violations');
 }
 assert.deepEqual(errors,[]);
 check('No page errors or failed local resources');
 report.errors=errors;
 console.log('All '+report.checks.length+' browser checks passed');
} catch(error) {report.errors.push(error.stack);throw error;}
finally{
 await writeFile('test-results/report.json',JSON.stringify(report,null,2));
 await browser.close();await new Promise(r=>server.close(r));
}
