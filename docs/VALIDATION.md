# Validation record — motion, career content and three locales

Date: 2026-11-10. Branch: feat/epic-motion-i18n.

## Executed locally

- Build completed using Node 24.16.0: six pages (index and résumé for en, es, pt).
- Eight Node test cases passed: scenario transitions, repeatable latency trace, identical locale structure, all local links/resources/fragments in every page, server-rendered content per language (including a guard that no phone number is published), motion safety rules in CSS, source-size budgets and the release manifest.
- Sixteen Chromium browser checks passed: scroll reveals and counters, desktop rendering, deep-link reload, three lab scenarios, simulated traffic, persistent motion preference (reveals shown and simulation paused when reduced), OS motion preference, mobile without JavaScript, unavailable Canvas/blocked storage, mobile menu/Escape/anchors, 320–1024px overflow, keyboard controls, Spanish and Portuguese rendering with a localized lab and language switching at 320–1440px, PDF export, social PNG generation, accessibility and resource checks.
- axe-core 4.13.0: zero automated WCAG A/AA violations on /, /es/, /pt/ and the résumé page. This is not a complete accessibility certification.
- Desktop and mobile screenshots of every section were visually inspected in English; the Spanish full page was inspected on desktop.
- An independent review pass (Codex, read-only) reported seven findings; six were applied. The seventh (observer margins resolving against viewport width) did not reproduce: the active navigation link updates correctly at 1440×900.

## Latest performance sample

Local headless Chromium, three samples per mode. Mobile emulation: 390×844, 4× CPU slowdown, 1.6 Mbps download, 150 ms latency, served uncompressed.

| Measurement | Desktop | Mobile emulation |
| --- | --- | --- |
| LCP, individual runs | 216 / 176 / 180 ms | 1836 / 3180 / 1764 ms |
| CLS | 0.002 or less | 0 |
| Largest sampled interaction event, each run | 32 / 32 / 32 ms | 128 / 80 / 56 ms |
| requestAnimationFrame interval, p95 | 16.8 ms | 67–83 ms under 4× CPU throttle |

These are lab measurements on a shared machine, not field data. Mobile LCP varied between runs and one of three exceeded the 2.5 s target; the local server does not compress, while GitHub Pages does. The phone layout skips the hero text entrance so copy paints immediately. Throttled mobile frame intervals are well below 60 fps; the canvas is capped at about 30 updates/s on compact screens.

## Still requires external or author input

- Author read-through of every career statement, and a native reader for pt.json.
- Physical-device Safari/iPhone and screen-reader review.
- Live traffic for field Core Web Vitals.
- Remote CI and public deployment verification.
