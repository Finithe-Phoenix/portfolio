import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {scenarioFor,sampleLatency} from '../lab.mjs';
const root=resolve('dist');
const locales=['','es/','pt/'];
const pages=locales.flatMap(dir=>[dir+'index.html',dir+'profile.html']);
const shape=value=>Array.isArray(value)?'['+value.map(shape).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).map(key=>key+':'+shape(value[key])).join(',')+'}':typeof value;
test('failure routes to standby and recovery returns to primary',()=>{
 assert.equal(scenarioFor('failed').route,'standby');
 assert.ok(scenarioFor('failed').latency>scenarioFor('healthy').latency);
 assert.equal(scenarioFor('recovered').route,'primary');
 assert.throws(()=>scenarioFor('__proto__'),RangeError);
 assert.throws(()=>scenarioFor('unknown'),RangeError);
});
test('the simulated latency trace is repeatable and stays near its scenario value',()=>{
 for(const id of ['healthy','failed','recovered'])for(let step=-40;step<400;step++){
  const value=sampleLatency(id,step);
  assert.equal(value,sampleLatency(id,step));
  assert.ok(Math.abs(value-scenarioFor(id).latency)<=4,id+' drifted at step '+step);
 }
});
test('every locale has the same content structure as English',async()=>{
 const read=async code=>JSON.parse(await readFile(resolve('content/locales',code+'.json'),'utf8'));
 const english=await read('en');
 for(const code of ['es','pt']){
  const translated=await read(code);
  assert.equal(shape(translated),shape(english),code+' differs in structure');
  assert.notEqual(translated.hero.intro,english.hero.intro,code+' is not translated');
  for(const [i,project] of english.projects.entries())for(const key of ['id','repo','demo','number','color'])assert.equal(translated.projects[i][key],project[key]);
  for(const [i,item] of english.stats.items.entries())assert.equal(translated.stats.items[i].value,item.value);
 }
});
test('all generated local links, resources and fragments resolve',async()=>{
 for(const name of pages){
  const html=await readFile(resolve(root,name),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  assert.equal(ids.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'Duplicate IDs in '+name);
  for(const [,url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|mailto:|data:)/.test(url))continue;
   if(url.startsWith('#')) {assert.ok(ids.has(url.slice(1)),'Missing fragment '+url+' in '+name);continue;}
   const target=url.split('#')[0];
   const path=resolve(dirname(resolve(root,name)),target.endsWith('/')?target+'index.html':target);
   assert.ok((await stat(path)).isFile(),'Missing resource '+url+' in '+name);
  }
 }
});
test('critical content is server-rendered in every language',async()=>{
 const langs={'':'en','es/':'es','pt/':'pt-BR'};
 for(const dir of locales){
  const html=await readFile(resolve(root,dir+'index.html'),'utf8');
  assert.match(html,new RegExp('<html lang="'+langs[dir]+'"'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert.equal((html.match(/class="case-study"/g)||[]).length,3);
  assert.equal((html.match(/class="evidence"/g)||[]).length,3);
  assert.equal((html.match(/class="tl-item /g)||[]).length,5);
  assert.equal((html.match(/data-count="/g)||[]).length,6);
  assert.equal((html.match(/rel="alternate" hreflang=/g)||[]).length,4);
  assert.match(html,/aria-current="true"/);
  assert.match(html,/href="mailto:[^"]+@[^"]+"/);
  assert.match(html,/linkedin\.com\/in\/daniel-eduardo-gonzalez-ramirez/);
  assert.ok(!html.includes('class="loader"'),'Blocking loader');
  assert.ok(!/\+52|722 ?467/.test(html),'Phone number must not be published');
  assert.doesNotThrow(()=>JSON.parse(html.match(/<script type="application\/json" id="i18n">(.*?)<\/script>/s)[1]));
 }
 const english=await readFile(resolve(root,'index.html'),'utf8');
 assert.match(english,/id="hero-title".*Clarity.*complexity\./s);
 assert.match(english,/synthetic/i);
});
test('motion never hides content without JavaScript and honours reduced motion',async()=>{
 const css=await readFile(resolve(root,'styles.css'),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/html\[data-motion=reduce\]/);
 assert.match(css,/html\.anim \.reveal:not\(\.in\)\{opacity:0/);
 assert.ok(!/(^|[},\n])\.reveal\{[^}]*opacity:0/.test(css),'Content hidden before JS');
});
test('static delivery stays within source budgets',async()=>{
 const budgets={'index.html':52000,'es/index.html':54000,'pt/index.html':54000,'styles.css':40000,'script.js':20000,'lab.mjs':2000};
 for(const [path,max] of Object.entries(budgets))assert.ok((await stat(resolve(root,path))).size<max,path+' exceeds budget');
});
test('release manifest identifies the artifact source revision',async()=>{
 const release=JSON.parse(await readFile(resolve(root,'release.json'),'utf8'));
 assert.equal(release.revision,process.env.GITHUB_SHA||'local');
});
