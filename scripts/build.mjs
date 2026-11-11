import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const profile = JSON.parse(await readFile(new URL('content/profile.json', root), 'utf8'));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = (href,label,cls='text-link') => '<a class="'+cls+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+label+' <span aria-hidden="true">↗</span></a>';
const diagram = p => '<div class="project-art art-'+p.color+'" aria-hidden="true"><div class="art-grid"></div><div class="art-orbit"></div><div class="art-core">'+(p.id==='prisma'?'&lt;/&gt;':p.id==='clinic'?'+':'◈')+'</div>'+p.diagram.map((s,i)=>'<span class="art-label label-'+i+'">'+esc(s)+'</span>').join('')+'<span class="art-caption">SYSTEM MAP / '+p.number+'</span></div>';
const cards = profile.projects.map(p => '<article class="project-card reveal"><a class="project-open" href="#case-'+p.id+'">'+diagram(p)+'<div class="project-copy"><div class="project-meta"><span>'+p.number+' / '+esc(p.category)+'</span><span aria-hidden="true">↗</span></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.summary)+'</p><div class="tags">'+p.stack.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div><span class="read-case">Explore '+esc(p.name)+' <span aria-hidden="true">→</span></span></div></a></article>').join('');
const cases = profile.projects.map(p => '<details class="case-study" id="case-'+p.id+'"><summary><span class="case-index">'+p.number+'</span><span><small>'+esc(p.category)+'</small><strong>'+esc(p.name)+'</strong></span><span class="case-plus" aria-hidden="true">+</span></summary><div class="case-body"><p class="case-status">'+esc(p.status)+'</p><div class="case-grid">'+[['The question',p.problem],['The approach',p.approach],['The tradeoff',p.tradeoff],['What exists',p.outcome],['The takeaway',p.lesson]].map(([t,s])=>'<section><h4>'+t+'</h4><p>'+esc(s)+'</p></section>').join('')+'</div><div class="case-links">'+external(p.repo,'Explore source')+(p.demo?external(p.demo,'Open synthetic demo'):'')+'</div><div class="evidence"><span>Explore the evidence</span>'+p.evidence.map(e=>external(e.url,esc(e.label))).join('')+'</div></div></details>').join('');
const contact=profile.linkedin?external(profile.linkedin,'Let’s connect','button button-light'):external(profile.github,'Find me on GitHub','button button-light');
const cv=profile.cv?'<a class="text-link" href="'+esc(profile.cv)+'">Download résumé ↓</a>':'<a class="text-link" href="profile.html">Printable profile ↗</a>';
const html=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Daniel González — Technical Lead and Full Stack Engineer. Explore systems engineering, product work and practical engineering leadership.">
<meta name="theme-color" content="#050811"><meta property="og:type" content="website">
<meta property="og:title" content="Daniel González — Clarity through complexity">
<meta property="og:description" content="Systems thinking. Product care. Engineering that connects the dots.">
<meta property="og:url" content="https://finithe-phoenix.github.io/portfolio/">
<meta property="og:image" content="https://finithe-phoenix.github.io/portfolio/assets/social-card.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Daniel González — Clarity through complexity. Technical Lead & Full Stack Engineer.">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://finithe-phoenix.github.io/portfolio/">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css">
<title>Daniel González — Clarity through complexity</title><script src="script.js" type="module"></script>
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a href="#top" class="brand" aria-label="Daniel González, home">dg<span class="brand-dot">.</span></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="main-nav" hidden>Menu <span aria-hidden="true">☰</span></button>
<nav id="main-nav" aria-label="Main navigation"><a href="#work">Selected work</a><a href="#thinking">How I think</a><a href="#about">About</a><a href="#contact" class="nav-contact">Let’s talk <span aria-hidden="true">↗</span></a></nav>
<button class="motion-toggle" aria-pressed="false" hidden aria-label="Reduce animations"><span aria-hidden="true">◐</span> <span class="motion-label">Motion on</span></button></header>
<main id="main">
<section class="hero wrap" id="top" aria-labelledby="hero-title"><div class="hero-copy">
<p class="eyebrow hero-enter"><span class="status-dot" aria-hidden="true"></span> DANIEL GONZÁLEZ / ENGINEER & BUILDER</p>
<h1 id="hero-title" class="hero-enter">Clarity<br>through<br><em>complexity.</em></h1>
<p class="hero-intro hero-enter">Systems thinking. Product care.<br>I connect the dots — and build what comes next.</p>
<div class="hero-actions hero-enter"><a class="button button-blue" href="#work">Explore my work <span aria-hidden="true">↘</span></a><a class="subtle-link" href="#thinking">Step inside a system <span aria-hidden="true">→</span></a></div></div>
<div class="hero-art" role="img" aria-label="An abstract network organizing into a connected system">
<div class="art-topline"><span>COMPLEXITY → CLARITY</span><span class="art-version">EXPLORATION / 001</span></div><canvas id="network" aria-hidden="true"></canvas>
<svg class="network-fallback" viewBox="0 0 600 600" aria-hidden="true"><g fill="none" stroke="#55c5ff" stroke-width="1"><ellipse cx="300" cy="300" rx="215" ry="215"/><ellipse cx="300" cy="300" rx="215" ry="80" transform="rotate(-35 300 300)"/><ellipse cx="300" cy="300" rx="215" ry="80" transform="rotate(35 300 300)"/><path d="M85 300H515M300 85V515"/></g><circle cx="300" cy="300" r="52" fill="#55c5ff"/></svg>
<div class="hero-art-label label-architecture">01 / ARCHITECTURE</div><div class="hero-art-label label-execution">02 / EXECUTION</div><div class="hero-art-label label-people">03 / PEOPLE</div>
<div class="art-bottomline"><span class="cross" aria-hidden="true">+</span><span>MAKE THE CONNECTIONS THAT MATTER.</span><span class="cross" aria-hidden="true">+</span></div></div>
<div class="hero-bottom"><span>TECHNICAL LEAD & FULL STACK ENGINEER</span><span>TOLUCA, MX <span class="tiny-dot">·</span> GLOBAL MINDSET</span><a href="#work">SCROLL TO DISCOVER ↓</a></div></section>
<div class="editorial-strip"><div class="wrap"><span>Built on curiosity.</span><span>Shaped by constraints.</span><span>Made to work.</span><span class="strip-mark" aria-hidden="true">✳</span></div></div>
<section id="work" class="work-section wrap section-space" aria-labelledby="work-title">
<div class="section-heading reveal"><div><p class="eyebrow">01 / SELECTED EXPLORATIONS</p><h2 id="work-title">Different challenges.<br><em>One engineering mindset.</em></h2></div><p>From instruction sets to everyday workflows.<br>A closer look at the work, the decisions<br>and the details behind them.</p></div>
<div class="projects">__CARDS__</div><p class="work-note">Public projects, with source and context. Each case makes its scope explicit.</p>
<div class="case-studies" role="region" aria-label="Project case studies">__CASES__</div></section>
<section id="thinking" class="thinking-section section-space" aria-labelledby="thinking-title"><div class="wrap">
<div class="section-heading reveal"><div><p class="eyebrow">02 / THINK IN SYSTEMS</p><h2 id="thinking-title">The interesting part?<br><em>What happens next.</em></h2></div><p>A system is more than its happy path.<br>Explore a small, deterministic model<br>of failure, fallback and recovery.</p></div>
<div class="lab reveal"><div class="lab-top"><span><i class="status-dot" aria-hidden="true"></i> RESILIENCE LAB</span><span>INTERACTIVE MODEL / SYNTHETIC DATA</span></div>
<div class="lab-layout"><div class="lab-visual" data-state="healthy">
<svg viewBox="0 0 760 370" role="img" aria-labelledby="flow-title flow-desc"><title id="flow-title">Request routing model</title><desc id="flow-desc">A client connects to a router, which uses the primary service or a standby service. Both lead to a response.</desc>
<g class="flow-lines" fill="none" stroke-width="2"><path d="M130 185H240" class="route common"/><path d="M350 185C405 185 390 90 450 90" class="route primary-route"/><path d="M350 185C405 185 390 280 450 280" class="route fallback-route"/><path d="M560 90C625 90 580 185 650 185" class="route primary-route"/><path d="M560 280C625 280 580 185 650 185" class="route fallback-route"/></g>
<g class="flow-node client-node"><rect x="20" y="148" width="110" height="74" rx="10"/><text x="75" y="180">CLIENT</text><text x="75" y="201" class="node-small">request</text></g>
<g class="flow-node router-node"><rect x="240" y="148" width="110" height="74" rx="10"/><text x="295" y="180">ROUTER</text><text x="295" y="201" class="node-small">health-aware</text></g>
<g class="flow-node primary-node"><rect x="450" y="53" width="110" height="74" rx="10"/><text x="505" y="85">PRIMARY</text><text x="505" y="106" class="node-small">region A</text></g>
<g class="flow-node standby-node"><rect x="450" y="243" width="110" height="74" rx="10"/><text x="505" y="275">STANDBY</text><text x="505" y="296" class="node-small">region B</text></g>
<g class="flow-node response-node"><rect x="650" y="148" width="100" height="74" rx="10"/><text x="700" y="180">RESPONSE</text><text x="700" y="201" class="node-small">model output</text></g></svg>
<ol class="mobile-flow" aria-label="Active request route"><li><span>01</span>Client request</li><li><span>02</span>Health-aware router</li><li class="mobile-service"><span>03</span><strong class="mobile-route">Primary service</strong></li><li><span>04</span>Response</li></ol><div class="lab-legend"><span><i class="legend-line"></i> Active route</span><span><i class="legend-line dormant"></i> Standby route</span></div></div>
<div class="lab-console"><p class="eyebrow">CHANGE THE CONDITIONS</p>
<div class="scenario-buttons" hidden><button data-scenario="healthy" aria-pressed="true">01 <span>Normal operation</span> ↗</button><button data-scenario="failed" aria-pressed="false">02 <span>Primary unavailable</span> ↗</button><button data-scenario="recovered" aria-pressed="false">03 <span>Controlled recovery</span> ↗</button></div>
<noscript><p>The diagram shows normal operation. JavaScript enables the optional failure and recovery scenarios.</p></noscript>
<div class="lab-result" aria-live="polite" aria-atomic="true"><p class="lab-state">Primary route active</p><p class="lab-description">The router sends requests to the primary service. The standby remains available for a failover.</p><div class="lab-metrics"><span>MODEL LATENCY<strong id="model-latency">40 ms</strong></span><span>ROUTING STATE<strong id="model-route">Primary</strong></span></div></div></div></div>
<div class="lab-foot"><span>THE TRADEOFF</span><p id="tradeoff">Redundancy creates recovery options, with the cost of maintaining an additional service.</p></div></div>
<p class="lab-disclaimer">Illustrative simulation. Latencies are fixed scenario values, not measurements from a live service. Real failover also requires data consistency, capacity and health-check policies.</p></div></section>
<section id="about" class="about-section wrap section-space" aria-labelledby="about-title"><div class="about-intro reveal"><p class="eyebrow">03 / THE PERSON BEHIND THE SYSTEM</p><h2 id="about-title">Deep in the details.<br><em>Connected to the whole.</em></h2></div>
<div class="about-layout"><div class="about-statement reveal"><p>I’m Daniel, a Technical Lead and Full Stack Engineer based in Toluca, México.</p><p>My work connects backend systems, product interfaces and engineering enablement. I’m drawn to the point where a difficult technical problem becomes something people can understand, use and trust.</p><p class="about-small">My professional focus includes Java and Spring, distributed systems, frontend engineering, cloud delivery and practical AI adoption.</p>__CV__</div>
<div class="principles"><article class="reveal"><span>01</span><div><h3>Start with the question.</h3><p>Understand the people, the constraints and the cost of getting it wrong.</p></div></article><article class="reveal"><span>02</span><div><h3>Make the tradeoffs visible.</h3><p>Good architecture gives a team a decision it can explain and a system it can operate.</p></div></article><article class="reveal"><span>03</span><div><h3>Leave a clearer path.</h3><p>Turn the work into useful code, documentation and practices others can build on.</p></div></article></div></div>
<div class="capabilities"><span>JAVA / SPRING</span><span>DISTRIBUTED SYSTEMS</span><span>ANGULAR / TYPESCRIPT</span><span>CLOUD / DEVOPS</span><span>AI ENABLEMENT</span></div></section>
<section id="contact" class="contact-section section-space"><div class="wrap"><p class="eyebrow">A GOOD CONVERSATION IS A GOOD START.</p><h2>What could we<br><em>build together?</em><span class="contact-star" aria-hidden="true">✳</span></h2><div class="contact-bottom"><p>Complex problems. Thoughtful teams.<br>I’d like to hear what you’re working on.</p><div class="contact-actions">__CONTACT____CV__</div></div></div></section>
</main><footer class="wrap"><a href="#top" class="brand" aria-label="Back to top">dg<span class="brand-dot">.</span></a><span>© <span id="year">2026</span> Daniel González</span><a href="https://github.com/Finithe-Phoenix/portfolio" target="_blank" rel="noopener noreferrer">Built with intent. View source ↗</a><a href="#top">BACK TO TOP ↑</a></footer>
</body></html>`.replace('__CARDS__',cards).replace('__CASES__',cases).replace('__CONTACT__',contact).replaceAll('__CV__',cv);
await writeFile(new URL('index.html',root),html);
const printable='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daniel González — Professional profile</title><link rel="stylesheet" href="profile.css"></head><body><header><a href="./">← Back to portfolio</a><button id="print-profile" hidden>Print / Save as PDF</button></header><main><p class="eyebrow">PROFESSIONAL PROFILE</p><h1>'+esc(profile.name)+'</h1><h2>'+esc(profile.role)+'</h2><p>'+esc(profile.location)+' · '+external(profile.github,'GitHub')+(profile.linkedin?' · '+external(profile.linkedin,'LinkedIn'):'')+'</p><p>'+esc(profile.intro)+'</p><h2>Selected public work</h2>'+profile.projects.map(p=>'<article><h3>'+esc(p.name)+' <small>— '+esc(p.status)+'</small></h3><p>'+esc(p.summary)+'</p><p>'+esc(p.outcome)+'</p><p>'+esc(p.stack.join(' · '))+'</p>'+external(p.repo,esc(p.repo))+'</article>').join('')+'<h2>Engineering focus</h2><p>Java & Spring · Distributed systems · Angular & TypeScript · Cloud delivery · Engineering enablement</p><p class="note">Selected-work profile. Project descriptions link to their public sources. Employment history and credentials are not represented here.</p></main><script src="profile.js" defer></script></body></html>';
await writeFile(new URL('profile.html',root),printable);
await writeFile(new URL('sitemap.xml',root),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://finithe-phoenix.github.io/portfolio/</loc></url><url><loc>https://finithe-phoenix.github.io/portfolio/profile.html</loc></url></urlset>');
await mkdir(new URL('dist/',root),{recursive:true});
for(const path of ['index.html','styles.css','script.js','lab.mjs','profile.html','profile.css','profile.js','sitemap.xml','.nojekyll','assets']) await cp(new URL(path,root),new URL('dist/'+path,root),{recursive:true});
console.log('Built static portfolio → dist/');

await writeFile(new URL('dist/release.json',root),JSON.stringify({revision:process.env.GITHUB_SHA||'local',name:'Daniel Gonzalez portfolio'}));
