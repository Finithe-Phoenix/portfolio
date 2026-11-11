// Native navigation, enhanced as a chapter-by-chapter story. No rendering dependencies.
export function mountJourney(scenes, copy, options={}) {
 const root=document.documentElement, main=document.querySelector('main');
 let guided=true,index=0,project=0;
 try { guided=sessionStorage.getItem('dg-view')!=='all'; }catch{}
 const bar=document.createElement('nav');bar.className='journey-bar';bar.setAttribute('aria-label',copy.label);
 const label=document.createElement('label');label.htmlFor='journey-select';label.textContent=copy.label;
 const select=document.createElement('select');select.id='journey-select';
 scenes.forEach((scene,i)=>{const option=document.createElement('option');option.value=scene.id;option.textContent=String(i+1).padStart(2,'0')+' / '+copy.names[i];select.append(option);});
 const status=document.createElement('p');status.className='journey-status';status.setAttribute('aria-live','polite');
 const previous=document.createElement('button');previous.className='journey-prev';previous.textContent=copy.previous;
 const next=document.createElement('button');next.className='journey-next';next.textContent=copy.next;
 const mode=document.createElement('button');mode.className='journey-mode';
 bar.append(label,select,status,previous,next,mode);document.body.append(bar);
 const chapters=scenes.map(s=>document.getElementById(s.id));
 const extras=[...main.children].filter(el=>!chapters.includes(el));
 const reduced=()=>root.dataset.motion==='reduce';
 function render(scroll=false,focus=false) {
  root.dataset.chapter=scenes[index].id;
  root.classList.toggle('guided',guided);root.classList.add('journey-ready');
  chapters.forEach((el,i)=>{el.hidden=guided&&i!==index;});
  extras.forEach(el=>{el.hidden=guided&&index!==1;});
  select.value=scenes[index].id;
  previous.disabled=index===0;next.disabled=index===scenes.length-1;
  next.textContent=index===scenes.length-1?copy.end:copy.next;
  mode.textContent=guided?copy.readAll:copy.story;
  mode.setAttribute('aria-pressed',String(!guided));
  status.textContent=copy.lines[index];
  if(scroll)window.scrollTo({top:0,behavior:'instant'});
  if(focus){
   const heading=chapters[index].querySelector('h1,h2')||chapters[index];
   heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
  }
  if(scroll&&guided&&!reduced())chapters[index].animate([{opacity:.4,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
  options.onChange?.(index,guided);
 }
 function navigate(i,{history=true,focus=true}={}){
  index=Math.max(0,Math.min(scenes.length-1,i));
  if(history)window.history.pushState(null,'','#'+scenes[index].id);
  render(true,focus);
 }
 function findTarget(hash){
  let id;try{id=decodeURIComponent(hash.slice(1));}catch{return -1;}
  const target=document.getElementById(id);
  return target?chapters.findIndex(el=>el===target||el.contains(target)):-1;
 }
 function restore(){const i=location.hash?findTarget(location.hash):0;if(i>=0){index=i;render(false,false);}}
 previous.addEventListener('click',()=>navigate(index-1));
 next.addEventListener('click',()=>navigate(index+1));
 select.addEventListener('change',()=>navigate(scenes.findIndex(s=>s.id===select.value)));
 mode.addEventListener('click',()=>{
  guided=!guided;try{sessionStorage.setItem('dg-view',guided?'story':'all');}catch{}
  render(false,false);
  if(!guided)chapters[index].scrollIntoView({behavior:'instant',block:'start'});
  else window.scrollTo({top:0,behavior:'instant'});
 });
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href^="#"]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const hash=link.getAttribute('href'),i=findTarget(hash);if(i<0||!guided)return;
  event.preventDefault();index=i;window.history.pushState(null,'',hash);render(true,true);
  const target=document.getElementById(hash.slice(1));
  if(target?.matches('details'))target.open=true;
  if(target&&target!==chapters[index])requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));
 },true);
 addEventListener('popstate',restore);addEventListener('hashchange',restore);
 const initial=findTarget(location.hash);if(initial>=0)index=initial;
 render(false,false);

 // The gallery is an independently controllable, native scroll-snap surface.
 const track=document.querySelector('.gallery-track'),cards=[...track.querySelectorAll('.project-card')];
 const controls=document.createElement('div');controls.className='project-controls wrap';
 const back=document.createElement('button');back.textContent=copy.previousProject;
 const forward=document.createElement('button');forward.textContent=copy.nextProject;
 const count=document.createElement('p');count.setAttribute('aria-live','polite');
 controls.append(back,count,forward);document.querySelector('.gallery').append(controls);
 function updateProject(i){
  project=i;back.disabled=i===0;forward.disabled=i===cards.length-1;
  count.textContent=(i+1)+' / '+cards.length+' — '+cards[i].querySelector('h3').textContent;
 }
 function goProject(i){
  i=Math.max(0,Math.min(cards.length-1,i));
  const c=cards[i].getBoundingClientRect(),t=track.getBoundingClientRect();
  const left=track.scrollLeft+c.left-t.left-(track.clientWidth-c.width)/2;
  updateProject(i);track.scrollTo({left,behavior:reduced()?'instant':'smooth'});
 }
 back.addEventListener('click',()=>goProject(project-1));forward.addEventListener('click',()=>goProject(project+1));
 track.addEventListener('keydown',event=>{if(event.target!==track||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();goProject(project+(event.key==='ArrowRight'?1:-1));});
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>=.6)updateProject(cards.indexOf(e.target));},{root:track,threshold:[.6,.8,1]});
  cards.forEach(card=>observer.observe(card));
 }
 updateProject(0);
 return {get guided(){return guided;},get index(){return index;},sync(i){if(!guided&&i!==index){index=i;select.value=scenes[i].id;status.textContent=copy.lines[i];previous.disabled=i===0;next.disabled=i===scenes.length-1;}}};
}
