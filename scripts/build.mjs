// Generates the static site for every locale. Content lives in content/; never edit the HTML output.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const site = await readJson('content/profile.json');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const external = (href, label, cls = 'text-link') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label} ${arrow}</a>`;
// Headings are split into words for the kinetic reveal; aria-label keeps them one phrase for assistive tech.
let wordIndex = 0;
const words = text => text.split(' ').map(w => `<span class="w"><span style="--k:${wordIndex++}">${esc(w)}</span></span>`).join(' ');
const h2 = (id, t, extra = '') => { wordIndex = 0; return `<h2 id="${id}" class="kinetic" aria-label="${esc(t[0] + ' ' + t[1])}"><span aria-hidden="true">${words(t[0])}<br><em>${words(t[1])}</em>${extra}</span></h2>`; };
const sectionHead = (id, eyebrow, t, lead) => `<div class="section-heading reveal"><span class="ghost-num" aria-hidden="true">${esc(eyebrow.slice(0, 2))}</span><div><p class="eyebrow">${esc(eyebrow)}</p>${h2(id, t)}</div><p>${esc(lead)}</p></div>`;
const tags = list => `<div class="tags">${list.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;

function page(t, locale) {
  const base = locale.dir ? '../' : '';
  const url = site.siteUrl + locale.dir;
  const langLinks = site.locales.map(l => `<a href="${base + l.dir || './'}" lang="${l.code}" hreflang="${l.code}"${l.code === locale.code ? ' aria-current="true"' : ''}>${l.label}</a>`).join('');
  const alternates = site.locales.map(l => `<link rel="alternate" hreflang="${l.code}" href="${site.siteUrl + l.dir}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${site.siteUrl}">`;
  const nav = [['impact', t.ui.nav.impact], ['experience', t.ui.nav.experience], ['work', t.ui.nav.work], ['lab', t.ui.nav.lab], ['about', t.ui.nav.about]]
    .map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('') + `<a href="#contact" class="nav-contact">${esc(t.ui.nav.contact)} ${arrow}</a>`;
  let charIndex = 0;
  const chars = line => [...line].map(ch => `<span class="ch" style="--c:${charIndex++}">${esc(ch)}</span>`).join('');
  const title = t.hero.title.map((line, i, all) => i === all.length - 1 ? `<span class="line line-em" data-text="${esc(line)}"><span style="--i:${i}"><em>${esc(line)}</em></span></span>` : `<span class="line">${chars(line)}</span>`).join(' ');
  const manifesto = t.manifesto.text.split(' ').map(w => `<span>${esc(w)}</span>`).join(' ');
  const stats = t.stats.items.map((s, i) => `<li class="reveal" style="--i:${i}"><strong>${esc(s.prefix || '')}<span class="count" data-count="${s.value}">${s.value}</span>${esc(s.suffix || '')}</strong><span>${esc(s.label)}</span></li>`).join('');
  const marqueeItems = t.marquee.map(m => `<span>${esc(m)}</span><i>✳</i>`).join('');
  const timeline = t.experience.items.map((x, i) => `<li class="tl-item reveal${i < 2 ? ' is-current' : ''}"><div class="tl-when"><span class="tl-period">${esc(x.period)}</span><span class="tl-tag">${esc(x.tag)}</span></div><div class="tl-body"><h3>${esc(x.role)}</h3><p class="tl-company">${esc(x.company)}</p><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${tags(x.stack)}</div></li>`).join('');
  const stages = t.ai.stages.map((s, i) => `<li style="--i:${i}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s)}</li>`).join('');
  const facts = t.ai.facts.map((f, i) => `<article class="reveal" style="--i:${i}"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></article>`).join('');
  const cards = t.projects.map(p => {
    const internal = Boolean(p.problem);
    const href = internal ? '#case-' + p.id : (p.demo || p.repo);
    const label = internal ? `${esc(t.work.explore)} ${esc(p.name)}` : `${esc(p.name)} — ${esc(p.demo ? t.work.demo : t.work.source)}`;
    return `<article class="project-card art-${p.color}"><a class="project-open" href="${esc(href)}"${internal ? '' : ' target="_blank" rel="noopener noreferrer"'} data-cursor="${esc(t.work.cursorOpen)}"><div class="project-art" aria-hidden="true"><div class="art-grid"></div><span class="art-ghost">${p.number}</span><canvas class="scene" data-scene="${p.scene}"></canvas></div><div class="project-copy"><div class="project-meta"><span>${p.number} / ${esc(p.category)}</span><span class="project-status">${esc(p.status)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>${tags(p.stack)}<span class="read-case">${label} <span aria-hidden="true">${internal ? '→' : '↗'}</span></span></div></a></article>`;
  }).join('');
  const total = String(t.projects.length).padStart(2, '0');
  const cases = t.projects.filter(p => p.problem).map(p => `<details class="case-study" id="case-${p.id}"><summary><span class="case-index">${p.number}</span><span><small>${esc(p.category)}</small><strong>${esc(p.name)}</strong></span><span class="case-plus" aria-hidden="true">+</span></summary><div class="case-body"><p class="case-status">${esc(p.status)}</p><div class="case-grid">${['problem', 'approach', 'tradeoff', 'outcome', 'lesson'].map(k => `<section><h4>${esc(t.work.sections[k])}</h4><p>${esc(p[k])}</p></section>`).join('')}</div><div class="case-links">${external(p.repo, esc(t.work.source))}${p.demo ? external(p.demo, esc(t.work.demo)) : ''}</div><div class="evidence"><span>${esc(t.work.evidence)}</span>${p.evidence.map(e => external(e.url, esc(e.label))).join('')}</div></div></details>`).join('');
  const n = t.lab.nodes, sc = t.lab.scenarios.healthy;
  const flowNode = (cls, x, y, w, a, b) => `<g class="flow-node ${cls}"><rect x="${x}" y="${y}" width="${w}" height="74" rx="10"/><text x="${x + w / 2}" y="${y + 32}">${esc(a)}</text><text x="${x + w / 2}" y="${y + 53}" class="node-small">${esc(b)}</text></g>`;
  const flowRoutes = [['common', 'M130 185H240'], ['primary-route', 'M350 185C405 185 390 90 450 90'], ['fallback-route', 'M350 185C405 185 390 280 450 280'], ['primary-route', 'M560 90C625 90 580 185 650 185'], ['fallback-route', 'M560 280C625 280 580 185 650 185']]
    .map(([cls, d]) => `<path d="${d}" class="route ${cls}"/><path d="${d}" pathLength="100" class="pulse ${cls}"/>`).join('');
  const principles = t.about.principles.map((p, i) => `<article class="reveal" style="--i:${i}"><span>${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></article>`).join('');
  const credentials = t.about.credentials.map((c, i) => `<article class="reveal" style="--i:${i}"><span>${esc(c.label)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('');
  const clientData = JSON.stringify({ journey:t.journey, motionOn: t.ui.motionOn, motionReduced: t.ui.motionReduced, motionAriaOn: t.ui.motionAriaOn, motionAriaReduced: t.ui.motionAriaReduced, scenarios: t.lab.scenarios }).replace(/</g, '\\u003c');
  const resume = `<a class="text-link" href="profile.html">${esc(t.contact.resume)} ${arrow}</a>`;
  return `<!doctype html>
<html lang="${t.lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(t.meta.description)}">
<meta name="theme-color" content="#050811"><meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.ogDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.siteUrl}assets/social-card.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.meta.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">${alternates}
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}styles.css">
<title>${esc(t.meta.title)}</title>
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('dg-view')!=='all'){document.documentElement.classList.add('guided');let id=location.hash.slice(1);document.documentElement.dataset.chapter=id.startsWith('case-')?'work':(['top','impact','experience','ai','work','lab','about','contact'].includes(id)?id:'top')}}catch{document.documentElement.classList.add('guided');document.documentElement.dataset.chapter='top'}</script>
<script type="application/json" id="i18n">${clientData}</script><script src="${base}script.js" type="module"></script>
</head><body>
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>
<canvas id="world" aria-hidden="true"></canvas><canvas id="particles" aria-hidden="true"></canvas><div class="grain" aria-hidden="true"></div>
<div class="intro" aria-hidden="true"><i class="intro-shutter"></i><i class="intro-shutter"></i><div class="intro-core"><span class="intro-logo">dg<b>.</b></span><span class="intro-line"><i></i></span><span class="intro-name">${esc(site.name)}</span></div></div>
<div class="hud" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="hud-rec"><b></b>REC</span><span class="hud-time">00:00:00:00</span><span class="hud-scene">SCENE 01 / TOP</span></div>
<div class="cursor-glow" aria-hidden="true"></div><div class="cursor" aria-hidden="true"><i></i><span></span></div>
<header class="site-header"><a href="#top" class="brand" aria-label="${esc(t.ui.home)}">dg<span class="brand-dot">.</span></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="main-nav">${esc(t.ui.menu)} <span aria-hidden="true">☰</span></button>
<nav id="main-nav" aria-label="${esc(t.ui.navLabel)}">${nav}</nav>
<div class="lang-switch" role="group" aria-label="${esc(t.ui.langLabel)}">${langLinks}</div>
<button class="motion-toggle" aria-pressed="false" hidden aria-label="${esc(t.ui.motionAriaOn)}"><span aria-hidden="true">◐</span> <span class="motion-label">${esc(t.ui.motionOn)}</span></button>
<div class="scroll-progress" aria-hidden="true"></div></header>
<main id="main">
<section class="hero" id="top" aria-labelledby="hero-title"><div class="wrap hero-inner">
<p class="eyebrow hero-enter" style="--i:0"><span class="status-dot" aria-hidden="true"></span> ${esc(t.hero.eyebrow)}</p>
<h1 id="hero-title" aria-label="${esc(t.hero.title.join(' '))}"><span aria-hidden="true">${title}</span></h1>
<div class="hero-row"><p class="hero-intro hero-enter" style="--i:1">${esc(t.hero.intro)}</p>
<div class="hero-actions hero-enter" style="--i:2"><a class="button button-blue magnetic" href="#impact">${esc(t.hero.ctaPrimary)} <span aria-hidden="true">↘</span></a><a class="subtle-link" href="#lab">${esc(t.hero.ctaSecondary)} <span aria-hidden="true">→</span></a><button class="sculpture-replay" type="button">${esc(t.journey.effects)}</button></div></div>
<div class="hero-art" aria-hidden="true"><svg class="network-fallback" viewBox="0 0 600 600"><g fill="none" stroke="#55c5ff" stroke-width="1"><ellipse cx="300" cy="300" rx="215" ry="215"/><ellipse cx="300" cy="300" rx="215" ry="80" transform="rotate(-35 300 300)"/><ellipse cx="300" cy="300" rx="215" ry="80" transform="rotate(35 300 300)"/><path d="M85 300H515M300 85V515"/></g><circle cx="300" cy="300" r="52" fill="#55c5ff"/></svg></div>
<div class="hero-bottom"><span>${esc(t.hero.role)}</span><span>${esc(t.hero.location)} <span class="tiny-dot">·</span> ${esc(t.hero.locationNote)}</span><a href="#impact">${esc(t.ui.scroll)} ↓</a></div></div></section>
<section id="impact" class="stats" aria-label="${esc(t.stats.label)}"><div class="wrap"><ul>${stats}</ul><p class="stats-source">${esc(t.stats.source)}</p></div></section>
<div class="marquee" aria-hidden="true"><div class="marquee-track"><div>${marqueeItems}</div><div>${marqueeItems}</div></div><div class="marquee-track reverse"><div>${marqueeItems}</div><div>${marqueeItems}</div></div></div>
<section class="manifesto" aria-label="${esc(t.manifesto.label)}"><div class="wrap"><p class="eyebrow">${esc(t.manifesto.label)}</p><p class="manifesto-text">${manifesto}</p></div></section>
<section id="experience" class="experience-section wrap section-space" aria-labelledby="experience-title">
${sectionHead('experience-title', t.experience.eyebrow, t.experience.title, t.experience.lead)}
<ol class="timeline"><li class="tl-line" aria-hidden="true"><i></i></li>${timeline}</ol></section>
<section id="ai" class="ai-section section-space" aria-labelledby="ai-title"><div class="wrap">
${sectionHead('ai-title', t.ai.eyebrow, t.ai.title, t.ai.lead)}
<div class="pipeline reveal"><div class="pipeline-top"><span><i class="status-dot" aria-hidden="true"></i> ${esc(t.ai.pipelineLabel)}</span><span class="agents" aria-hidden="true">${'<i></i>'.repeat(19)}</span></div>
<div class="pipeline-flow"><span class="pipe-end">${esc(t.ai.input)}</span><ol class="stages" aria-label="${esc(t.ai.pipelineAlt)}">${stages}</ol><span class="pipe-end pipe-out">${esc(t.ai.output)}</span></div></div>
<div class="ai-facts">${facts}</div><p class="fine-print">${esc(t.ai.note)}</p></div></section>
<section id="work" class="work-section section-space" aria-labelledby="work-title"><div class="wrap">
${sectionHead('work-title', t.work.eyebrow, t.work.title, t.work.lead)}</div>
<div class="gallery"><div class="gallery-sticky"><div class="gallery-track" role="region" aria-label="${esc(t.work.galleryLabel)}" tabindex="0">${cards}</div>
<div class="gallery-bar wrap" aria-hidden="true"><span class="gallery-hint">${esc(t.work.hint)}</span><i class="gallery-line"><i></i></i><span class="gallery-count"><b>01</b> / ${total}</span></div></div></div>
<div class="wrap"><h3 class="deep-title reveal">${esc(t.work.deep)}</h3>
<div class="case-studies" role="region" aria-label="${esc(t.work.casesLabel)}">${cases}</div></div></section>
<section id="lab" class="thinking-section section-space" aria-labelledby="lab-title"><div class="wrap">
${sectionHead('lab-title', t.lab.eyebrow, t.lab.title, t.lab.lead)}
<div class="lab reveal"><div class="lab-top"><span><i class="status-dot" aria-hidden="true"></i> ${esc(t.lab.topLeft)}</span><span>${esc(t.lab.topRight)}</span></div>
<div class="lab-layout"><div class="lab-visual" data-state="healthy">
<svg viewBox="0 0 760 370" role="img" aria-labelledby="flow-title flow-desc"><title id="flow-title">${esc(t.lab.svgTitle)}</title><desc id="flow-desc">${esc(t.lab.svgDesc)}</desc>
<g class="flow-lines" fill="none">${flowRoutes}</g>
${flowNode('client-node', 20, 148, 110, n.client, n.clientSub)}${flowNode('router-node', 240, 148, 110, n.router, n.routerSub)}${flowNode('primary-node', 450, 53, 110, n.primary, n.primarySub)}${flowNode('standby-node', 450, 243, 110, n.standby, n.standbySub)}${flowNode('response-node', 650, 148, 100, n.response, n.responseSub)}</svg>
<ol class="mobile-flow" aria-label="${esc(t.lab.mobileLabel)}"><li><span>01</span>${esc(t.lab.mobile[0])}</li><li><span>02</span>${esc(t.lab.mobile[1])}</li><li class="mobile-service"><span>03</span><strong class="mobile-route">${esc(sc.mobile)}</strong></li><li><span>04</span>${esc(t.lab.mobile[2])}</li></ol><div class="lab-legend"><span><i class="legend-line"></i> ${esc(t.lab.legendActive)}</span><span><i class="legend-line dormant"></i> ${esc(t.lab.legendStandby)}</span></div></div>
<div class="lab-console"><p class="eyebrow">${esc(t.lab.consoleEyebrow)}</p>
<div class="scenario-buttons" hidden><button data-scenario="healthy" aria-pressed="true">01 <span>${esc(t.lab.buttons.healthy)}</span> ↗</button><button data-scenario="failed" aria-pressed="false">02 <span>${esc(t.lab.buttons.failed)}</span> ↗</button><button data-scenario="recovered" aria-pressed="false">03 <span>${esc(t.lab.buttons.recovered)}</span> ↗</button></div>
<noscript><p>${esc(t.lab.noscript)}</p></noscript>
<div class="lab-result" aria-live="polite" aria-atomic="true"><p class="lab-state">${esc(sc.title)}</p><p class="lab-description">${esc(sc.description)}</p><div class="lab-metrics"><span>${esc(t.lab.metricLatency)}<strong id="model-latency">40 ms</strong></span><span>${esc(t.lab.metricRoute)}<strong id="model-route">${esc(sc.route)}</strong></span></div></div>
<div class="lab-live" hidden><div class="lab-metrics"><span>${esc(t.lab.metricRouted)}<strong id="model-routed">0</strong></span><span>${esc(t.lab.metricRerouted)}<strong id="model-rerouted">0</strong></span></div><p class="spark-label" aria-hidden="true">${esc(t.lab.sparkLabel)}</p><svg class="spark" aria-hidden="true" viewBox="0 0 200 48" preserveAspectRatio="none"><polyline id="spark-line" fill="none" points="0,34 200,34"/></svg></div></div></div>
<div class="lab-foot"><span>${esc(t.lab.tradeoffLabel)}</span><p id="tradeoff">${esc(sc.tradeoff)}</p></div></div>
<p class="fine-print">${esc(t.lab.disclaimer)}</p></div></section>
<section id="about" class="about-section wrap section-space" aria-labelledby="about-title"><div class="about-intro section-heading reveal"><span class="ghost-num" aria-hidden="true">${esc(t.about.eyebrow.slice(0, 2))}</span><div><p class="eyebrow">${esc(t.about.eyebrow)}</p>${h2('about-title', t.about.title)}</div></div>
<div class="about-layout"><div class="about-statement reveal">${t.about.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<p class="about-small">${esc(t.about.focus)}</p>${resume}</div>
<div class="principles">${principles}</div></div>
<div class="credentials">${credentials}</div>
<div class="capabilities">${t.about.capabilities.map(c => `<span>${esc(c)}</span>`).join('')}</div></section>
<section id="contact" class="contact-section section-space" aria-labelledby="contact-title"><div class="aurora" aria-hidden="true"></div><div class="wrap"><p class="eyebrow">${esc(t.contact.eyebrow)}</p><div class="reveal">${h2('contact-title', t.contact.title, '<span class="contact-star">✳</span>')}</div><div class="contact-bottom"><p>${esc(t.contact.text)}</p><div class="contact-actions"><a class="button button-light magnetic" href="mailto:${esc(site.email)}">${esc(t.contact.email)} <span aria-hidden="true">→</span></a>${external(site.linkedin, esc(t.contact.linkedin))}${external(site.github, esc(t.contact.github))}${resume}</div></div></div></section>
</main><footer class="wrap"><a href="#top" class="brand" aria-label="${esc(t.ui.backTop)}">dg<span class="brand-dot">.</span></a><span>© <span id="year">2026</span> ${esc(site.name)}</span>${external(site.sourceUrl, esc(t.ui.viewSource), 'footer-link')}<a href="#top">${esc(t.ui.backTop)} ↑</a></footer>
</body></html>`;
}

function resumePage(t, locale) {
  const base = locale.dir ? '../' : '';
  const r = t.profile;
  const jobs = t.experience.items.map(x => `<article><h3>${esc(x.role)}</h3><p class="where">${esc(x.company)} · ${esc(x.period)}</p><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="stack">${esc(x.stack.join(' · '))}</p></article>`).join('');
  const projects = t.projects.map(p => `<article><h3>${esc(p.name)} <small>— ${esc(p.status)}</small></h3><p>${esc(p.summary)}</p><p class="stack">${esc(p.stack.join(' · '))}</p>${external(p.repo, esc(p.repo.replace('https://', '')))}</article>`).join('');
  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(t.meta.description)}"><title>${esc(r.title)}</title><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}profile.css"></head><body><header><a href="./">← ${esc(r.back)}</a><button id="print-profile" hidden>${esc(r.print)}</button></header><main id="resume"><p class="eyebrow">${esc(r.eyebrow)}</p><h1>${esc(site.fullName)}</h1><p class="role">${esc(r.role)}</p><p class="contact">${esc(site.location)} · <a href="mailto:${esc(site.email)}">${esc(site.email)}</a> · ${external(site.linkedin, 'LinkedIn')} · ${external(site.github, 'GitHub')}</p><p>${esc(r.summary)}</p><h2>${esc(r.experience)}</h2>${jobs}<h2>${esc(r.skills)}</h2><dl>${r.skillGroups.map(g => `<dt>${esc(g.label)}</dt><dd>${esc(g.text)}</dd>`).join('')}</dl><h2>${esc(r.credentials)}</h2><dl>${t.about.credentials.map(c => `<dt>${esc(c.title)}</dt><dd>${esc(c.text)}</dd>`).join('')}</dl><h2>${esc(r.projects)}</h2>${projects}</main><script src="${base}profile.js" defer></script></body></html>`;
}

const english = await readJson('content/locales/en.json');
const outputs = [];
for (const locale of site.locales) {
  // A locale without a translation file falls back to English so the build never breaks.
  const t = locale.code === 'en' ? english : await readJson(`content/locales/${locale.code}.json`).catch(() => english);
  if (locale.dir) await mkdir(new URL(locale.dir, root), { recursive: true });
  await writeFile(new URL(locale.dir + 'index.html', root), page(t, locale));
  await writeFile(new URL(locale.dir + 'profile.html', root), resumePage(t, locale));
  outputs.push(locale.dir + 'index.html', locale.dir + 'profile.html');
}
await writeFile(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${outputs.map(o => `<url><loc>${site.siteUrl}${o.replace(/index\.html$/, '')}</loc></url>`).join('')}</urlset>`);
await mkdir(new URL('dist/', root), { recursive: true });
for (const path of [...outputs, 'styles.css', 'script.js', 'journey.mjs', 'lab.mjs', 'fx', 'profile.css', 'profile.js', 'sitemap.xml', '.nojekyll', 'assets']) await cp(new URL(path, root), new URL('dist/' + path, root), { recursive: true });
await writeFile(new URL('dist/release.json', root), JSON.stringify({ revision: process.env.GITHUB_SHA || 'local', name: 'Daniel Gonzalez portfolio' }));
console.log(`Built ${outputs.length} pages for ${site.locales.length} locales → dist/`);
