import { scenarioFor, sampleLatency } from './lab.mjs';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const root = document.documentElement;
const text = JSON.parse($('#i18n').textContent);
const finePointer = matchMedia('(pointer:fine)');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/* Motion preference: the operating system wins, then the visitor's saved choice. */
const media = matchMedia('(prefers-reduced-motion: reduce)');
let manuallyReduced = false;
try { manuallyReduced = localStorage.getItem('portfolio-motion') === 'reduce'; } catch {}
let reduce = media.matches || manuallyReduced;
const motionButton = $('.motion-toggle');
function applyMotion() {
  reduce = media.matches || manuallyReduced;
  root.dataset.motion = reduce ? 'reduce' : 'full';
  // Reveals hide content until observed, so they are armed only where the observer exists.
  root.classList.toggle('anim', !reduce && 'IntersectionObserver' in window);
  motionButton.setAttribute('aria-pressed', String(reduce));
  motionButton.setAttribute('aria-label', reduce ? text.motionAriaReduced : text.motionAriaOn);
  $('.motion-label').textContent = reduce ? text.motionReduced : text.motionOn;
  if (reduce) document.getAnimations().forEach(animation => animation.cancel());
  window.dispatchEvent(new Event('portfolio:motion'));
}
motionButton.hidden = false;
motionButton.addEventListener('click', () => {
  manuallyReduced = !manuallyReduced;
  try { localStorage.setItem('portfolio-motion', manuallyReduced ? 'reduce' : 'full'); } catch {}
  applyMotion();
});
media.addEventListener('change', applyMotion);
applyMotion();
$('#year').textContent = new Date().getFullYear();

/* Navigation */
const menuButton = $('.menu-toggle');
const nav = $('#main-nav');
const header = $('.site-header');
header.classList.add('enhanced');
menuButton.hidden = false;
function closeMenu(restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  nav.classList.toggle('open', opening);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
matchMedia('(min-width:901px)').addEventListener('change', () => closeMenu());

function revealCase() {
  const detail = document.getElementById(location.hash.slice(1));
  if (detail?.matches('.case-study')) {
    detail.open = true;
    requestAnimationFrame(() => detail.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
}
$$('.project-open[href^="#"]').forEach(link => link.addEventListener('click', () => {
  const detail = document.getElementById(link.getAttribute('href').slice(1));
  if (detail) detail.open = true;
}));
window.addEventListener('hashchange', revealCase);
revealCase();

/* Scroll reveals, counters and the active navigation link. */
if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    reveals.unobserve(entry.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(element => reveals.observe(element));

  const counters = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counters.unobserve(entry.target);
    const element = entry.target, target = Number(element.dataset.count);
    if (reduce) return;
    const started = performance.now(), duration = 1700;
    (function step(now) {
      const progress = reduce ? 1 : clamp((now - started) / duration);
      element.textContent = Math.round(target * (1 - Math.pow(2, -10 * progress)) / (1 - Math.pow(2, -10)));
      if (progress < 1) requestAnimationFrame(step);
    })(started);
  }), { threshold: .6 });
  $$('.count').forEach(element => counters.observe(element));

  const links = new Map($$('#main-nav a').map(link => [link.getAttribute('href').slice(1), link]));
  const sections = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => link.classList.remove('active'));
    links.get(entry.target.id)?.classList.add('active');
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const section = document.getElementById(id); if (section) sections.observe(section); });
}

/* One scroll pipeline: progress bar, world dimming, timeline fill, manifesto, pinned gallery and velocity. */
const timeline = $('.timeline');
const manifesto = $('.manifesto-text'), manifestoWords = $$('.manifesto-text span');
const gallery = $('.gallery'), track = $('.gallery-track'), sticky = $('.gallery-sticky'), cards = $$('.project-card');
const galleryCount = $('.gallery-count b');
const marquees = $$('.marquee-track');
let travel = 0, pinTop = 0, pinned = false, centers = [], lastY = scrollY, velocity = 0, lit = 0, loopId = 0;
function layoutGallery() {
  pinned = !reduce && finePointer.matches && innerWidth > 900 && innerHeight >= 640;
  gallery.classList.toggle('pinned', pinned);
  cards.forEach(card => { card.style.removeProperty('--tilt'); card.style.removeProperty('--zoom'); });
  track.style.removeProperty('--gx'); track.style.removeProperty('--gs');
  if (!pinned) { gallery.style.removeProperty('--gallery-height'); return; }
  sticky.scrollLeft = 0;
  pinTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const box = track.getBoundingClientRect();
  centers = cards.map(card => { const r = card.getBoundingClientRect(); return r.left + r.width / 2 - box.left; });
  travel = Math.max(0, track.offsetWidth - innerWidth);
  gallery.style.setProperty('--gallery-height', Math.round(sticky.offsetHeight + travel) + 'px');
}
function frame() {
  loopId = 0;
  const y = scrollY;
  velocity += ((y - lastY) - velocity) * .35; lastY = y;
  const scrollable = root.scrollHeight - innerHeight;
  root.style.setProperty('--scroll', scrollable > 0 ? clamp(y / scrollable).toFixed(4) : 0);
  root.style.setProperty('--world', (1 - .66 * clamp(y / (innerHeight * .8))).toFixed(3));
  stage(y);
  const line = timeline.getBoundingClientRect();
  timeline.style.setProperty('--tl', reduce ? 1 : clamp((innerHeight * .62 - line.top) / line.height).toFixed(4));
  // Manifesto words light once and stay lit, so the sentence is never left half-dimmed.
  const words = manifesto.getBoundingClientRect();
  const target = reduce ? manifestoWords.length : Math.round(clamp((innerHeight * .82 - words.top) / (words.height + innerHeight * .3)) * manifestoWords.length);
  while (lit < target) manifestoWords[lit++].classList.add('on');
  manifestoWords.forEach((word, i) => word.classList.toggle('spark', !reduce && lit < manifestoWords.length && i >= lit - 2 && i < lit));
  if (pinned) {
    const progress = travel ? clamp((pinTop - gallery.getBoundingClientRect().top) / travel) : 0;
    const shift = -progress * travel;
    track.style.setProperty('--gx', shift.toFixed(1) + 'px');
    track.style.setProperty('--gs', clamp(velocity * -.035, -3.5, 3.5).toFixed(2) + 'deg');
    gallery.style.setProperty('--gp', progress.toFixed(4));
    centers.forEach((center, i) => {
      const offset = (center + shift - innerWidth / 2) / innerWidth, distance = Math.abs(offset);
      cards[i].style.setProperty('--tilt', (clamp(offset, -1, 1) * -11).toFixed(2) + 'deg');
      cards[i].style.setProperty('--zoom', (1 - Math.min(distance, 1) * .09).toFixed(3));
    });
    galleryCount.textContent = String(Math.round(progress * (cards.length - 1)) + 1).padStart(2, '0');
  }
  // The marquee picks up speed with the scroll.
  const boost = reduce ? 1 : 1 + Math.min(Math.abs(velocity) * .12, 7);
  marquees.forEach(row => row.getAnimations().forEach(animation => { animation.playbackRate = boost; }));
  if (Math.abs(velocity) > .05) queue();
}
function queue() { if (!loopId) loopId = requestAnimationFrame(frame); }
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => { layoutGallery(); queue(); });
addEventListener('portfolio:motion', () => { layoutGallery(); queue(); });
finePointer.addEventListener('change', () => { layoutGallery(); queue(); });
// Keyboard users reach every card: focusing one scrolls the page to where the gallery shows it.
track.addEventListener('focusin', event => {
  const index = cards.indexOf(event.target.closest('.project-card'));
  if (!pinned || index < 0 || !travel) return;
  sticky.scrollLeft = 0;
  const wanted = clamp((centers[index] - innerWidth / 2) / travel);
  scrollTo({ top: gallery.getBoundingClientRect().top + scrollY - pinTop + wanted * travel, behavior: 'instant' });
});
layoutGallery();

/* Pointer effects: ambient light, card tilt and magnetic buttons. Fine pointers only. */
const glow = $('.cursor-glow'), ring = $('.cursor');
addEventListener('pointermove', event => {
  if (reduce || event.pointerType !== 'mouse') return;
  glow.classList.add('on'); ring.classList.add('on');
  glow.style.setProperty('--gx', event.clientX + 'px');
  glow.style.setProperty('--gy', event.clientY + 'px');
  ring.style.setProperty('--cx', event.clientX + 'px');
  ring.style.setProperty('--cy', event.clientY + 'px');
}, { passive: true });
addEventListener('pointerover', event => {
  const labelled = event.target.closest?.('[data-cursor]');
  ring.classList.toggle('label', Boolean(labelled));
  ring.classList.toggle('hover', !labelled && Boolean(event.target.closest?.('a,button,summary')));
  if (labelled) $('span', ring).textContent = labelled.dataset.cursor;
}, { passive: true });
document.addEventListener('pointerleave', () => ring.classList.remove('on'));
$$('.project-card').forEach(card => {
  const surface = $('.project-open', card);
  card.addEventListener('pointermove', event => {
    if (reduce || !finePointer.matches) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    surface.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
    surface.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
    surface.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    surface.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  }, { passive: true });
  card.addEventListener('pointerleave', () => { surface.style.setProperty('--rx', '0deg'); surface.style.setProperty('--ry', '0deg'); });
});
$$('.magnetic').forEach(button => {
  button.addEventListener('pointermove', event => {
    if (reduce || !finePointer.matches) return;
    const box = button.getBoundingClientRect();
    button.style.setProperty('--tx', ((event.clientX - box.left - box.width / 2) * .22).toFixed(1) + 'px');
    button.style.setProperty('--ty', ((event.clientY - box.top - box.height / 2) * .3).toFixed(1) + 'px');
  }, { passive: true });
  button.addEventListener('pointerleave', () => { button.style.setProperty('--tx', '0px'); button.style.setProperty('--ty', '0px'); });
});

/* Resilience lab: deterministic scenarios plus a simulated traffic trace. */
const labVisual = $('.lab-visual');
const scenarioButtons = $$('[data-scenario]');
let scenario = 'healthy', routed = 0, rerouted = 0, step = 0, labVisible = false, labTimer = 0;
const trace = Array.from({ length: 40 }, (_, i) => sampleLatency('healthy', i - 40));
function drawTrace() {
  $('#spark-line').setAttribute('points', trace.map((value, i) => (i * 200 / 39).toFixed(1) + ',' + (48 - (value - 25) * 48 / 75).toFixed(1)).join(' '));
}
function labTick() {
  step++; routed++;
  if (scenarioFor(scenario).route === 'standby') rerouted++;
  trace.push(sampleLatency(scenario, step)); trace.shift();
  $('#model-routed').textContent = routed.toLocaleString(root.lang);
  $('#model-rerouted').textContent = rerouted.toLocaleString(root.lang);
  drawTrace();
}
function syncLab() {
  clearInterval(labTimer); labTimer = 0;
  if (labVisible && !reduce && !document.hidden) labTimer = setInterval(labTick, 380);
}
$('.scenario-buttons').hidden = false;
$('.lab-live').hidden = false;
drawTrace();
scenarioButtons.forEach(button => button.addEventListener('click', () => {
  scenario = button.dataset.scenario;
  const state = scenarioFor(scenario), copy = text.scenarios[scenario];
  scenarioButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  labVisual.dataset.state = scenario;
  const lab = $('.lab');
  lab.classList.remove('hit');
  if (scenario === 'failed' && !reduce) { void lab.offsetWidth; lab.classList.add('hit'); }
  $('.lab-state').textContent = copy.title;
  $('.lab-description').textContent = copy.description;
  $('#model-latency').textContent = state.latency + ' ms';
  $('#model-route').textContent = copy.route;
  $('.mobile-route').textContent = copy.mobile;
  $('#tradeoff').textContent = copy.tradeoff;
}));
if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { labVisible = entry.isIntersecting; syncLab(); }).observe($('.lab'));
addEventListener('portfolio:motion', syncLab);
document.addEventListener('visibilitychange', syncLab);

/* Cinematic layer: a WebGL world behind the page and a motion scene per project.
   Both load after first paint and the page is complete without them. */
/* Story: each section is a scene. The particle protagonist morphs between them, and the HUD names the shot. */
const scenes = [
  { id: 'top', shape: { type: 'sphere' }, x: .46, y: .02, scale: 1.05, dim: 1 },
  { id: 'impact', shape: { type: 'wave' }, x: 0, y: -.25, scale: 1.5, dim: .5 },
  { id: 'experience', shape: { type: 'helix' }, x: .62, y: 0, scale: 1, dim: .6 },
  { id: 'ai', shape: { type: 'network' }, x: .5, y: .1, scale: 1.1, dim: .7 },
  { id: 'work', shape: { type: 'grid' }, x: 0, y: 0, scale: 1.5, dim: .22 },
  { id: 'lab', shape: { type: 'rings' }, x: -.55, y: 0, scale: 1, dim: .55 },
  { id: 'about', shape: { type: 'text', text: 'dg.' }, x: .5, y: .15, scale: 1, dim: .5 },
  { id: 'contact', shape: { type: 'sphere' }, x: .55, y: 0, scale: 1.2, dim: .8 }
];
const hudTime = $('.hud-time'), hudScene = $('.hud-scene');
let tops = [], sceneIndex = -1;
function measureScenes() { tops = scenes.map(scene => document.getElementById(scene.id).getBoundingClientRect().top + scrollY); }
function stage(y) {
  if (!tops.length) return;
  const focus = y + innerHeight * .5;
  let index = 0;
  while (index < scenes.length - 1 && focus >= tops[index + 1]) index++;
  // The morph happens in the last third of each scene, so shapes hold still while a section is read.
  const next = tops[index + 1] ?? root.scrollHeight;
  const through = clamp((focus - tops[index]) / Math.max(1, next - tops[index]));
  const morph = index < scenes.length - 1 ? clamp((through - .66) / .34) : 0;
  const eased = morph * morph * (3 - 2 * morph);
  if (fx.particles) {
    const from = scenes[index], to = scenes[Math.min(index + 1, scenes.length - 1)], narrow = innerWidth < 901;
    const mix = key => from[key] + (to[key] - from[key]) * eased;
    fx.particles.setShape(index + morph);
    fx.particles.setAnchor(narrow ? 0 : mix('x'), narrow ? (index ? 0 : -.3) : mix('y'), mix('scale') * (narrow ? .8 : 1));
    fx.particles.setDim(mix('dim') * (narrow && index ? .28 : 1));
  }
  const frames = Math.floor(y / 4.2), pad = value => String(value).padStart(2, '0');
  hudTime.textContent = pad(Math.floor(frames / 86400) % 100) + ':' + pad(Math.floor(frames / 1440) % 60) + ':' + pad(Math.floor(frames / 24) % 60) + ':' + pad(frames % 24);
  if (index !== sceneIndex) { sceneIndex = index; hudScene.textContent = 'SCENE ' + pad(index + 1) + ' / ' + scenes[index].id.toUpperCase(); updateChapters(index); }
}
addEventListener('resize', measureScenes);
addEventListener('load', () => { measureScenes(); queue(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { measureScenes(); queue(); }).observe(document.body);
measureScenes();

const moods = { top: 'blue', impact: 'blue', experience: 'ice', ai: 'violet', work: 'blue', lab: 'red', about: 'ice', contact: 'red' };
const fx = { world: null, particles: null, scenes: [], still: false };
const chapterCopy = root.lang.startsWith('es') ? ['Capítulos','Reconstruir escultura'] : root.lang.startsWith('pt') ? ['Capítulos','Reconstruir escultura'] : ['Chapters','Rebuild sculpture'];
const chapterNav = document.createElement('nav');
chapterNav.className = 'scene-dock';
chapterNav.setAttribute('aria-label', chapterCopy[0]);
const chapterLinks = scenes.map((scene,index) => {
  const heading = document.querySelector('#'+scene.id+' h1, #'+scene.id+' h2');
  const label = heading?.getAttribute('aria-label') || heading?.textContent.trim() || scene.id;
  const link=document.createElement('a');
  link.href='#'+scene.id; link.setAttribute('aria-label', label);
  link.title=label; link.textContent=String(index+1).padStart(2,'0');
  chapterNav.append(link); return link;
});
const replayButton=document.createElement('button');
replayButton.className='sculpture-replay';
replayButton.textContent=chapterCopy[1]; replayButton.disabled=reduce;
let mobileFxEnabled = false;
replayButton.addEventListener('click',()=>{
  if(reduce || fx.still)return;
  if(matchMedia('(max-width:600px)').matches && !mobileFxEnabled){initFx(true);return;}
  fx.particles?.burst();
});
document.querySelector('.hero-actions').append(replayButton);
document.body.append(chapterNav);
function updateChapters(index) {
  chapterLinks.forEach((link,i)=>{
    if(i===index)link.setAttribute('aria-current','step');
    else link.removeAttribute('aria-current');
  });
}
updateChapters(Math.max(0,sceneIndex));
addEventListener('portfolio:motion', () => {
  fx.world?.setReduced(reduce || fx.still);
  fx.particles?.setReduced(reduce || fx.still);
  fx.scenes.forEach(scene => scene.setReduced(reduce || fx.still));
  replayButton.disabled = reduce || fx.still;
});
function initFx(enableMobile = false) {
  const compact = matchMedia('(max-width:600px)').matches;
  if(compact && !enableMobile){
    root.classList.add('fx-done');
    replayButton.textContent = root.lang.startsWith('es') ? 'Activar efectos cinematográficos' : root.lang.startsWith('pt') ? 'Ativar efeitos cinematográficos' : 'Enable cinematic effects';
    return;
  }
  mobileFxEnabled = compact;
  replayButton.textContent = chapterCopy[1];
  import('./fx/particles.js').then(module => {
    fx.particles = module.mountParticles($('#particles'), { reduced: reduce, compact, shapes: scenes.map(scene => scene.shape) });
    if (!fx.particles) { replayButton.hidden=true; return; }
    if(fx.still)fx.particles.setReduced(true);
    $('.hero-art').classList.add('canvas-ready');
    root.classList.add('particles-ready');
    stage(scrollY);
    // Replay the entrance once the intro shutters open.
    if (root.classList.contains('intro-on') && !reduce) setTimeout(() => fx.particles.burst(), 1450);
  }).catch(() => {}).finally(() => root.classList.add('fx-done'));
  import('./fx/world.js').then(module => {
    const canvas = $('#world');
    fx.world = module.mountWorld(canvas, { reduced: reduce, compact });
    if (!fx.world) return;
    root.classList.add('world-ready');
    // Quality governor: sample frame times; a slow device first drops to a quarter of the pixels,
    // then to a still frame. It only ever steps down.
    let samples = [], previous = 0, settle = 0, probeId = 0, finished = false;
    const probe = now => {
      probeId = 0;
      if (finished || fx.still || reduce || document.hidden) { previous = 0; samples = []; return; }
      else if (previous && ++settle > 45) samples.push(now - previous);
      previous = now;
      if (samples.length >= 40) {
        const median = samples.sort((a, b) => a - b)[20];
        samples = []; settle = 0;
        if (median > 30) {
          if (!canvas.classList.contains('lite')) { canvas.classList.add('lite'); root.dataset.quality='lite'; }
          else { fx.still = true; finished = true; fx.world.setReduced(true); fx.particles?.setReduced(true); fx.scenes.forEach(scene=>scene.setReduced(true)); replayButton.disabled=true; root.dataset.quality='still'; return; }
        } else if (canvas.dataset.checked) { finished = true; return; }
        canvas.dataset.checked = '1';
      }
      probeId = requestAnimationFrame(probe);
    };
    const syncProbe = () => {
      if (probeId) cancelAnimationFrame(probeId);
      probeId=0; previous=0; samples=[];
      if (!finished && !fx.still && !reduce && !document.hidden) probeId=requestAnimationFrame(probe);
    };
    document.addEventListener('visibilitychange',syncProbe);
    addEventListener('portfolio:motion',syncProbe);
    syncProbe();
    if (!('IntersectionObserver' in window)) return;
    const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) fx.world.setMood(moods[entry.target.id]);
    }), { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(moods).forEach(id => { const section = document.getElementById(id); if (section) watcher.observe(section); });
  }).catch(() => {});
  if (!('IntersectionObserver' in window)) return;
  import('./fx/scenes.js').then(module => {
    const byCanvas = new Map();
    const watcher = new IntersectionObserver(entries => entries.forEach(entry => byCanvas.get(entry.target)?.setActive(entry.isIntersecting)), { threshold: .15 });
    $$('.scene').forEach(canvas => {
      const accent = getComputedStyle(canvas).getPropertyValue('--art-color').trim() || '#55c5ff';
      const scene = module.mountScene(canvas, canvas.dataset.scene, { reduced: reduce || fx.still, accent });
      byCanvas.set(canvas, scene); fx.scenes.push(scene);
      canvas.classList.add('ready');
      watcher.observe(canvas);
    });
  }).catch(() => {});
}
requestAnimationFrame(() => setTimeout(initFx, 120));

frame();
