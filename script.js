document.getElementById('year').textContent = new Date().getFullYear();

const progressBar = document.querySelector('.page-progress span');
const cursorGlow = document.querySelector('.cursor-glow');
const navigationLinks = [...document.querySelectorAll('.nav-links a')];
const pageSections = [...document.querySelectorAll('main section[id]')];

window.addEventListener('scroll', () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;

  let currentSection = '';
  pageSections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 180) currentSection = section.id;
  });
  navigationLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
  });
}, { passive: true });

window.addEventListener('pointermove', (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.target || 0);
    const suffix = element.dataset.suffix || '';
    const startedAt = performance.now();
    const duration = 1300;

    function animate(now) {
      const ratio = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (ratio < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.7 });

document.querySelectorAll('.counter').forEach((counter) => counterObserver.observe(counter));

const finePointer = window.matchMedia('(pointer:fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (finePointer && !reducedMotion) {
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });
    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });
}