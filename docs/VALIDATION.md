# Validation record — portfolio redesign

Date: 2026-11-10. Source baseline: 00c35de81c935821a53576a2f17830913d2cb94e.

## Executed locally

- Build completed using Node 24.16.0.
- Four Node test cases passed: scenario transitions, all local HTML resources/fragments, static content/claim guards, source-size budgets.
- Thirteen Chromium browser checks passed: desktop rendering, deep-link reload, three lab scenarios, persistent motion, OS motion preference, mobile without JavaScript, unavailable Canvas/blocked storage, mobile menu/Escape/anchors, 320–1024px overflow, keyboard controls, PDF export, social PNG generation and automated accessibility/resource checks.
- No page errors or failed local resources.
- axe-core 4.13.0: zero automated WCAG A/AA violations. SVG/gradient contrast nodes require visual/manual assessment; this is not a complete accessibility certification.
- Desktop hero, full mobile page, lab and social preview visually inspected.
- No production dependencies; source files served during the initial page load total approximately 55 KB uncompressed (excluding optional social image).
- npm install could not access the registry from this sandbox. Local browser tests used existing Playwright 1.63.0 and axe-core installations. The lockfile records their original registry URLs/integrities. A clean npm ci is a required CI gate.

## Latest performance sample

Local headless Chromium. Three samples per mode. Mobile emulation: 390×844, 4× CPU slowdown, 1.6 Mbps download and 150 ms network latency.

| Measurement | Desktop | Mobile emulation |
| --- | --- | --- |
| LCP, individual runs | 1676 / 332 / 348 ms | 2424 / 2164 / 2284 ms |
| CLS | 0.00117 | 0 |
| Largest sampled interaction event, each run | 104 / 40 / 40 ms | 152 / 120 / 104 ms |

These are lab measurements, not field INP or percentile-75 Core Web Vitals. Earlier mobile samples exceeded 2.5 seconds and 200 ms. Batching Canvas draw calls, limiting density/DPR, deferring Canvas startup and removing costly mobile filters improved the latest sample. Shared-machine variance still exists.

Animation drawing is capped at approximately 60 updates/s on desktop and 30 on compact mobile. requestAnimationFrame sample intervals from headless Chromium are preserved in the raw report but are NOT used to claim physical display frame rates.

## Artifacts

Generated locally in test-results/:
- hero.png, desktop.png, mobile.png, lab.png
- daniel-gonzalez-profile.pdf
- report.json, performance.json

Committed summary: validation-results.json. OG asset: assets/social-card.png (1200×630).

## Still requires external or author input

- Exact LinkedIn URL and current résumé.
- Author confirmation of employment history and individual contribution boundaries before adding detailed career claims.
- Physical-device Safari/iPhone and screen-reader review.
- Live traffic for field Core Web Vitals.
- Remote CI and public deployment verification, recorded separately once available.
