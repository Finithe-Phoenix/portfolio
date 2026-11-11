import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {serverFor} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const server=serverFor(resolve('dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/portfolio/';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const results=[];await mkdir('test-results',{recursive:true});
try{
 for(const lang of ['','es/','pt/'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base+lang);await page.locator('#journey-select').selectOption('work');
  assert.ok(!requests.some(r=>r.includes('project-cinema.mjs')),'Theater stays lazy until requested');
  await page.locator('[data-story-trigger]').first().click();
  await page.locator('.cinema[open]').waitFor();
  assert.equal(await page.locator('#cinema-title').textContent(),'Prisma');
  assert.equal(await page.locator('.cinema-play').getAttribute('aria-pressed'),'false');
  assert.ok(await page.locator('.cinema-play').isDisabled(),'Reduced motion prevents autoplay');
  for(let project=0;project<8;project++){
   await page.locator('.cinema-picker select').selectOption(String(project));
   const titles=[];
   for(let act=0;act<4;act++){
    await page.locator('[data-act="'+act+'"][role=tab]').click();
    assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),String(act));
    assert.match(await page.locator('.cinema-count').textContent(),new RegExp((act+1)+' / 4'));
    titles.push(await page.locator('.cinema-panel h3').textContent());
    assert.ok((await page.locator('.cinema-text').textContent()).length>40);
    assert.ok(await page.locator('.cinema-links a[href^="https://github.com/"]').count());
   }
   assert.equal(new Set(titles).size,4);
  }
  await page.locator('[role=tab][data-act="3"]').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),'0');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),'1');
  await page.locator('.cinema-picker select').selectOption('0');
  await page.screenshot({path:'test-results/cinema-'+(lang.slice(0,2)||'en')+'-'+width+'.png'});
  const axe=require(process.env.AXE_PATH||'axe-core');await page.addScriptTag({content:axe.source});
  const audit=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));});
  assert.deepEqual(audit,[]);
  assert.ok(await page.locator('.cinema').evaluate(el=>el.scrollWidth<=el.clientWidth));
  if(width===390)for(const w of [320,360,430]){
   await page.setViewportSize({width:w,height:844});
   assert.ok(await page.locator('.cinema').evaluate(el=>el.scrollWidth<=el.clientWidth),'Dialog overflow '+w);
  }
  await page.keyboard.press('Escape');await page.locator('.cinema[open]').waitFor({state:'hidden'});
  await page.waitForURL(base+lang+'#work');
  await page.waitForFunction(()=>document.activeElement.matches('[data-story-trigger]'));
  await page.goForward();await page.locator('.cinema[open]').waitFor();
  await page.reload();await page.locator('.cinema[open]').waitFor();
  assert.equal(await page.locator('#journey-select').inputValue(),'work');
  await page.locator('.cinema-links a[href^="#case-"]').click();
  await page.locator('#case-prisma[open]').waitFor();assert.equal(await page.locator('.cinema[open]').count(),0);
  await page.waitForFunction(()=>document.activeElement.matches('#case-prisma summary'));
  assert.ok(page.url().endsWith('#case-prisma'));
  assert.deepEqual(errors,[]);
  results.push({locale:lang||'en',width,projects:8,scenes:32,status:'passed'});
  console.log('PASS 8 project stories, 32 scenes, keyboard, focus, history, deep links, no overflow, axe: '+(lang||'en')+' '+width);
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
 const page=await context.newPage();await page.clock.install();await page.goto(base+'es/#story-novapay');await page.locator('.cinema[open]').waitFor();
 await page.locator('.cinema-next').click();await page.locator('.cinema-next').click();await page.locator('.cinema-next').click();
 assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),'3');
 await page.locator('.cinema-play').click();
 assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),'0');
 assert.equal(await page.locator('.cinema-play').getAttribute('aria-pressed'),'true');
 await page.clock.fastForward(12010);
 assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-act'),'1');
 await page.locator('.cinema-play').click();assert.equal(await page.locator('.cinema-play').getAttribute('aria-pressed'),'false');
 await page.locator('.cinema-project-next').click();
 assert.ok(page.url().endsWith('#story-clinic'));
 await page.locator('.cinema-close').click();await page.waitForURL('**/#work');
 // Reading mode retains the same theater, with native details as a JS-free fallback.
 await page.locator('.journey-mode').click();
 await page.locator('[data-story-trigger]').first().click();await page.locator('.cinema[open]').waitFor();
 await page.locator('.cinema-close').click();await page.locator('.cinema[open]').waitFor({state:'hidden'});
 await page.waitForURL('**/#work');
 await context.close();console.log('PASS normal motion, manual playback, rapid scenes, project URL, reading mode');
 const plain=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const plainPage=await plain.newPage();await plainPage.goto(base+'es/#story-novapay');
 await plainPage.locator('#story-novapay summary').click();
 assert.equal(await plainPage.locator('#story-novapay[open] [data-beat]').count(),4);
 assert.ok(await plainPage.locator('#story-novapay .story-sources a').first().isVisible());
 await plain.close();console.log('PASS project stories and sources work without JavaScript');
}finally{await writeFile('test-results/cinema-report.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}
