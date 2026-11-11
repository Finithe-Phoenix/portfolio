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
  root.style.setProperty('--world', (1 - .62 * clamp(y / (innerHeight * .9))).toFixed(3));
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
frame();

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

/* Hero: scattered points assemble into a sphere, then carry light along its edges.
   Local 2D canvas only. No tracking, network requests or WebGL dependency. */
function initNetwork() {
  const canvas = $('#network');
  let ctx;
  try { ctx = canvas.getContext('2d'); } catch {}
  if (!ctx) return;
  const art = $('.hero-art');
  let width = 0, height = 0, frame = 0, visible = true, last = 0, time = 0, born = root.classList.contains('intro-on') ? 1500 : 0;
  let pointer = { x: 0, y: 0 }, current = { x: 0, y: 0 }, cursor = null;
  const compact = matchMedia('(max-width:600px)').matches;
  const rows = compact ? 9 : 15, cols = compact ? 18 : 28;
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const points = Array.from({ length: rows * cols }, (_, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const phi = (row + .5) / rows * Math.PI, theta = col / cols * Math.PI * 2;
    return { x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta), row, col,
      chaosX: (random() - .5) * 3.4, chaosY: (random() - .5) * 3.4, delay: random() * 900 };
  });
  // Light pulses travel along rings (rows) and meridians (columns).
  const pulses = Array.from({ length: compact ? 5 : 9 }, (_, i) => ({ ring: i % 2 === 0, lane: Math.floor(random() * (i % 2 === 0 ? rows : cols)), at: random(), speed: .00009 + random() * .00012, red: i % 4 === 3 }));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function resize() {
    const box = art.getBoundingClientRect();
    width = box.width; height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.75);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * .375;
    const turn = (reduce ? .4 : time * .00011) + current.x * .2;
    const tilt = .28 + current.y * .14;
    const scrolled = reduce ? 0 : clamp(scrollY / (innerHeight * .9));
    const age = time - born;
    let formed = 1;
    const projected = points.map(p => {
      const wave = reduce ? 0 : Math.sin(time * .0006 + p.row * .55) * .035;
      let x = p.x * Math.cos(turn) + p.z * Math.sin(turn);
      let z = -p.x * Math.sin(turn) + p.z * Math.cos(turn);
      let y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
      z = p.y * Math.sin(tilt) + z * Math.cos(tilt);
      // As the reader moves on, the curved network settles into a structured lattice.
      const gridX = (p.col / (cols - 1) - .5) * 1.8, gridY = (p.row / (rows - 1) - .5) * 1.8;
      x = x * (1 - scrolled * .65) + gridX * scrolled * .65;
      y = y * (1 - scrolled * .65) + gridY * scrolled * .65;
      const perspective = 2.8 / (2.8 - z * .45) * (1 + wave);
      x *= perspective; y *= perspective;
      // Chaos resolves into structure once, on arrival (or again on click).
      const order = reduce ? 1 : ease(clamp((age - p.delay) / 1900));
      if (order < formed) formed = order;
      x = p.chaosX + (x - p.chaosX) * order; y = p.chaosY + (y - p.chaosY) * order;
      let px = width / 2 + x * radius, py = height / 2 + y * radius;
      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, distance = Math.hypot(dx, dy);
        if (distance < 110 && distance > .01) { const push = Math.pow(1 - distance / 110, 2) * 22; px += dx / distance * push; py += dy / distance * push; }
      }
      return { x: px, y: py, z };
    });
    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius * 1.2);
    glow.addColorStop(0, 'rgba(22,139,255,.1)'); glow.addColorStop(1, 'rgba(22,139,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = .55;
    // Batch paths by depth: eight draw calls instead of two per node.
    for (let depth = 0; depth < 4; depth++) {
      const members = [];
      projected.forEach((p, i) => { if (Math.min(3, Math.floor((p.z + 1) * 2)) === depth) members.push(i); });
      if (formed > .02) {
        ctx.strokeStyle = 'rgba(55,169,255,' + ((.1 + depth * .065) * formed) + ')';
        ctx.beginPath();
        members.forEach(i => {
          const p = projected[i], next = projected[Math.floor(i / cols) * cols + (i + 1) % cols], below = projected[i + cols];
          ctx.moveTo(p.x, p.y); ctx.lineTo(next.x, next.y);
          if (below) { ctx.moveTo(p.x, p.y); ctx.lineTo(below.x, below.y); }
        });
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(85,197,255,' + (.25 + depth * .18) + ')';
      ctx.beginPath();
      members.forEach(i => { const p = projected[i], r = depth > 2 ? 1.65 : .9; ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); });
      ctx.fill();
    }
    if (formed > .98 && !reduce) {
      for (const pulse of pulses) {
        const count = pulse.ring ? cols : rows - 1;
        for (let tail = 0; tail < 6; tail++) {
          const at = ((pulse.at - tail * .012) % 1 + 1) % 1 * count;
          const a = Math.floor(at), mix = at - a;
          const from = pulse.ring ? projected[pulse.lane * cols + a % cols] : projected[a * cols + pulse.lane];
          const to = pulse.ring ? projected[pulse.lane * cols + (a + 1) % cols] : projected[Math.min(rows - 1, a + 1) * cols + pulse.lane];
          const depthFade = .35 + (from.z + 1) * .32;
          ctx.fillStyle = (pulse.red ? 'rgba(255,83,101,' : 'rgba(190,235,255,') + ((1 - tail / 6) * depthFade) + ')';
          ctx.beginPath(); ctx.arc(from.x + (to.x - from.x) * mix, from.y + (to.y - from.y) * mix, tail ? 1.6 : 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // Orbital arc gives the network depth without expensive blur filters.
    ctx.save(); ctx.globalAlpha = formed; ctx.translate(width / 2, height / 2); ctx.rotate(-.65 + current.x * .1);
    ctx.strokeStyle = 'rgba(255,65,87,.4)'; ctx.lineWidth = .75;
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.21, radius * .4, 0, 0, Math.PI * 2); ctx.stroke();
    const orbit = reduce ? 1.7 : time * .0003;
    ctx.fillStyle = '#ff5365'; ctx.beginPath(); ctx.arc(Math.cos(orbit) * radius * 1.21, Math.sin(orbit) * radius * .4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduce) return;
    if (last && now - last < (compact ? 32 : 15)) { frame = requestAnimationFrame(tick); return; }
    const elapsed = Math.min(now - (last || now), 50); last = now; time += elapsed;
    for (const pulse of pulses) pulse.at = (pulse.at + pulse.speed * elapsed) % 1;
    current.x += (pointer.x - current.x) * .04; current.y += (pointer.y - current.y) * .04;
    draw(); frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
    if (reduce) { current = { x: 0, y: 0 }; cursor = null; draw(); }
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  art.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reduce) return;
    const rect = art.getBoundingClientRect();
    cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointer = { x: cursor.x / rect.width - .5, y: cursor.y / rect.height - .5 };
  }, { passive: true });
  art.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; cursor = null; });
  art.addEventListener('click', () => { if (!reduce) born = time; });
  addEventListener('portfolio:motion', sync);
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(art);
  new ResizeObserver(resize).observe(art);
  resize(); art.classList.add('canvas-ready'); sync();
}
// Let the document paint before initializing the decorative canvas.
requestAnimationFrame(() => requestAnimationFrame(() => {
  if ('requestIdleCallback' in window) requestIdleCallback(initNetwork, { timeout: 600 });
  else setTimeout(initNetwork, 60);
}));

/* Cinematic layer: a WebGL world behind the page and a motion scene per project.
   Both load after first paint and the page is complete without them. */
const moods = { top: 'blue', impact: 'blue', experience: 'ice', ai: 'violet', work: 'blue', lab: 'red', about: 'ice', contact: 'red' };
const fx = { world: null, scenes: [] };
addEventListener('portfolio:motion', () => {
  fx.world?.setReduced(reduce || fx.still);
  fx.scenes.forEach(scene => scene.setReduced(reduce));
});
function initFx() {
  const compact = matchMedia('(max-width:600px)').matches;
  import('./fx/world.js').then(module => {
    const canvas = $('#world');
    fx.world = module.mountWorld(canvas, { reduced: reduce, compact });
    if (!fx.world) return;
    root.classList.add('world-ready');
    // Quality governor: sample frame times; a slow device first drops to a quarter of the pixels,
    // then to a still frame. It only ever steps down.
    let samples = [], previous = 0, settle = 0;
    const probe = now => {
      if (fx.still) return;
      if (reduce || document.hidden) { previous = 0; samples = []; }
      else if (previous && ++settle > 45) samples.push(now - previous);
      previous = now;
      if (samples.length >= 40) {
        const median = samples.sort((a, b) => a - b)[20];
        samples = []; settle = 0;
        if (median > 30) {
          if (!canvas.classList.contains('lite')) canvas.classList.add('lite');
          else { fx.still = true; fx.world.setReduced(true); return; }
        } else if (canvas.dataset.checked) return;
        canvas.dataset.checked = '1';
      }
      requestAnimationFrame(probe);
    };
    requestAnimationFrame(probe);
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
      const scene = module.mountScene(canvas, canvas.dataset.scene, { reduced: reduce, accent });
      byCanvas.set(canvas, scene); fx.scenes.push(scene);
      canvas.classList.add('ready');
      watcher.observe(canvas);
    });
  }).catch(() => {});
}
requestAnimationFrame(() => setTimeout(initFx, 120));
