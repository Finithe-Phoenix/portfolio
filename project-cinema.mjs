// Loaded only on a story request. The server-rendered details remain the fallback.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountCinema(copy) {
 if(typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return null;
 await new Promise((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./cinema.css',import.meta.url);
  link.onload=resolve;link.onerror=reject;document.head.append(link);
 });
 const sources=[...document.querySelectorAll('.project-story')];
 const projects=sources.map(el=>({
  id:el.id,name:el.querySelector('summary').textContent.split(' · ')[0],kind:el.dataset.kind,color:el.dataset.color,
  status:el.querySelector('.story-status').textContent,
  nodes:[...el.querySelectorAll('.story-nodes li')].map(n=>n.textContent),
  beats:[...el.querySelectorAll('[data-beat]')].map(n=>({title:n.querySelector('h4').textContent,text:n.querySelector('p:last-child').textContent})),
  links:el.querySelector('.story-sources').cloneNode(true)
 }));
 const dialog=document.createElement('dialog');dialog.className='cinema';dialog.setAttribute('aria-labelledby','cinema-title');
 dialog.innerHTML=`<div class="cinema-shell">
 <header class="cinema-head"><span class="cinema-brand" aria-hidden="true">dg<span>.</span> / CINEMA</span>
 <label class="cinema-picker"><span class="sr-only">${esc(copy.label)}</span><select>${projects.map((p,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} / ${esc(p.name)}</option>`).join('')}</select></label>
 <button class="cinema-close" autofocus aria-label="${esc(copy.close)}">✕</button></header>
 <div class="cinema-body"><div class="cinema-stage" aria-hidden="true">
 <div class="cinema-orbit"></div><div class="cinema-frame"><canvas></canvas></div>
 <div class="cinema-coordinate">SYSTEM / <span class="cinema-system"></span></div>
 <span class="cinema-number">01</span><ol class="cinema-nodes"></ol></div>
 <div class="cinema-narrative"><p class="cinema-kicker"></p><h2 id="cinema-title"></h2>
 <div class="cinema-tabs" role="tablist" aria-label="${esc(copy.label)}">${copy.acts.map((a,i)=>`<button role="tab" id="cinema-tab-${i}" aria-controls="cinema-panel" aria-selected="false" tabindex="-1" data-act="${i}"><span>${String(i+1).padStart(2,'0')}</span><small>${esc(a)}</small></button>`).join('')}</div>
 <section id="cinema-panel" class="cinema-panel" role="tabpanel" tabindex="0"><p class="cinema-act"></p><h3></h3><p class="cinema-text"></p></section>
 <div class="cinema-links"></div><p class="cinema-note">${esc(copy.note)}</p></div></div>
 <footer class="cinema-controls"><button class="cinema-prev" aria-label="${esc(copy.previous)}">← <span>${esc(copy.previous)}</span></button>
 <p class="cinema-count" role="status"></p><button class="cinema-play" aria-pressed="false">${esc(copy.play)}</button>
 <button class="cinema-next" aria-label="${esc(copy.next)}"><span>${esc(copy.next)}</span> →</button>
 <nav class="cinema-projects" aria-label="${esc(copy.label)}"><button class="cinema-project-prev">← ${esc(copy.previousProject)}</button><button class="cinema-project-next">${esc(copy.nextProject)} →</button></nav>
 </footer></div>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s),tabs=[...dialog.querySelectorAll('[data-act]')];
 let project=0,act=0,scene=null,origin=null,returnFocus=null,timer=null,transition=null,playing=false,openedByClick=false,sceneVersion=0,stageVisible=true;
 const reduced=()=>document.documentElement.dataset.motion==='reduce';
 const url=()=> '#'+projects[project].id; // A stable project URL; scene changes do not flood browser history.
 const signal=()=>window.dispatchEvent(new CustomEvent('portfolio:cinema',{detail:{open:dialog.open}}));
 function stop(){clearTimeout(timer);timer=null;playing=false;$('.cinema-play').textContent=copy.play;$('.cinema-play').setAttribute('aria-pressed','false');}
 function schedule(){
  clearTimeout(timer);if(!playing||!dialog.open||document.hidden||reduced())return;
  timer=setTimeout(()=>{if(act===3){stop();return;}renderAct(act+1);schedule();},12000);
 }
 function renderAct(value,focus=false){
  act=Math.max(0,Math.min(3,value));const p=projects[project],beat=p.beats[act];
  dialog.dataset.act=act;$('.cinema-number').textContent=String(act+1).padStart(2,'0');
  $('.cinema-act').textContent=copy.acts[act];$('.cinema-panel h3').textContent=beat.title;
  $('.cinema-text').textContent=beat.text;$('#cinema-panel').setAttribute('aria-labelledby','cinema-tab-'+act);
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===act));tab.tabIndex=i===act?0:-1;});
  [...$('.cinema-nodes').children].forEach((node,i)=>node.classList.toggle('active',i<=act));
  $('.cinema-count').textContent=copy.act+' '+(act+1)+' / 4';
  $('.cinema-prev').disabled=act===0;$('.cinema-next').disabled=act===3;
  scene?.setShot(act);
  transition?.cancel();
  if(!reduced())transition=$('#cinema-panel').animate([{opacity:.2,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
  if(focus)tabs[act].focus();
 }
 async function renderProject(i){
  project=Math.max(0,Math.min(projects.length-1,i));const p=projects[project],version=++sceneVersion;
  stop();scene?.destroy();scene=null;
  dialog.dataset.color=p.color;$('.cinema-picker select').value=String(project);
  $('#cinema-title').textContent=p.name;$('.cinema-kicker').textContent=p.status;
  $('.cinema-system').textContent=p.kind.toUpperCase();
  $('.cinema-nodes').replaceChildren(...p.nodes.map((name,i)=>{const li=document.createElement('li');const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');li.append(n,document.createTextNode(name));return li;}));
  $('.cinema-links').replaceChildren(...[...p.links.children].map(n=>n.cloneNode(true)));
  $('.cinema-project-prev').disabled=project===0;$('.cinema-project-next').disabled=project===projects.length-1;
  renderAct(0);$('.cinema-body').scrollTop=0;
  try{
   const {mountScene}=await import('./fx/scenes.js');
   if(version!==sceneVersion||!dialog.open)return;
   scene=mountScene($('.cinema-stage canvas'),p.kind,{reduced:reduced(),maxFps:matchMedia('(max-width:800px)').matches?30:60,accent:p.color==='red'?'#ff5668':'#55c5ff'});
   scene.setShot(act);scene.setActive(stageVisible);
  }catch{/* The narrative and evidence remain usable without the illustration. */}
 }
 function open(id,trigger=null){
  const i=projects.findIndex(p=>p.id===id);if(i<0)return false;
  if(!dialog.open){
   origin=trigger;openedByClick=Boolean(trigger);
   if(location.hash!=='#'+id)history.pushState(null,'','#'+id);
   dialog.showModal();document.documentElement.classList.add('cinema-open');signal();
  }
  renderProject(i);return true;
 }
 function cleanup(){
  ++sceneVersion;stop();transition?.cancel();scene?.destroy();scene=null;
  document.documentElement.classList.remove('cinema-open');signal();
  origin?.focus({preventScroll:true});origin=null;
 }
 function close(updateHistory=true){
  if(!dialog.open)return;
  if(updateHistory&&openedByClick)returnFocus=origin;
  dialog.close();cleanup();
  if(updateHistory){
   if(openedByClick&&location.hash===url())history.back();
   else if(location.hash.startsWith('#story-')){history.replaceState(null,'','#work');dispatchEvent(new HashChangeEvent('hashchange'));}
  }
  openedByClick=false;
 }
 function manual(value,focus=false){stop();renderAct(value,focus);}
 $('.cinema-close').addEventListener('click',()=>close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 $('.cinema-prev').addEventListener('click',()=>manual(act-1));
 $('.cinema-next').addEventListener('click',()=>manual(act+1));
 tabs.forEach((tab,i)=>tab.addEventListener('click',()=>manual(i)));
 $('.cinema-tabs').addEventListener('keydown',event=>{
  const key=event.key;if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;
  event.preventDefault();manual(key==='Home'?0:key==='End'?3:act+(key==='ArrowRight'?1:-1),true);
 });
 $('.cinema-play').addEventListener('click',()=>{
  if(playing){stop();return;}if(reduced())return;
  if(act===3)renderAct(0);playing=true;$('.cinema-play').textContent=copy.pause;$('.cinema-play').setAttribute('aria-pressed','true');schedule();
 });
 function changeProject(i){renderProject(i);history.replaceState(null,'',url());}
 $('.cinema-picker select').addEventListener('change',e=>changeProject(Number(e.target.value)));
 $('.cinema-project-prev').addEventListener('click',()=>changeProject(project-1));
 $('.cinema-project-next').addEventListener('click',()=>changeProject(project+1));
 $('.cinema-links').addEventListener('click',event=>{if(event.target.closest('a[href^="#case-"]'))close(false);});
 // Let the existing chapter router handle full-case links after closing the theater.
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();scene?.setActive(dialog.open&&!document.hidden&&stageVisible);});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;scene?.setActive(dialog.open&&stageVisible&&!document.hidden);},{root:$('.cinema-body')}).observe($('.cinema-stage'));
 const syncMotion=()=>{stop();scene?.setReduced(reduced());$('.cinema-play').disabled=reduced();};
 window.addEventListener('portfolio:motion',syncMotion);syncMotion();
 function restore(){
  const id=location.hash.slice(1);
  if(id.startsWith('story-')){if(!dialog.open||projects[project].id!==id)open(id);}
  else close(false);
  if(returnFocus){const target=returnFocus;returnFocus=null;requestAnimationFrame(()=>target.focus({preventScroll:true}));}
 }
 window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);
 return {open};
}

