import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {scenarioFor,sampleLatency} from '../lab.mjs';
const root=resolve('dist');
const locales=['','es/','pt/'];
const pages=locales.flatMap(dir=>[dir+'index.html',dir+'profile.html']);
const count=(html,pattern)=>(html.match(pattern)||[]).length;
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
  for(const [i,project] of english.projects.entries())for(const key of ['id','repo','demo','number','color','scene'])assert.equal(translated.projects[i][key],project[key]);
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
  assert.ok(html.includes('<html lang="'+langs[dir]+'"'));
  assert.equal(count(html,/<h1[ >]/g),1);
  assert.equal(count(html,/<article class="project-card /g),8);
  assert.equal(count(html,/<canvas class="scene" data-scene="/g),8);
  assert.equal(count(html,/class="case-study"/g),3);
  assert.equal(count(html,/class="evidence"/g),3);
  assert.equal(count(html,/class="tl-item /g),5);
  assert.equal(count(html,/data-count="/g),6);
  assert.equal(count(html,/rel="alternate" hreflang=/g),4);
  assert.ok(html.includes('aria-current="true"'));
  assert.match(html,/<h1 id="hero-title" aria-label="[^"]{10,}"/);
  assert.match(html,/<h2 id="work-title" class="kinetic" aria-label="[^"]{10,}"/);
  assert.match(html,/href="mailto:[^"]+@[^"]+"/);
  assert.ok(html.includes('linkedin.com/in/daniel-eduardo-gonzalez-ramirez'));
  assert.ok(!/\+52|722 ?467/.test(html),'Phone number must not be published');
  assert.doesNotThrow(()=>JSON.parse(html.match(/<script type="application\/json" id="i18n">(.*?)<\/script>/s)[1]));
 }
 const english=await readFile(resolve(root,'index.html'),'utf8');
 assert.ok(english.includes('aria-label="Clarity through complexity."'));
 assert.match(english,/synthetic/i);
});
test('only public repositories are linked',async()=>{
 const allowed=new Set(['portfolio','prisma','PulmonogyClinic','devops-contenedores-kubernetes-curso','Testing-Agents-Worflows','LabNovaTesting','Discovery-Nexus-One','chadwallet-founder-screen-pro','Playwright-Curso']);
 for(const name of pages){
  const html=await readFile(resolve(root,name),'utf8');
  for(const [,repo] of html.matchAll(/github\.com\/Finithe-Phoenix\/([A-Za-z0-9_.-]+)/g))assert.ok(allowed.has(repo),'Unexpected repository link: '+repo);
 }
});
test('motion never hides content without JavaScript and honours reduced motion',async()=>{
 const css=await readFile(resolve(root,'styles.css'),'utf8');
 for(const rule of ['prefers-reduced-motion:reduce','html[data-motion=reduce]','html.anim .reveal:not(.in){opacity:0','html.anim .manifesto-text span:not(.on){opacity','.intro{display:none}','html[data-motion=reduce] .intro{display:none!important}'])assert.ok(css.includes(rule),'Missing rule: '+rule);
 assert.ok(!/(^|[},\n])\.reveal\{[^}]*opacity:0/.test(css),'Content hidden before JS');
 assert.ok(!/(^|[},\n])\.manifesto-text span\{[^}]*opacity:\.\d/.test(css),'Manifesto dimmed before JS');
});
test('static delivery stays within source budgets',async()=>{
 const budgets={'index.html':62000,'es/index.html':64000,'pt/index.html':64000,'styles.css':50000,'script.js':28000,'lab.mjs':2000,'fx/world.js':40000,'fx/scenes.js':90000};
 for(const [path,max] of Object.entries(budgets))assert.ok((await stat(resolve(root,path))).size<max,path+' exceeds budget');
});
test('the published effects folder contains only the two effect modules',async()=>{
 assert.deepEqual((await readdir(resolve(root,'fx'))).sort(),['scenes.js','world.js']);
});
test('release manifest identifies the artifact source revision',async()=>{
 const release=JSON.parse(await readFile(resolve(root,'release.json'),'utf8'));
 assert.equal(release.revision,process.env.GITHUB_SHA||'local');
});
