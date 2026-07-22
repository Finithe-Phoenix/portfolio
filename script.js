document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer:fine)').matches;
const loader = document.querySelector('.loader');
const progressBar = document.querySelector('.page-progress span');
const navWrap = document.querySelector('.nav-wrap');
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = [...document.querySelectorAll('main section[id]')];

window.addEventListener('load', () => {
  window.setTimeout(() => loader?.classList.add('done'), reducedMotion ? 0 : 1150);
});

function updateScrollState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
  navWrap.classList.toggle('scrolled', window.scrollY > 30);

  let current = '';
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 220) current = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}
window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.target || 0);
    const suffix = element.dataset.suffix || '';
    const start = performance.now();
    const duration = 1450;
    const tick = (now) => {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 4);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (ratio < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.65 });
document.querySelectorAll('.counter').forEach((counter) => counterObserver.observe(counter));

if (finePointer && !reducedMotion) {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mouseX = innerWidth / 2, mouseY = innerHeight / 2, ringX = mouseX, ringY = mouseY;

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX; mouseY = event.clientY;
    dot.style.left = `${mouseX}px`; dot.style.top = `${mouseY}px`;
  }, { passive: true });

  const animateCursor = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();

  document.querySelectorAll('a, .tilt-card').forEach((element) => {
    element.addEventListener('pointerenter', () => { ring.style.width = '54px'; ring.style.height = '54px'; });
    element.addEventListener('pointerleave', () => { ring.style.width = '34px'; ring.style.height = '34px'; });
  });

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1100px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-5px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * .09}px, ${y * .09}px)`;
    });
    element.addEventListener('pointerleave', () => element.style.transform = '');
  });
}

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() {
  canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
  canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(Math.min(window.devicePixelRatio, 2), 0, 0, Math.min(window.devicePixelRatio, 2), 0, 0);
  const count = Math.min(65, Math.floor(window.innerWidth / 22));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - .5) * .16,
    vy: (Math.random() - .5) * .16,
    r: Math.random() * 1.2 + .3
  }));
}
function drawParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.fillStyle = 'rgba(184,255,90,.35)';
  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
    if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j]; const dx = p.x - q.x; const dy = p.y - q.y; const d = Math.hypot(dx, dy);
      if (d < 105) {
        ctx.strokeStyle = `rgba(105,231,255,${(1 - d / 105) * .08})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
    }
  });
  if (!reducedMotion) requestAnimationFrame(drawParticles);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });
if (!reducedMotion) drawParticles();