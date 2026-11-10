# Daniel González — Clarity through complexity

A static-first professional portfolio: editorial typography, a procedural network, three evidence-linked case studies and an interactive resilience model.

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

- content/profile.json: identity, project narratives, source links and optional LinkedIn/CV.
- scripts/build.mjs: generates index.html, profile.html and sitemap.xml.
- styles.css: one responsive visual system.
- script.js: navigation, motion preferences, native case-study links and procedural Canvas.
- lab.mjs: deterministic educational scenarios, independently tested.
- assets/social-card.svg: original social composition; browser-check generates its PNG.
- docs/CONTENT_SOURCES.md: claim provenance and remaining author inputs.
- docs/VALIDATION.md: measured results and limits.
- docs/IMPLEMENTATION.md: architecture, design and acceptance map.

The HTML is generated and committed for direct static hosting. Run npm run build after editing content or templates. Do not edit index.html directly.

## Motion and resilience

Content and native details work without JavaScript. The optional Canvas initializes after first paint, caps device-pixel ratio, and stops when hidden or outside the viewport. The operating-system reduced-motion setting takes precedence over the persistent local toggle. Storage failures do not prevent use.

The lab is an educational state model. Its values are constants, not observed production metrics. The clinic case is explicitly a synthetic demo. Project descriptions are based on linked public artifacts, not a claim that their complete test suites ran during the portfolio review.

## Delivery

GitHub Actions validates builds, internal links, scenario behavior, browser journeys and automated WCAG A/AA checks. Only successful main runs publish dist/ to the existing gh-pages branch. Pull requests and feature branches validate without publishing.

Live URL: https://finithe-phoenix.github.io/portfolio/

For rollback, revert the source change on main and let the same validation/publishing workflow run. Preserve the previously reviewed commit rather than resetting shared history.
