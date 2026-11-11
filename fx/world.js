// A single-pass world. No textures, dependencies, or global state.
const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef HAS_DERIVATIVES
#extension GL_OES_standard_derivatives : enable
#endif
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPhase;
uniform float uTravel;
uniform float uScroll;
uniform float uBoost;
uniform float uCalm;
uniform float uPortal;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uSignal;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.11369));
  p = fract(p + dot(p, p.yx + 3.13));
  return fract((p.x + p.y) * p.x * 7.13);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}
float mist(vec2 p) {
  return noise(p) * 0.68 + noise(p * 2.03 + 7.1) * 0.32;
}
float line(float distanceToLine, float width, float pixel) {
  return 1.0 - smoothstep(width, width + pixel, distanceToLine);
}
// Piecewise linear noise makes angular peaks instead of rounded cloud shapes.
float ridge(float x, float seed) {
  float cell = floor(x);
  return mix(hash(vec2(cell, seed)), hash(vec2(cell + 1.0, seed)), fract(x));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float phase = uPhase * 0.130899694;
  float horizon = 0.035 + uPointer.y * 0.018 + uScroll * 0.025;
  float vx = uPointer.x * 0.052;
  float dy = p.y - horizon;
  float px = 1.0 / uResolution.y;
  float center = exp(-abs(p.x - vx) * 1.25);
  vec3 color = vec3(0.0196, 0.0314, 0.0667);
  vec3 hot = mix(uPrimary, vec3(1.0), 0.65);
  float pulse = 0.94 + 0.06 * sin(phase * 2.0);

  // Broad atmosphere stays very dark; energy lives on the horizon itself.
  float atmosphere = exp(-abs(dy) * 10.0);
  color += uSecondary * atmosphere * (0.045 + center * 0.08);
  // Analytic bloom: a small sun, a luminous rim and a long anamorphic flare.
  // No extra scene samples or render targets; the upper sky stays near black.
  vec2 sun = vec2(p.x - vx, dy - 0.026);
  float radius = length(sun);
  float rim = abs(radius - 0.081);
  float sunMask = smoothstep(-0.012, 0.012, dy);
  color += uSecondary * exp(-radius * 12.0) * 0.23 * pulse;
  color += uPrimary * exp(-radius * 28.0) * 0.25 * pulse;
  color += uPrimary * (exp(-rim * 115.0) * 0.24
           + line(rim, 0.00065, px) * 0.9) * sunMask * pulse;
  float disc = 1.0 - smoothstep(0.077, 0.081, radius);
  color += uPrimary * disc * exp(-max(dy, 0.0) * 22.0) * sunMask * 0.12;
  float flare = exp(-abs(p.x - vx) * 3.8);
  color += uPrimary * flare * exp(-abs(dy) * 105.0) * 0.48 * pulse;
  color += hot * flare * line(abs(dy), 0.00055, px) * 1.35 * pulse;
  color += uPrimary * exp(-abs(p.x - vx) * 1.6)
           * exp(-abs(dy) * 420.0) * 0.19;

  if (dy > 0.0) {
    vec2 sky = vec2((p.x - vx) * 1.25, dy);
    vec2 drift = vec2(sin(phase), cos(phase)) * 0.19;
    float cloud = mist(sky * vec2(3.2, 5.0) + drift + vec2(3.0, 7.0));
    float veil = smoothstep(0.34, 0.85, cloud);
    color += mix(uSecondary, uSignal, 0.12) * veil
           * exp(-dy * 3.8) * 0.055;

    // Two long, soft ribbons, like light scattered through cold atmosphere.
    float ribbon = dy - (0.105 + 0.048 * sin(sky.x * 2.4 + 0.7)
                   + (cloud - 0.5) * 0.065);
    float ribbon2 = dy - (0.19 + 0.065 * sin(sky.x * 1.7 - 1.4)
                    + (cloud - 0.5) * 0.045);
    color += uPrimary * exp(-abs(ribbon) * 65.0) * veil * 0.10;
    color += uSecondary * exp(-abs(ribbon2) * 48.0) * veil * 0.055;

    // Far-away signal shafts dissolve upward into the haze.
    float column = (p.x - vx) * 18.0;
    float columnSeed = hash(vec2(floor(column), 4.8));
    float shaftHeight = 0.045 + pow(columnSeed, 4.0) * 0.19;
    float shaft = (exp(-abs(fract(column) - 0.5) * 110.0)
                   + exp(-abs(fract(column) - 0.5) * 18.0) * 0.16)
                * (1.0 - smoothstep(0.0, shaftHeight, dy))
                * step(0.72, columnSeed)
                * pow(0.5 + 0.5 * sin(phase * 2.0 + columnSeed * 30.0), 6.0);
    color += mix(uPrimary, uSignal, step(0.91, columnSeed)) * shaft * 0.65;

    // Three faceted heightfields, back to front. A wide central valley frames
    // the portal; layer-specific camera offsets provide restrained parallax.
    // Restrict the work to the horizon strip, not the whole sky.
    if (dy < 0.24) {
      for (int i = 0; i < 3; i++) {
        float layer = float(i);
        float mx = p.x - vx * (0.3 + layer * 0.4)
                   + sin(phase) * (0.002 + layer * 0.003);
        float valley = smoothstep(0.12 + layer * 0.045, 0.46 + layer * 0.055, abs(mx));
        float sampleX = mx * (6.0 + layer * 1.7) + layer * 17.3;
        float terrain = ridge(sampleX, 2.7 + layer * 4.1) * 0.72
                      + ridge(sampleX * 2.0, 9.1 + layer * 3.7) * 0.28;
        float peak = (0.065 + terrain * (0.16 - layer * 0.025)) * valley;
        float base = 0.009 + layer * 0.005;
        float altitude = dy + base;
        float inside = (1.0 - smoothstep(peak - px, peak + px, altitude)) * valley;
        float edge = abs(altitude - peak);
        float brightness = 0.25 + layer * 0.12;
        color = mix(color, vec3(0.008, 0.012, 0.027) + uSecondary * 0.018, inside * 0.95);
        // Converging meridians and height contours form the retro wire mesh.
        float level = altitude / max(peak, 0.012);
        float meshX = mx * (25.0 + layer * 7.0) / (1.15 - level * 0.42);
        float meshY = level * 7.0;
        vec2 meshPixel;
#ifdef HAS_DERIVATIVES
        meshPixel = max(fwidth(vec2(meshX, meshY)), vec2(0.001));
#else
        meshPixel = vec2(55.0, 24.0 / max(peak, 0.012)) * px;
#endif
        vec2 meshDistance = abs(fract(vec2(meshX, meshY) + 0.5) - 0.5);
        vec2 mesh = (1.0 - smoothstep(vec2(0.018), vec2(0.018) + meshPixel, meshDistance))
                    * (1.0 - smoothstep(vec2(0.25), vec2(0.8), meshPixel));
        color += uSecondary * max(mesh.x, mesh.y) * inside * brightness * 0.46;
        color += uPrimary * (line(edge, 0.0005, px * 1.4) * brightness
                 + exp(-edge * 270.0) * 0.09) * valley;
      }
    }

    // Scattered light hangs in front of the ridges without filling the sky.
    color += uPrimary * exp(-dy * 48.0) * (0.035 + cloud * 0.065);

    // Sparse subpixel stars. Fixed cells avoid shimmering during camera flight.
    vec2 stars = (p + vec2(vx * 0.12, uPointer.y * 0.006)) * 85.0;
    vec2 cell = floor(stars);
    vec2 seed = vec2(hash(cell + 3.1), hash(cell + 17.7));
    vec2 delta = (fract(stars) - 0.15 - seed * 0.7) / 85.0;
    float chosen = step(0.962, hash(cell + 23.3));
    float radius = mix(0.00045, 0.00105, seed.x);
    float star = 1.0 - smoothstep(radius, radius + px, length(delta));
    float twinkle = 0.7 + 0.3 * sin(phase * (2.0 + floor(seed.y * 4.0)) + seed.x * 6.28);
    color += mix(uPrimary, vec3(0.75, 0.85, 1.0), seed.y) * star * chosen
           * twinkle * smoothstep(0.02, 0.12, dy) * 0.55;
    color += uPrimary * chosen * exp(-length(delta) * 950.0)
           * smoothstep(0.03, 0.14, dy) * 0.045;
  } else {
    float height = 0.78 + uScroll * 0.09;
    float depth = min(height / max(-dy, 0.008), 96.0);
    float stretch = 1.0 + uBoost * 0.65;
    float edgeWarp = (p.x - vx) * (1.0 + uBoost * dot(p, p) * 0.32);
    vec2 world = vec2(edgeWarp * depth * 1.45 + 0.55 + sin(phase) * 0.12,
                      depth * stretch + uTravel);
    vec2 footprint;
#ifdef HAS_DERIVATIVES
    footprint = max(fwidth(world), vec2(0.0005));
#else
    footprint = vec2(depth * 1.45, depth * depth * stretch / height) * px;
    footprint.x += abs(p.x - vx) * 1.45 * depth * depth * px / height;
#endif
    vec2 gridDistance = abs(mod(world + vec2(0.7, 1.0), vec2(1.4, 2.0)) - vec2(0.7, 1.0));
    vec2 grid = vec2(line(gridDistance.x, 0.009, footprint.x),
                     line(gridDistance.y, 0.012, footprint.y));
    // Fade unresolved lines before they alias into a bright solid surface.
    grid *= 1.0 - smoothstep(vec2(0.25), vec2(1.1), footprint);
    float fog = exp(-depth * 0.038);
    float nearFade = 0.48 + 0.52 * smoothstep(1.4, 8.0, depth);
    float gridLight = max(grid.x * 0.72, grid.y * 0.55);
    float bloomX = exp(-gridDistance.x / max(0.035, footprint.x * 1.5));
    float bloomZ = exp(-gridDistance.y / max(0.04, footprint.y * 1.2));
    float bloom = (bloomX + bloomZ) * 0.095
                * (1.0 - smoothstep(0.1, 0.8, footprint.y));
    color += uSecondary * (gridLight * 0.62 + bloom) * fog * nearFade;
    color += hot * grid.x * grid.y * fog * 0.24;

    // Each lane has its own speed, phase and signal colour. A bright nose pulls
    // a tapered, soft trail through the perspective projection.
    float lane = floor(world.x / 1.4 + 0.5);
    float seed = hash(vec2(mod(lane, 64.0), 9.7));
    float active = step(0.14, seed);
    float speed = 2.0 + floor(seed * 4.0);
    float race = mod(world.y - uPhase * speed + seed * 24.0, 24.0);
    float trailLength = (7.0 + seed * 6.0) * (1.0 + uBoost * 2.6);
    float tail = exp(-race / trailLength) * (1.0 - smoothstep(trailLength, trailLength * 2.0, race));
    // Let the glow spill just ahead of a head, including across the period
    // boundary, so nearby pulses do not have a hard rectangular bloom cutoff.
    float lead = exp(-(24.0 - race) * 6.0);
    tail = max(tail, lead);
    float nose = exp(-min(race, 24.0 - race) * 6.0);
    float thread = line(gridDistance.x, 0.014 + uBoost * 0.006, footprint.x);
    float halo = exp(-gridDistance.x / max(0.095, footprint.x * 2.0));
    float isSignal = step(0.77, hash(vec2(mod(lane, 64.0), 31.2)));
    vec3 cycleColor = mix(uPrimary, vec3(1.0, 0.075, 0.14), isSignal);
    float intensity = active * fog * smoothstep(0.008, 0.045, -dy)
                    * (1.0 - smoothstep(0.35, 1.4, footprint.x));
    intensity *= mix(1.0, 0.32, uCalm);
    color += cycleColor * (thread * tail * 1.45 + halo * tail * 0.27
                         + thread * nose * 1.3) * intensity;
    color += hot * thread * nose * intensity * 0.42;

    // Cross-track packets are shorter and rarer than the longitudinal cycles.
    float row = floor(world.y * 0.5 + 0.5);
    float rowSeed = hash(vec2(mod(row, 48.0), 5.2));
    float packet = abs(mod(world.x - uPhase * 2.0 + rowSeed * 32.0 + 16.0, 32.0) - 16.0);
    float crossTrail = exp(-packet * 0.85) * step(0.68, rowSeed);
    color += mix(uPrimary, uSignal, step(0.92, rowSeed)) * grid.y
           * crossTrail * fog * 1.05 * mix(1.0, 0.3, uCalm);

    // Slight coloured fringes during a boost, without a second scene sample.
    float split = uBoost * smoothstep(0.12, 0.8, abs(p.x - vx)) * depth * 0.007;
    vec2 splitDistance = abs(mod(world.xx + vec2(split, -split) + 0.7, 1.4) - 0.7);
    vec2 fringe = vec2(line(splitDistance.x, 0.012, footprint.x),
                       line(splitDistance.y, 0.012, footprint.x));
    color += (vec3(1.0, 0.08, 0.2) * fringe.x + vec3(0.1, 0.65, 1.0) * fringe.y)
           * tail * intensity * uBoost * 0.48;
    // Long lane-aligned exposures exaggerate speed, then follow the existing
    // smoothed boost back to stillness. No temporal buffers are needed.
    float exposure = max(exp(-race / 22.0), lead) * halo * active * fog;
    color += cycleColor * exposure * uBoost * 0.38;
    // A faint reflection of the atmospheric core connects floor and sky.
    color += uPrimary * exp(-abs(p.x - vx) * 12.0) * exp(dy * 12.0) * 0.09;
  }


  // Nested optical arcs, evaluated in the existing single render pass.
  vec2 gateway = vec2((p.x-vx)*1.02, dy-0.026);
  float gateRadius = length(gateway);
  float gateAngle = atan(gateway.y,gateway.x);
  float gateVisibility = smoothstep(-0.035,0.04,dy);
  for (int ring=0; ring<3; ring++) {
    float layer=float(ring);
    float distanceToGate=abs(gateRadius-(0.12+layer*0.057));
    float segment=smoothstep(-0.45,-0.25,sin(gateAngle*(3.0+layer)+phase*(0.9-layer*0.6)));
    float core=line(distanceToGate,0.00055,px);
    float halo=exp(-distanceToGate*240.0)*0.16;
    vec3 gateColor=mix(uPrimary,vec3(1.0,0.12,0.21),step(0.5,mod(layer,2.0)));
    color+=gateColor*(core*0.55+halo)*segment*gateVisibility*uPortal;
  }
  // Sparse, drifting motes use one hashed cell per pixel, with soft halos.
  // Periodic drift matches the phase wrap; reduced mode freezes it naturally.
  vec2 dust = p * 24.0 + vec2(sin(phase), cos(phase)) * 0.32;
  vec2 dustCell = floor(dust);
  float dustSeed = hash(dustCell + 51.7);
  vec2 dustDelta = (fract(dust) - vec2(0.2 + dustSeed * 0.6,
                    0.2 + hash(dustCell + 8.3) * 0.6)) / 24.0;
  dustDelta.y /= 1.0 + uBoost * 6.0;
  float dustRadius = length(dustDelta);
  float mote = line(dustRadius, 0.0004, px) + exp(-dustRadius * 600.0) * 0.16;
  color += hot * mote * step(0.976, dustSeed) * 0.23
           * (0.55 + 0.45 * sin(phase + dustSeed * 60.0));

  float vignette = 1.0 - smoothstep(0.22, 0.91, length((uv - 0.5) * vec2(0.92, 1.0)));
  color *= 0.57 + vignette * 0.43;
  color *= 0.987 + 0.013 * sin(gl_FragCoord.y * 1.5707963);
  // Grain is deliberately static: no full-screen temporal shimmer.
  color += (hash(mod(gl_FragCoord.xy, 256.0)) - 0.5) * 0.003;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const PALETTES = {
  blue: [0.333, 0.773, 1, 0.086, 0.545, 1, 1, 0.325, 0.396],
  red: [1, 0.16, 0.105, 0.78, 0.035, 0.075, 1, 0.48, 0.12],
  ice: [0.72, 0.88, 1, 0.16, 0.47, 0.92, 0.55, 0.78, 1],
  violet: [0.28, 0.65, 1, 0.07, 0.24, 0.62, 1, 0.16, 0.24],
};

/** Mount a self-sizing, opaque WebGL background; failures are intentionally quiet. */
export function mountWorld(canvas, options = {}) {
  let gl;
  try {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    const attributes = { alpha: false, antialias: false, depth: false, stencil: false };
    gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
  } catch { return null; }
  if (!gl) return null;

  const compact = Boolean(options && options.compact);
  let reduced = Boolean(options && options.reduced);
  let disposed = false;
  let lost = false;
  let resources = null;
  let observer = null;
  let frame = 0;
  let previousTime = 0;
  let staticDirty = true;
  let phase = 0;
  let flight = 0;
  let boost = 0;
  let impulse = 0;
  let lastScrollTime = 0;
  let scrollY = Math.max(0, window.scrollY || 0);
  let smoothScroll = scrollY;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let targetPortal = 0.65, portal = targetPortal;
  let targetPalette = PALETTES.blue;
  const palette = new Float32Array(targetPalette);
  const removers = [];

  function free(bundle) {
    if (!bundle) return;
    try {
      if (bundle.buffer) gl.deleteBuffer(bundle.buffer);
      if (bundle.program) gl.deleteProgram(bundle.program);
      for (const shader of bundle.shaders) gl.deleteShader(shader);
    } catch { /* Context teardown must remain safe. */ }
  }

  function build() {
    const bundle = { shaders: [], program: null, buffer: null, uniforms: {} };
    try {
      const derivatives = gl.getExtension('OES_standard_derivatives');
      for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX],
        [gl.FRAGMENT_SHADER, (derivatives ? '#define HAS_DERIVATIVES\n' : '') + FRAGMENT],
      ]) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error();
        bundle.shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error();
      }
      bundle.program = gl.createProgram();
      if (!bundle.program) throw new Error();
      for (const shader of bundle.shaders) gl.attachShader(bundle.program, shader);
      gl.linkProgram(bundle.program);
      if (!gl.getProgramParameter(bundle.program, gl.LINK_STATUS)) throw new Error();
      bundle.buffer = gl.createBuffer();
      if (!bundle.buffer) throw new Error();
      gl.bindBuffer(gl.ARRAY_BUFFER, bundle.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      bundle.position = gl.getAttribLocation(bundle.program, 'aPosition');
      if (bundle.position < 0) throw new Error();
      for (const name of ['uResolution', 'uPointer', 'uPhase', 'uTravel', 'uScroll', 'uBoost', 'uCalm', 'uPortal', 'uPrimary', 'uSecondary', 'uSignal']) {
        bundle.uniforms[name] = gl.getUniformLocation(bundle.program, name);
      }
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      resources = bundle;
      return true;
    } catch {
      free(bundle);
      return false;
    }
  }

  function size() {
    const ratio = Math.min(compact ? 1 : 1.5, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  function draw() {
    staticDirty = true;
    if (disposed || lost || !resources || document.hidden) return;
    const { program, buffer, position, uniforms: u } = resources;
    try {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform2f(u.uPointer, reduced ? 0 : smoothX, reduced ? 0 : smoothY);
      gl.uniform1f(u.uPhase, reduced ? 0 : phase);
      gl.uniform1f(u.uTravel, reduced ? 0 : (flight + smoothScroll * 0.012) % 96);
      gl.uniform1f(u.uScroll, reduced ? 0 : Math.tanh(smoothScroll / 2400));
      gl.uniform1f(u.uBoost, reduced ? 0 : boost);
      gl.uniform1f(u.uCalm, reduced ? 1 : 0);
      gl.uniform1f(u.uPortal, portal);
      gl.uniform3f(u.uPrimary, palette[0], palette[1], palette[2]);
      gl.uniform3f(u.uSecondary, palette[3], palette[4], palette[5]);
      gl.uniform3f(u.uSignal, palette[6], palette[7], palette[8]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      staticDirty = false;
    } catch { stop(); }
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function tick(now) {
    frame = 0;
    if (disposed || lost || reduced || document.hidden || !resources) return;
    // A little tolerance permits 30 fps on both 60 Hz and 120 Hz displays.
    if (compact && previousTime && now - previousTime < 32) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.075) : 1 / 60;
    previousTime = now;
    impulse *= Math.exp(-dt * 5.0);
    boost += (impulse - boost) * (1 - Math.exp(-dt * (impulse > boost ? 12 : 3.2)));
    const ease = 1 - Math.exp(-dt * 5.0);
    smoothScroll += (scrollY - smoothScroll) * ease;
    smoothX += (pointerX - smoothX) * ease;
    smoothY += (pointerY - smoothY) * ease;
    for (let i = 0; i < palette.length; i++) palette[i] += (targetPalette[i] - palette[i]) * ease;
    portal += (targetPortal-portal)*ease;
    phase = (phase + dt) % 48;
    flight = (flight + dt * (1.65 + boost * 15)) % 96;
    size(); // Also catches DPR changes when moving between monitors.
    draw();
    frame = window.requestAnimationFrame(tick);
  }

  function start() {
    if (!frame && !disposed && !lost && !reduced && !document.hidden && resources) {
      previousTime = 0;
      frame = window.requestAnimationFrame(tick);
    }
  }

  function onResize() {
    if (disposed || lost) return;
    if (size() && reduced) draw();
  }

  function onScroll() {
    const now = performance.now();
    const next = Math.max(0, window.scrollY || 0);
    if (!reduced && !document.hidden) {
      const elapsed = Math.max(16, Math.min(100, now - lastScrollTime));
      const velocity = Math.abs(next - scrollY) / elapsed;
      impulse = Math.min(1, Math.max(impulse, velocity * 0.16));
    }
    scrollY = next;
    lastScrollTime = now;
  }

  function onPointer(event) {
    if (compact || reduced || event.pointerType !== 'mouse') return;
    pointerX = Math.max(-1, Math.min(1, event.clientX / Math.max(1, window.innerWidth) * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, 1 - event.clientY / Math.max(1, window.innerHeight) * 2));
  }

  function resetPointer() { pointerX = 0; pointerY = 0; }

  function onVisibility() {
    stop();
    impulse = 0;
    boost = 0;
    scrollY = Math.max(0, window.scrollY || 0);
    smoothScroll = scrollY;
    if (!document.hidden) {
      const resized = size();
      if (reduced) {
        if (resized || staticDirty) draw();
      }
      else start();
    }
  }

  function onLost(event) {
    event.preventDefault();
    lost = true;
    stop();
    // Old WebGL handles are invalid after restore; no deletion is necessary.
    resources = null;
  }

  function onRestored() {
    if (disposed) return;
    lost = false;
    if (!build()) return;
    size();
    if (reduced) draw();
    else start();
  }

  function listen(target, name, handler, settings) {
    target.addEventListener(name, handler, settings);
    removers.push(() => target.removeEventListener(name, handler, settings));
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    stop();
    if (observer) observer.disconnect();
    for (const remove of removers) remove();
    free(resources);
    resources = null;
  }

  try {
    if (!build()) return null;
    size();
    listen(window, 'resize', onResize, { passive: true });
    listen(window, 'scroll', onScroll, { passive: true });
    if (!compact) {
      listen(window, 'pointermove', onPointer, { passive: true });
      listen(window, 'pointerout', event => { if (!event.relatedTarget) resetPointer(); }, { passive: true });
      listen(window, 'blur', resetPointer);
    }
    listen(document, 'visibilitychange', onVisibility);
    listen(canvas, 'webglcontextlost', onLost);
    listen(canvas, 'webglcontextrestored', onRestored);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize);
      observer.observe(canvas);
    }
    if (reduced) draw();
    else start();
  } catch {
    destroy();
    return null;
  }

  return {
    setReduced(value) {
      if (disposed || reduced === Boolean(value)) return;
      reduced = Boolean(value);
      stop();
      impulse = 0;
      boost = 0;
      if (reduced) {
        palette.set(targetPalette);
        size();
        draw();
      } else start();
    },
    setMood(name) {
      if (disposed || !Object.prototype.hasOwnProperty.call(PALETTES, name)) return;
      targetPortal = name === 'red' ? 1 : name === 'ice' ? 0.28 : 0.65;
      if (reduced) portal = targetPortal;
      const next = PALETTES[name];
      if (targetPalette === next) return;
      targetPalette = next;
      if (reduced) {
        palette.set(targetPalette);
        draw();
      }
    },
    destroy,
  };
}
