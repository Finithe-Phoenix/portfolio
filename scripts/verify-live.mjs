import assert from 'node:assert/strict';
const base='https://finithe-phoenix.github.io/portfolio/';
const expected=process.env.GITHUB_SHA;
assert.ok(expected,'GITHUB_SHA is required');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let ready=false;
for(let attempt=1;attempt<=16;attempt++){
 try {
  const response=await fetch(base+'release.json?revision='+expected,{signal:AbortSignal.timeout(12000),cache:'no-store'});
  if(response.ok && (await response.json()).revision===expected){ready=true;break;}
  console.log('Waiting for Pages revision: attempt '+attempt);
 } catch(error){console.log('Waiting for Pages: '+error.message);}
 if(attempt<16)await delay(15000);
}
assert.ok(ready,'Pages did not expose the expected source revision');
for(const path of ['','es/','pt/','styles.css','script.js','lab.mjs','fx/world.js','fx/scenes.js','profile.html','es/profile.html','pt/profile.html','assets/social-card.png','sitemap.xml']){
 const response=await fetch(base+path+'?revision='+expected,{signal:AbortSignal.timeout(15000),cache:'no-store'});
 assert.equal(response.status,200,path+' must return HTTP 200');
 const content=await response.arrayBuffer();assert.ok(content.byteLength>0,path+' is empty');
 if(path==='')assert.match(new TextDecoder().decode(content),/id="hero-title"/);
 if(path==='es/')assert.match(new TextDecoder().decode(content),/<html lang="es"/);
 if(path==='pt/')assert.match(new TextDecoder().decode(content),/<html lang="pt-BR"/);
 if(path==='profile.html')assert.match(new TextDecoder().decode(content),/id="resume"/);
 if(path.endsWith('.png'))assert.deepEqual([...new Uint8Array(content).slice(0,8)],[137,80,78,71,13,10,26,10]);
 console.log('PASS public '+(path||'index.html')+' ('+content.byteLength+' bytes)');
}
console.log('Verified public revision '+expected+' at '+base);
