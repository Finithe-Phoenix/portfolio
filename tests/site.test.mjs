import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {scenarioFor} from '../lab.mjs';
const root=resolve('dist');
test('failure routes to standby and recovery returns to primary',()=>{
 assert.equal(scenarioFor('failed').route,'Standby');
 assert.ok(scenarioFor('failed').latency>scenarioFor('healthy').latency);
 assert.equal(scenarioFor('recovered').route,'Primary');
 assert.match(scenarioFor('recovered').description,/checks/);
 assert.throws(()=>scenarioFor('__proto__'),RangeError);
 assert.throws(()=>scenarioFor('unknown'),RangeError);
});
test('all generated local links, resources and fragments resolve',async()=>{
 for(const name of ['index.html','profile.html']){
  const html=await readFile(resolve(root,name),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  assert.equal(ids.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'Duplicate IDs');
  for(const [,url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|mailto:|data:)/.test(url))continue;
   if(url.startsWith('#')) {assert.ok(ids.has(url.slice(1)),'Missing fragment '+url);continue;}
   const path=resolve(dirname(resolve(root,name)),url==='./'?'index.html':url.split('#')[0]);
   assert.ok((await stat(path)).isFile(),'Missing resource '+url);
  }
 }
});
test('critical content is server-rendered, cases have evidence and contacts are genuine destinations',async()=>{
 const html=await readFile(resolve(root,'index.html'),'utf8');
 assert.match(html,/<h1[^>]*>Clarity/);
 assert.equal((html.match(/class="case-study"/g)||[]).length,3);
 assert.equal((html.match(/class="evidence"/g)||[]).length,3);
 assert.ok(!html.includes('https://www.linkedin.com"'),'Generic LinkedIn destination');
 assert.ok(!html.includes('class="loader"'),'Blocking loader');
 assert.ok(!html.includes('data-target="110"'),'Unverified throughput counter');
 assert.match(html,/synthetic/i);
 assert.match(html,/prefers|motion-toggle/);
 const css=await readFile(resolve(root,'styles.css'),'utf8');
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(!css.includes('.reveal{opacity:0'),'Content hidden before JS');
});
test('static delivery stays within source budgets',async()=>{
 const budgets={'index.html':40000,'styles.css':26000,'script.js':14000,'lab.mjs':4000};
 for(const [path,max] of Object.entries(budgets))assert.ok((await stat(resolve(root,path))).size<max,path+' exceeds budget');
});

test('release manifest identifies the artifact source revision',async()=>{
 const release=JSON.parse(await readFile(resolve(root,'release.json'),'utf8'));
 assert.equal(release.revision,process.env.GITHUB_SHA||'local');
});
