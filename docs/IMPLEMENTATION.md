# Implementation and acceptance map

## Design

Concept: Clarity through complexity.
Midnight black, electric blue and signal red. Geometric sans-serif typography, illuminated edges and a procedural grid inspired by TRON Legacy. Three reading depths: hero overview, project summary, expandable evidence.

Scenes:
0. Optical gateways: three segmented red/blue arcs rendered analytically in the existing world pass. Eight keyboard-accessible chapter anchors follow the scene index; sculpture replay respects both user motion preference and the quality governor.
1. Hero: scattered points assemble into a latitude/longitude sphere, light pulses travel its rings and meridians, points yield to the pointer, and the sphere settles toward a lattice on scroll. Clicking replays the assembly.
2. Impact counters, a technology marquee and a career timeline whose line fills with scroll.
3. Applied-AI pipeline: seven stages light in sequence beside nineteen agent indicators.
4. Project cards with pointer tilt, a following light and pulses travelling each system map; native expandable case narratives.
5. Resilience lab: packets flow along the active route, the primary can be taken down, and a simulated trace and counters respond.
6. Ambient pointer light, magnetic primary buttons, scroll progress, active navigation and cross-document view transitions between languages.

The hero title animates in within the first second and is never gated on JavaScript. Scroll reveals are armed by script.js through html.anim, so there is no hidden-until-JavaScript copy and no loader.

Locales: content/locales/{en,es,pt}.json share one structure. The build writes /, /es/ and /pt/ with hreflang alternates; client strings for the lab and motion toggle are embedded per page as JSON. Mobile uses readable stacked routing cards instead of shrinking the desktop diagram.

## Architecture

The default experience is now a guided, eight-chapter story with native anchors, a localized selector, previous/next controls, browser history and a full-reading option. `journey.mjs` enhances the same semantic document; content remains fully accessible without JavaScript. A small head initializer selects the first/deep-linked chapter before paint. The project gallery uses native horizontal scrolling and dedicated buttons instead of pinning vertical scroll.

Rendering work is demand-driven: project scenes mount only when visible; particle shapes retain the original point counts and shader but are generated/uploaded when their pair is needed. World dimensions belong to ResizeObserver rather than per-frame layout reads. Effect drawing is capped at the display target (60 desktop/30 compact), while scroll geometry is cached on structural resize. A static JPEG captured from the original procedural scene preserves the mobile visual before optional live rendering, without initializing a GPU context.

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
8. Delivery: printable résumé per locale, social PNG, canonical URL, hreflang, sitemap and gated GitHub Pages workflow.

## Budgets and edge cases

Raw file budgets: HTML 62 KB English / 64 KB Spanish and Portuguese, CSS 56 KB, UI JavaScript 28 KB, model 2 KB. The on-demand project theater has separate budgets of 12 KB JavaScript and 9 KB CSS; neither is fetched on the initial journey.
Target: LCP <=2.5s, CLS <=0.1; synthetic event-duration samples <=200ms. Field INP and percentile-75 Core Web Vitals need real traffic and are not asserted by local measurements.
Target rendering: about 60fps on the desktop reference; record measured frame durations rather than claiming all devices achieve that.

Reduced motion: OS preference always wins. Preference changes apply during the session. Storage-denied browsers continue without persistence.
The quality governor now pauses its sampling loop when the page is hidden or motion is reduced, and freezes all three effect layers if low resolution is still too slow. Native wheel navigation is preserved; the previous wheel interception has been removed.
On compact screens, the static scene renders first. A localized control enables the cinematic engine explicitly; desktop starts it after the first paint. This avoids compiling multiple graphics contexts during the initial mobile load.
No JavaScript: all editorial content, navigation, native details and profile remain accessible; lab remains an explained diagram.
Canvas unavailable: static SVG remains visible.
Deep links open their relevant case after reload. Native summaries retain keyboard interaction.
Eight `project.story` records provide four localized scenes each. They are rendered as native details and enhanced on demand by a modal theater. Project links are stable fragments; scene selection does not add history entries. A native dialog contains focus; Escape closes and restores the trigger after history traversal. A single active 2D project canvas replaces the background motion while the theater is open. Scene changes select a phase of the existing diagram, with transform/opacity transitions. Autoplay is opt-in and pauses on manual input, visibility loss, close or reduced motion. On the no-JavaScript mobile path the expanded navigation scrolls with the document, and fragment navigation is immediate so it cannot cover or delay the story summary.
Mobile menu closes on Escape (restoring focus), link selection and outside click.

## Publishing and rollback

Source workflow validates main, feature branches and pull requests. Publication requires validation success and main ref. Uploads only dist to the established gh-pages branch.
Before remote edits: inspect main HEAD; build the commit on that HEAD and preserve unrelated files.
Rollback: revert the feature commit on main; same validation workflow republishes the previous content.
