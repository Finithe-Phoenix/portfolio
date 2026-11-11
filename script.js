import { scenarioFor } from './lab.mjs';
const $ = (selector) => document.querySelector(selector);
const media = matchMedia('(prefers-reduced-motion: reduce)');
let manuallyReduced = false;
try { manuallyReduced = localStorage.getItem('portfolio-motion') === 'reduce'; } catch {}
let reduce = media.matches || manuallyReduced;
const motionButton = $('.motion-toggle');
function applyMotion() {
  reduce = media.matches || manuallyReduced;
  document.documentElement.dataset.motion = reduce ? 'reduce' : 'full';
  motionButton.setAttribute('aria-pressed',String(reduce));
  motionButton.setAttribute('aria-label', reduce ? 'Animations reduced; toggle motion preference' : 'Reduce animations');
  $('.motion-label').textContent = reduce ? 'Motion reduced' : 'Motion on';
  if (reduce) document.getAnimations().forEach(animation => animation.cancel());
  window.dispatchEvent(new Event('portfolio:motion'));
}
motionButton.hidden = false;
motionButton.addEventListener('click',()=>{
  manuallyReduced = !manuallyReduced;
  try { localStorage.setItem('portfolio-motion',manuallyReduced?'reduce':'full'); } catch {}
  applyMotion();
});
media.addEventListener('change',applyMotion);
applyMotion();
$('#year').textContent = new Date().getFullYear();

const menuButton = $('.menu-toggle');
const nav = $('#main-nav');
const header = $('.site-header');
header.classList.add('enhanced');
menuButton.hidden = false;
function closeMenu(restoreFocus=false) {
  menuButton.setAttribute('aria-expanded','false');
  nav.classList.remove('open');
  if(restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click',()=>{
  const opening=menuButton.getAttribute('aria-expanded')!=='true';
  menuButton.setAttribute('aria-expanded',String(opening));
  nav.classList.toggle('open',opening);
});
nav.addEventListener('click',event=>{
  if(event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && menuButton.getAttribute('aria-expanded')==='true') closeMenu(true);
});
document.addEventListener('click',event=>{
  if(!header.contains(event.target)) closeMenu();
});
matchMedia('(min-width:601px)').addEventListener('change',()=>closeMenu());

function revealCase() {
  const id=location.hash.slice(1);
  const detail=document.getElementById(id);
  if(detail?.matches('.case-study')) {
    detail.open=true;
    requestAnimationFrame(()=>detail.scrollIntoView({block:'start',behavior:'instant'}));
  }
}
document.querySelectorAll('.project-open').forEach(link=>{
  link.addEventListener('click',()=>{
    const detail=document.querySelector(link.getAttribute('href'));
    if(detail) detail.open=true;
  });
});
window.addEventListener('hashchange',revealCase);
revealCase();

// Enhance visible content without making JavaScript a prerequisite for reading it.
if ('IntersectionObserver' in window) {
  const reveals=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      if(!reduce && matchMedia('(pointer:fine)').matches) entry.target.animate([{opacity:.35,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
      reveals.unobserve(entry.target);
    });
  },{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>reveals.observe(el));
}
const scenarioButtons=document.querySelectorAll('[data-scenario]');
$('.scenario-buttons').hidden=false;
scenarioButtons.forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.scenario;
  const state=scenarioFor(id);
  scenarioButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  $('.lab-visual').dataset.state=id;
  $('.lab-state').textContent=state.title;
  $('.lab-description').textContent=state.description;
  $('#model-latency').textContent=state.latency+' ms';
  $('#model-route').textContent=state.route;
  $('.mobile-route').textContent=state.route+' service';
  $('#tradeoff').textContent=state.tradeoff;
}));

// Local canvas only. No tracking, network requests or WebGL dependency.
function initNetwork() {
const canvas=$('#network');
let ctx;
try { ctx=canvas.getContext('2d'); } catch {}
if(ctx) {
  const art=$('.hero-art');
  let width=0,height=0,frame=0,visible=true,last=0,time=0;
  let pointer={x:0,y:0},current={x:0,y:0};
  const compact=matchMedia('(max-width:600px)').matches;
  const rows=compact?9:15,cols=compact?18:28;
  const points=Array.from({length:rows*cols},(_,i)=>{
    const row=Math.floor(i/cols),col=i%cols;
    const phi=(row+.5)/rows*Math.PI,theta=col/cols*Math.PI*2;
    return {x:Math.sin(phi)*Math.cos(theta),y:Math.cos(phi),z:Math.sin(phi)*Math.sin(theta),row,col};
  });
  function resize() {
    const box=art.getBoundingClientRect();
    width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,compact?1.25:1.75);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function draw() {
    if(!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const radius=Math.min(width,height)*.375;
    const spin=reduce?.4:time*.00011;
    const tilt=.28+current.y*.14;
    const turn=spin+current.x*.2;
    const scrolled=reduce?0:Math.min(1,Math.max(0,scrollY/(innerHeight*.9)));
    const projected=points.map(p=>{
      const wave=reduce?0:Math.sin(time*.0006+p.row*.55)*.035;
      let x=p.x*Math.cos(turn)+p.z*Math.sin(turn);
      let z=-p.x*Math.sin(turn)+p.z*Math.cos(turn);
      let y=p.y*Math.cos(tilt)-z*Math.sin(tilt);
      z=p.y*Math.sin(tilt)+z*Math.cos(tilt);
      // As the reader moves on, the curved network settles into a structured lattice.
      const gridX=(p.col/(cols-1)-.5)*1.8,gridY=(p.row/(rows-1)-.5)*1.8;
      x=x*(1-scrolled*.65)+gridX*scrolled*.65;
      y=y*(1-scrolled*.65)+gridY*scrolled*.65;
      const perspective=2.8/(2.8-z*.45);
      return {x:width/2+x*radius*perspective*(1+wave),y:height/2+y*radius*perspective*(1+wave),z};
    });
    const glow=ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,radius*1.2);
    glow.addColorStop(0,'rgba(22,139,255,.09)');glow.addColorStop(1,'rgba(22,139,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ctx.lineWidth=.55;
    // Batch paths by depth: eight draw calls instead of two per node.
    for(let depth=0;depth<4;depth++) {
      const members=[];
      projected.forEach((p,i)=>{if(Math.min(3,Math.floor((p.z+1)*2))===depth)members.push(i);});
      ctx.strokeStyle='rgba(55,169,255,'+(.1+depth*.065)+')';
      ctx.beginPath();
      members.forEach(i=>{
        const p=projected[i],next=projected[Math.floor(i/cols)*cols+(i+1)%cols],below=projected[i+cols];
        ctx.moveTo(p.x,p.y);ctx.lineTo(next.x,next.y);
        if(below){ctx.moveTo(p.x,p.y);ctx.lineTo(below.x,below.y);}
      });
      ctx.stroke();
      ctx.fillStyle='rgba(85,197,255,'+(.2+depth*.18)+')';
      ctx.beginPath();
      members.forEach(i=>{const p=projected[i],r=depth>2?1.65:.8;ctx.moveTo(p.x+r,p.y);ctx.arc(p.x,p.y,r,0,Math.PI*2);});
      ctx.fill();
    }
    // Orbital arcs give the network depth without expensive blur filters.
    ctx.save();ctx.translate(width/2,height/2);ctx.rotate(-.65+current.x*.1);
    ctx.strokeStyle='rgba(255,65,87,.4)';ctx.lineWidth=.75;
    ctx.beginPath();ctx.ellipse(0,0,radius*1.21,radius*.4,0,0,Math.PI*2);ctx.stroke();
    const orbit=reduce?1.7:time*.0003;
    ctx.fillStyle='#ff5365';ctx.beginPath();ctx.arc(Math.cos(orbit)*radius*1.21,Math.sin(orbit)*radius*.4,3,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function tick(now) {
    frame=0;
    if(!visible||document.hidden||reduce)return;
    if(last && now-last<(compact?32:16)){frame=requestAnimationFrame(tick);return;}
    const elapsed=Math.min(now-(last||now),50);last=now;time+=elapsed;
    current.x+=(pointer.x-current.x)*.04;current.y+=(pointer.y-current.y)*.04;
    draw();frame=requestAnimationFrame(tick);
  }
  function sync() {
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(reduce){current={x:0,y:0};draw();}
    else if(visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  art.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||reduce)return;
    const rect=art.getBoundingClientRect();
    pointer={x:(event.clientX-rect.left)/rect.width-.5,y:(event.clientY-rect.top)/rect.height-.5};
  },{passive:true});
  art.addEventListener('pointerleave',()=>pointer={x:0,y:0});
  window.addEventListener('portfolio:motion',sync);
  document.addEventListener('visibilitychange',sync);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
  observer.observe(art);
  new ResizeObserver(resize).observe(art);
  resize();art.classList.add('canvas-ready');sync();
}

}
// Let the document paint before initializing the decorative canvas.
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 if ('requestIdleCallback' in window) requestIdleCallback(initNetwork,{timeout:1200});
 else setTimeout(initNetwork,60);
}));
