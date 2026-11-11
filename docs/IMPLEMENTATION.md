# Implementation and acceptance map

## Design

Concept: Clarity through complexity.
Midnight black, electric blue and signal red. Geometric sans-serif typography, illuminated edges and a procedural grid inspired by TRON Legacy. Three reading depths: hero overview, project summary, expandable evidence.

Scenes:
1. Procedural latitude/longitude network with orbital depth, pointer response and scroll-driven transition toward a lattice.
2. Deterministic resilience lab with visible active route, failure state and controlled recovery explanation.
3. Project-map interaction, section reveals and native expandable case narratives.

The hero title paints immediately. Effects enhance visible content; no loader or hidden-until-JavaScript copy. Mobile uses readable stacked routing cards instead of shrinking the desktop diagram.

## Architecture

No runtime packages or framework migration. Node built-ins generate static HTML from profile.json; build copies an explicit allowlist to dist. Tests/docs/development dependencies never enter the publish directory.

The source snapshot was recovered via the GitHub connector because direct Git HTTPS was unavailable in the local shell. The local baseline commit is a snapshot, not a clone of remote history. Remote changes must be based on the real upstream commit, checked again before publishing.

## Epic coverage

1. Positioning: completed against existing identity; author inputs tracked in CONTENT_SOURCES.
2. Evidence: three source-backed case studies with question, approach, tradeoff, state and takeaway.
3. Opening: original responsive scene with static SVG fallback.
4. Motion: three visual sequences, reduced motion and offscreen suspension.
5. Product demo: three deterministic states, keyboard controls, clear synthetic labeling.
6. Technical base: static generation, modular data/model, no production dependencies.
7. Quality: unit/static tests and Chromium browser suite; lab performance measured separately.
8. Delivery: printable profile, social PNG, canonical URL, sitemap and gated GitHub Pages workflow. Personal LinkedIn/CV await author inputs.

## Budgets and edge cases

Raw file budgets: HTML 40 KB, CSS 26 KB, UI JavaScript 14 KB, model 4 KB.
Target: LCP <=2.5s, CLS <=0.1; synthetic event-duration samples <=200ms. Field INP and percentile-75 Core Web Vitals need real traffic and are not asserted by local measurements.
Target rendering: about 60fps on the desktop reference; record measured frame durations rather than claiming all devices achieve that.

Reduced motion: OS preference always wins. Preference changes apply during the session. Storage-denied browsers continue without persistence.
No JavaScript: all editorial content, navigation, native details and profile remain accessible; lab remains an explained diagram.
Canvas unavailable: static SVG remains visible.
Deep links open their relevant case after reload. Native summaries retain keyboard interaction.
Mobile menu closes on Escape (restoring focus), link selection and outside click.

## Publishing and rollback

Source workflow validates main, feature branches and pull requests. Publication requires validation success and main ref. Uploads only dist to the established gh-pages branch.
Before remote edits: inspect main HEAD; build the commit on that HEAD and preserve unrelated files.
Rollback: revert the feature commit on main; same validation workflow republishes the previous content.
