# Daniel González — Clarity through complexity

A static-first professional portfolio in English, Spanish and Portuguese: a procedural hero that resolves chaos into structure, career impact and timeline, an applied-AI pipeline, three evidence-linked case studies and an interactive resilience lab.

## Run

Node.js 22 or newer (CI uses Node 24).

    npm ci
    npm run check
    npm run preview

Open http://127.0.0.1:4175/portfolio/.

    npx playwright install chromium
    npm run test:e2e

The browser suite generates desktop/mobile screenshots, a printable profile PDF, an Open Graph image and an accessibility report in test-results/. npm run build produces dist/ without any production dependencies. The browser suite requires Playwright and axe-core only for development.

## Edit

The default experience is an eight-chapter story with a persistent selector and previous/next controls. Choose the full-reading option for the complete document. Project browsing uses native horizontal scrolling, touch gestures and explicit buttons. `journey.mjs` owns navigation/history; localized chapter narratives live in each locale's `journey` object. Mobile retains a capture of the original rendered scene before optional live effects. See docs/performance-comparison.json for measured limits.

- content/profile.json: identity, contact links and the list of locales.
- content/locales/en.json, es.json, pt.json: every visible string, the experience timeline, impact figures and project narratives. All three files must keep the same structure (enforced by a test).
- scripts/build.mjs: generates index.html and profile.html for each locale (/, /es/, /pt/) plus sitemap.xml.
- styles.css: one responsive visual system.
- script.js: navigation, motion preferences, scroll reveals, counters, pointer effects, the lab simulation and the procedural Canvas.
- fx/world.js: WebGL scene behind the whole page (grid, light trails, scroll warp). fx/scenes.js: one Canvas motion scene per project card. Both load after first paint; the page is complete without them, and a quality governor in script.js steps the world down on slow devices.
- lab.mjs: deterministic scenario behaviour and the repeatable latency trace, independently tested.
- assets/social-card.svg: original social composition; browser-check generates its PNG.
- docs/CONTENT_SOURCES.md: claim provenance and remaining author inputs.
- docs/VALIDATION.md: measured results and limits.
- docs/IMPLEMENTATION.md: architecture, design and acceptance map.

The HTML is generated and committed for direct static hosting. Run npm run build after editing content or templates. Do not edit index.html, profile.html, es/ or pt/ directly.

## Motion and resilience

Content and native details work without JavaScript. The optional Canvas initializes after first paint, caps device-pixel ratio, and stops when hidden or outside the viewport. The operating-system reduced-motion setting takes precedence over the persistent local toggle. Storage failures do not prevent use.

Scroll reveals are armed by script.js (html.anim), so nothing is hidden when JavaScript is unavailable or motion is reduced.

The lab is an educational state model. Its values are constants plus a repeatable jitter, not observed production metrics. The clinic case is explicitly a synthetic demo. Career figures come from the author's résumé; see docs/CONTENT_SOURCES.md. The phone number is deliberately not published (a test guards this).

## Delivery

GitHub Actions validates builds, internal links, scenario behavior, browser journeys and automated WCAG A/AA checks. Only successful main runs publish dist/ to the existing gh-pages branch. Pull requests and feature branches validate without publishing.

Live URL: https://finithe-phoenix.github.io/portfolio/

For rollback, revert the source change on main and let the same validation/publishing workflow run. Preserve the previously reviewed commit rather than resetting shared history.
