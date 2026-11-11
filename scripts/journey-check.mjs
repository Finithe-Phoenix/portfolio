import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFile,mkdir} from 'node:fs/promises';
import {serverFor} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const server=serverFor(resolve('dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/portfolio/';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const results=[];
await mkdir('test-results',{recursive:true});
try{
 for(const lang of ['','es/','pt/'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+lang);
  await page.locator('.journey-bar').waitFor();
  assert.equal(await page.locator('main>section[id]:visible').count(),1);
  assert.ok(await page.locator('#top').isVisible());assert.ok(await page.locator('.journey-prev').isDisabled());
  await page.screenshot({path:'test-results/story-'+(lang.slice(0,2)||'en')+'-'+width+'.png'});
  await page.locator('.journey-next').click();
  assert.ok(await page.locator('#impact').isVisible());
  assert.equal(await page.locator('#journey-select').inputValue(),'impact');
  await page.goBack();
  assert.equal(await page.locator('#journey-select').inputValue(),'top');
  assert.ok(await page.locator('#top').isVisible());
  await page.goForward();
  assert.equal(await page.locator('#journey-select').inputValue(),'impact');
  assert.ok(await page.locator('.journey-status').textContent());
  await page.locator('#journey-select').selectOption('work');
  assert.ok(await page.locator('#work').isVisible());
  await page.locator('#work .scene.ready').first().waitFor({state:'attached'});
  await page.locator('.project-controls button').last().click();
  assert.match(await page.locator('.project-controls p').textContent(),/^2 \/ 8/);
  await page.locator('.project-open').first().click();
  await page.locator('#case-prisma[open]').waitFor();
  assert.ok(await page.locator('#work').isVisible());
  await page.reload();await page.locator('#case-prisma[open]').waitFor();
  assert.equal(await page.locator('#journey-select').inputValue(),'work');
  await page.locator('#journey-select').selectOption('lab');
  await page.locator('[data-scenario="failed"]').click();
  assert.equal(await page.locator('#model-latency').textContent(),'85 ms');
  await page.screenshot({path:'test-results/story-lab-'+(lang.slice(0,2)||'en')+'-'+width+'.png'});
  await page.goBack();
  assert.equal(await page.locator('#journey-select').inputValue(),'work');
  await page.locator('.journey-mode').click();
  assert.equal(await page.locator('main>section[id]:visible').count(),8);
  await page.locator('.journey-mode').click();
  assert.equal(await page.locator('main>section[id]:visible').count(),1);
  await page.locator('#journey-select').selectOption('contact');
  assert.ok(await page.locator('.journey-next').isDisabled());
  assert.equal(await page.locator('a[href^="mailto:"]:visible').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390){
   for(const w of [320,360,430]){await page.setViewportSize({width:w,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+w);}
  }
  assert.deepEqual(errors,[]);
  results.push({locale:lang||'en',width,status:'passed'});
  console.log('PASS guided story, gallery, lab, deep link, history, reading mode: '+(lang||'en')+' '+width);
  await context.close();
 }
 // Audit the new controls in the default experience, not only the full reading path.
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();await page.goto(base+'es/');
 const axe=require(process.env.AXE_PATH||'axe-core');await page.addScriptTag({content:axe.source});
 const audit=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));});
 assert.deepEqual(audit,[]);console.log('PASS guided mobile accessibility');
 await context.close();
}finally{await writeFile('test-results/journey-report.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}
