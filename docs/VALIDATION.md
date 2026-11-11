# Validation record — motion, career content and three locales

Date: 2026-11-10. Branch: feat/epic-motion-i18n.

## Project cinema continuation — feat/project-cinema

Eight project narratives now have four authored scenes each in EN/ES/PT. The viewer uses the existing eight distinct Canvas diagrams with selected timeline phases, optical framing and transform/opacity transitions. Source and demo links remain available throughout. Career claims and measured project outcomes were not expanded; provenance is in CONTENT_SOURCES.md.

Local verification: ten Node/static cases, eighteen existing browser checks, eight chapter/navigation checks, and eight theater checks passed. Theater coverage includes all 32 scenes in all six locale/viewport combinations (390/1440 px), keyboard tabs/Home/End, rapid scene changes, manual/optional playback with a clock-advanced automatic step, focus restoration, Back/Forward, reload, source links and full cases. The final paths also cover 320/360/430 px dialog overflow and native story details without JavaScript. axe reports no automated WCAG A/AA violations for each open theater. Screenshots in test-results/cinema-*.png were inspected on mobile and desktop. Physical Safari/iPhone and screen readers remain outside this Chromium validation.

The viewer's 9.9 KB module and 7.2 KB stylesheet are requested only on opening a story; the browser suite asserts this. Existing HTML/CSS/entry-script budgets were retained. Mobile theater Canvas is capped at 30 updates/s and pauses offscreen or while hidden. Background world/particles/project loops and quality sampling pause during the theater. Reduced motion disables autoplay and moving transitions. This is bounded implementation/functional evidence, not a fresh field Core Web Vitals or physical-device FPS measurement.

The no-JavaScript mobile header now scrolls with the document, and native fragments navigate immediately, preventing covered summaries and conflicting long smooth scrolls. The full-page screenshot walk waits for two actual animation frames per scroll step before testing reveal completeness; the original completeness assertion remains in place with better diagnostics. Publication remains gated by the complete suite, followed by verification of the exact release revision and all public resources, including the two lazy theater files.

## Executed locally

- Continuation from `e9381a4`: ten Node cases pass. Browser coverage now includes chapter navigation by keyboard and the disabled sculpture replay under reduced motion. Optical portals use the existing WebGL pass; palette variants stay within blue/red. The quality governor suspends sampling while hidden/reduced and applies its still-frame fallback to world, sculpture and project scenes together. Physical GPU/device performance remains unverified.

- Build completed using Node 24.16.0: six pages (index and résumé for en, es, pt).
- Second pass (cinematic layer): ten Node test cases and the same sixteen browser checks pass with the WebGL world, eight project scenes, intro, pinned gallery and manifesto in place. New guards: only allowlisted public repositories are linked, and dist/fx holds only the two effect modules.
- Eight Node test cases passed (first pass): scenario transitions, repeatable latency trace, identical locale structure, all local links/resources/fragments in every page, server-rendered content per language (including a guard that no phone number is published), motion safety rules in CSS, source-size budgets and the release manifest.
- Sixteen Chromium browser checks passed: scroll reveals and counters, desktop rendering, deep-link reload, three lab scenarios, simulated traffic, persistent motion preference (reveals shown and simulation paused when reduced), OS motion preference, mobile without JavaScript, unavailable Canvas/blocked storage, mobile menu/Escape/anchors, 320–1024px overflow, keyboard controls, Spanish and Portuguese rendering with a localized lab and language switching at 320–1440px, PDF export, social PNG generation, accessibility and resource checks.
- axe-core 4.13.0: zero automated WCAG A/AA violations on /, /es/, /pt/ and the résumé page. This is not a complete accessibility certification.
- Desktop and mobile screenshots of every section were visually inspected in English; the Spanish full page was inspected on desktop.
- An independent review pass (Codex, read-only) reported seven findings; six were applied. The seventh (observer margins resolving against viewport width) did not reproduce: the active navigation link updates correctly at 1440×900.

## Latest performance sample

### Interactive story / PR 5

The new default chapter view, reading-mode fallback and native project carousel are covered in six locale/viewport journeys (EN/ES/PT × 390/1440 px), plus an axe audit of the guided mobile controls. These supplement the existing 18 browser checks and ten Node cases. Chapter tests include keyboard navigation, back/forward history, case-study reload, lab interaction, project scene mounting and 320–430 px reflow.
A further normal-motion mobile journey checks three rapid project-next taps and verifies the fourth card settles at the intended destination. Intermediate IntersectionObserver entries cannot overwrite an active programmatic destination; native touch, wheel and focus input release that target. Browser Back/Forward also restores the opening chapter when its URL has no fragment.

Same-machine comparison (three samples; uncompressed local server; 4× CPU/1.6 Mbps/150 ms mobile): desktop median LCP 720 → 396 ms; mobile median LCP 3088 → 2636 ms. Largest sampled mobile interaction, median: 392 → 160 ms. Initial-load CLS: 0 in all final samples. Mobile individual LCP values remain 2556–2808 ms, so the 2.5 s target is not claimed as consistently met. Full samples and methodology: performance-comparison.json. Initial metrics are captured before programmatic chapter navigation to avoid counting a later chapter as the initial LCP/CLS. These are not field INP or physical-device frame-rate guarantees.

Continuation sample after optical gateways and mobile opt-in (same local, uncompressed methodology): desktop LCP 1144 / 784 / 708 ms, CLS <=0.0021. Mobile LCP 3192 / 2724 / 3476 ms, CLS 0.0381, sampled interaction events 368–392 ms. These mobile samples still exceed the intended loading/interaction targets; they must not be represented as passing field Core Web Vitals. Compact devices now defer WebGL until explicit activation and skip the opening overlay and large text filters. Eighteen functional browser checks pass locally, including mobile activation and keyboard chapter navigation.

Local headless Chromium, three samples per mode. Mobile emulation: 390×844, 4× CPU slowdown, 1.6 Mbps download, 150 ms latency, served uncompressed.

| Measurement | Desktop | Mobile emulation |
| --- | --- | --- |
| LCP, individual runs | 216 / 176 / 180 ms | 1836 / 3180 / 1764 ms |
| CLS | 0.002 or less | 0 |
| Largest sampled interaction event, each run | 32 / 32 / 32 ms | 128 / 80 / 56 ms |
| requestAnimationFrame interval, p95 | 16.8 ms | 67–83 ms under 4× CPU throttle |

Cinematic layer, same method: desktop LCP 232–272 ms, CLS under 0.003; mobile emulation LCP 1488 / 2748 / 3052 ms, CLS under 0.002, interaction events 136–232 ms. Headless Chromium renders WebGL in software: the world ran at about 20 fps at full quality until the quality governor halved its resolution, after which frames returned to 16.7 ms. Performance on real GPUs and phones has not been measured.

These are lab measurements on a shared machine, not field data. Mobile LCP varied between runs and one of three exceeded the 2.5 s target; the local server does not compress, while GitHub Pages does. The phone layout skips the hero text entrance so copy paints immediately. Throttled mobile frame intervals are well below 60 fps; the canvas is capped at about 30 updates/s on compact screens.

## Still requires external or author input

- Author read-through of every career statement, and a native reader for pt.json.
- Physical-device Safari/iPhone and screen-reader review.
- Live traffic for field Core Web Vitals.
