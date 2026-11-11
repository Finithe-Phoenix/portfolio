/* A small, self-contained WebGL particle sculpture. All animation is GPU-side;
 * only uniforms change per frame. Coordinates use a radius of one world unit. */
const VERTEX = `
precision highp float;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec3 aSeed;
uniform vec2 uViewport;
uniform vec3 uAnchor;
uniform vec3 uPointer;
uniform vec2 uTilt;
uniform vec2 uWave;
uniform float uTime, uMorph, uEntrance, uDim, uDpr, uStill;
varying vec3 vColor;
varying float vLight;

// Analytic curl of a periodic vector potential: smooth, divergence-free flow.
vec3 curl(vec3 p, float t) {
  return vec3(-cos(p.z+t)-sin(p.y-t),
              -cos(p.x+t)-sin(p.z-t),
              -cos(p.y+t)-sin(p.x-t));
}
vec3 wave(vec3 p, float enabled) {
  float t = uTime * (1.0-uStill);
  p.z += enabled * (0.17*sin(p.x*4.2+t*0.8)
                  +0.12*cos(p.y*5.0-p.x*1.8+t*0.55));
  return p;
}
void main() {
  float delay = aSeed.x*0.19;
  float m = smoothstep(delay, 0.81+delay, uMorph);
  vec3 p = mix(wave(aFrom,uWave.x), wave(aTo,uWave.y), m);
  float storm = sin(3.14159265*uMorph);
  storm *= storm;
  vec3 flow = curl(p*2.9, uTime*0.36);
  p += storm*(flow*0.17 + curl(p*5.3, -uTime*0.21)*0.045);
  float spin = storm*(1.2+length(p.xy)*3.4+p.z*0.6);
  p.xy = mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*p.xy;

  float yaw = 0.18 + sin(uTime*0.13)*0.13*(1.0-uStill) + uTilt.x;
  float pitch = -0.13 + cos(uTime*0.11)*0.035*(1.0-uStill) + uTilt.y;
  p.xz = mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*p.xz;
  p.yz = mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch))*p.yz;
  p *= 1.0 + sin(uTime*0.9)*0.014*(1.0-uStill);

  float assemble = smoothstep(aSeed.x*0.25,0.72+aSeed.x*0.25,uEntrance);
  float minSide = min(uViewport.x,uViewport.y);
  vec2 aspect = vec2(minSide)/uViewport;
  float depth = 4.8/(4.8-p.z);
  vec2 settled = p.xy * depth * aspect * 0.76 * uAnchor.z + uAnchor.xy;
  vec2 scatter = vec2(aSeed.y*2.0-1.0,aSeed.z*2.0-1.0)*1.3;
  vec2 pos = mix(scatter,settled,assemble);
  pos += (1.0-assemble)*assemble*vec2(sin(aSeed.z*30.0+assemble*5.0),
                                                   cos(aSeed.y*30.0+assemble*5.0))*0.42;
  vec2 delta = (pos-uPointer.xy)/aspect;
  float distance = length(delta);
  float repel = exp(-distance*distance/0.026)*uPointer.z*0.12;
  pos += delta/max(distance,0.025)*repel*aspect;
  gl_Position = vec4(pos,clamp(-p.z*0.12,-0.9,0.9),1.0);
  float front = clamp((p.z+1.25)/2.5,0.0,1.0);
  float rare = step(0.986,aSeed.z);
  float jewel = step(0.955,aSeed.y);
  gl_PointSize = clamp((2.7+aSeed.x*1.45+jewel*2.0)*depth*uDpr
                       *sqrt(max(uAnchor.z,0.05)),1.0,9.0*uDpr);
  vec3 blue = mix(vec3(0.086,0.545,1.0),vec3(0.333,0.773,1.0),front);
  blue = mix(blue,vec3(0.584,0.867,1.0),jewel*0.72);
  vColor = mix(blue,vec3(1.0,0.325,0.396),rare);
  vLight = uDim*(0.26+front*0.76+jewel*0.20)*(0.32+assemble*0.68);
}`;

const FRAGMENT = `
precision mediump float;
varying vec3 vColor;
varying float vLight;
void main() {
  vec2 p = gl_PointCoord*2.0-1.0;
  float r = dot(p,p);
  if (r>1.0) discard;
  float glow = exp(-r*2.8)*(1.0-smoothstep(0.62,1.0,r));
  float alpha = glow*vLight;
  gl_FragColor = vec4(vColor*alpha,alpha);
}`;

function random(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const finite = (x) => typeof x === 'number' && Number.isFinite(x);

function textPoints(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 600;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const text = String(label ?? 'dg.').trim() || 'dg.';
  ctx.font = '900 400px Arial, Helvetica, sans-serif';
  const initial = ctx.measureText(text);
  const size = Math.min(440, 1080 / Math.max(initial.width, 1) * 400);
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || size * 0.75;
  const descent = metrics.actualBoundingBoxDescent || size * 0.2;
  ctx.fillText(text, 600, 300 + (ascent - descent) / 2);
  const pixels = ctx.getImageData(0, 0, 1200, 600).data;
  const points = [];
  let left = 1200, right = 0, top = 600, bottom = 0;
  for (let y = 0; y < 600; y += 2) {
    for (let x = 0; x < 1200; x += 2) {
      if (pixels[(y * 1200 + x) * 4 + 3] < 100) continue;
      points.push(x, y);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (!points.length) return null;
  const scale = 2.3 / Math.max(right - left, bottom - top, 1);
  for (let i = 0; i < points.length; i += 2) {
    points[i] = (points[i] - (left + right) / 2) * scale;
    points[i + 1] = ((top + bottom) / 2 - points[i + 1]) * scale;
  }
  return points;
}

function makeShape(spec, count, index) {
  const rand = random(0x514e + index * 997);
  const result = new Float32Array(count * 3);
  const type = spec.type;
  const glyph = type === 'text' ? textPoints(spec.text) : null;
  const nodes = [], edges = [];
  if (type === 'network') {
    // Deliberately irregular, spatially separated hubs, connected locally.
    for (let i = 0; i < 19; i++) {
      const y = 1 - 2 * (i + 0.5) / 19;
      const angle = i * 2.39996323;
      const radius = Math.sqrt(1 - y * y);
      nodes.push([Math.cos(angle) * radius, y * 0.92, Math.sin(angle) * radius * 0.72]);
    }
    const used = new Set();
    nodes.forEach((node, i) => {
      const nearest = nodes.map((p, j) => ({ j, d: p.reduce((s, v, k) => s + (v - node[k]) ** 2, 0) }))
        .filter((p) => p.j !== i).sort((a, b) => a.d - b.d).slice(0, 3);
      for (const { j } of nearest) {
        const key = `${Math.min(i, j)}:${Math.max(i, j)}`;
        if (!used.has(key)) { used.add(key); edges.push([node, nodes[j]]); }
      }
    });
  }
  for (let i = 0; i < count; i++) {
    let x, y, z;
    const t = rand(), angle = rand() * TAU;
    const fuzz = () => (rand() - 0.5);
    if (type === 'helix') {
      if (i % 4 !== 0) {
        y = t * 2.3 - 1.15;
        const a = t * TAU * 1.65 + (i % 2) * Math.PI;
        x = Math.cos(a) * 0.53 + fuzz() * 0.035;
        z = Math.sin(a) * 0.53 + fuzz() * 0.035;
        y += fuzz() * 0.022;
      } else {
        const rung = Math.floor(t * 29) / 28;
        const a = rung * TAU * 1.65, r = fuzz() * 1.06;
        x = Math.cos(a) * r; z = Math.sin(a) * r;
        y = rung * 2.3 - 1.15 + fuzz() * 0.018;
      }
    } else if (type === 'network') {
      if (i % 5 < 2) {
        const node = nodes[i % nodes.length];
        const r = Math.pow(rand(), 1.8) * 0.075;
        const v = rand() * 2 - 1, h = Math.sqrt(1 - v * v);
        x = node[0] + Math.cos(angle) * h * r;
        y = node[1] + v * r; z = node[2] + Math.sin(angle) * h * r;
      } else {
        const [a, b] = edges[i % edges.length];
        x = a[0] + (b[0] - a[0]) * t + fuzz() * 0.008;
        y = a[1] + (b[1] - a[1]) * t + fuzz() * 0.008;
        z = a[2] + (b[2] - a[2]) * t + fuzz() * 0.008;
      }
    } else if (type === 'grid') {
      const axis = i % 3;
      const a = Math.floor(rand() * 7) / 6 * 1.5 - 0.75;
      const b = Math.floor(rand() * 7) / 6 * 1.5 - 0.75;
      const along = t * 1.5 - 0.75;
      const p = axis === 0 ? [along, a, b] : axis === 1 ? [a, along, b] : [a, b, along];
      // Fixed isometric presentation preserves depth even in reduced motion.
      const xx = p[0] * 0.866 + p[2] * 0.5;
      const zz = -p[0] * 0.5 + p[2] * 0.866;
      x = xx * 0.86; y = (p[1] * 0.92 - zz * 0.392) * 0.86; z = (p[1] * 0.392 + zz * 0.92) * 0.86;
    } else if (type === 'wave') {
      // Fine rows retain the contour of the moving sheet.
      x = t * 2.35 - 1.175;
      const row = Math.floor(rand() * 92) / 91 * 2 - 1;
      y = row * 0.57 + Math.sin(x * 2.4 + row * 2.0) * 0.12;
      z = row * 0.56;
    } else if (type === 'rings') {
      if (i % 10 === 0) {
        const v = rand() * 2 - 1, r = Math.cbrt(t) * 0.23;
        x = Math.cos(angle) * Math.sqrt(1 - v * v) * r;
        y = v * r; z = Math.sin(angle) * Math.sqrt(1 - v * v) * r;
      } else {
        const ring = i % 3, a = t * TAU, radius = 0.94 + fuzz() * 0.025;
        const tilt = [0.28, 1.12, -0.95][ring], turn = [0, 1.05, -0.8][ring];
        const u = Math.cos(a) * radius, v = Math.sin(a) * radius;
        x = u * Math.cos(turn) - v * Math.cos(tilt) * Math.sin(turn);
        y = u * Math.sin(turn) + v * Math.cos(tilt) * Math.cos(turn);
        z = v * Math.sin(tilt);
      }
    } else if (type === 'text' && glyph) {
      const n = Math.floor(t * (glyph.length / 2)) * 2;
      x = glyph[n] + fuzz() * 0.004; y = glyph[n + 1] + fuzz() * 0.004; z = fuzz() * 0.075;
    } else {
      const core = i >= Math.floor(count * 0.91);
      const n = core ? i - Math.floor(count * 0.91) : i;
      const total = core ? count - Math.floor(count * 0.91) : Math.floor(count * 0.91);
      const v = 1 - 2 * (n + 0.5) / total, a = n * 2.39996323;
      const r = core ? Math.cbrt(t) * 0.48 : 1 + fuzz() * 0.012;
      x = Math.cos(a) * Math.sqrt(1 - v * v) * r;
      y = v * r; z = Math.sin(a) * Math.sqrt(1 - v * v) * r;
    }
    result.set([x, y, z], i * 3);
  }
  // Shuffle correspondence so transitions disperse instead of folding in bands.
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    for (let k = 0; k < 3; k++) {
      const a = i * 3 + k, b = j * 3 + k, value = result[a];
      result[a] = result[b]; result[b] = value;
    }
  }
  return result;
}

function spring(value) { return { value, target: value, velocity: 0 }; }
function advance(s, dt, frequency = 10) {
  const offset = s.value - s.target;
  const j = s.velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  s.value = s.target + (offset + j * dt) * decay;
  s.velocity = (s.velocity - frequency * j * dt) * decay;
  if (Math.abs(s.value - s.target) < 0.00001 && Math.abs(s.velocity) < 0.0001) {
    s.value = s.target; s.velocity = 0;
  }
}

/** Mount a transparent particle sculpture. Failure is intentionally silent. */
export function mountParticles(canvas, options = {}) {
  let cleanup = () => {};
  try {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    options = options || {};
    const gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false,
      stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power',
    });
    if (!gl) return null;
    const compact = !!options.compact, count = compact ? 6000 : 16000;
    let reduced = !!options.reduced, dead = false, lost = false;
    const specs = Array.isArray(options.shapes) && options.shapes.length
      ? options.shapes.map((s) => ({ type: s?.type || 'sphere', text: s?.text }))
      : [{ type: 'sphere' }];
    const positions = specs.map((s, i) => makeShape(s, count, i));
    const rand = random(0x23feda), seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rand();
    let program = null, buffers = [], shaders = [], attributes = {}, uniforms = {};
    let frame = 0, last = 0, time = 0, entrance = reduced ? 1 : 0;
    let width = 1, height = 1, dpr = 1, pair = -1;
    const shape = spring(0), ax = spring(0), ay = spring(0), scale = spring(1), dim = spring(1);
    const px = spring(0), py = spring(0), force = spring(0), tiltX = spring(0), tiltY = spring(0);
    const springs = [shape, ax, ay, scale, dim, px, py, force, tiltX, tiltY];
    let pointerAge = 10, observer = null;

    function release() {
      for (const buffer of buffers) gl.deleteBuffer(buffer);
      for (const shader of shaders) gl.deleteShader(shader);
      if (program) gl.deleteProgram(program);
      buffers = []; shaders = []; program = null;
    }
    function initialize() {
      function compile(type, source) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('shader');
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('compile');
        return shader;
      }
      program = gl.createProgram();
      if (!program) throw new Error('program');
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(program);
      for (const name of ['aFrom', 'aTo', 'aSeed']) attributes[name] = gl.getAttribLocation(program, name);
      for (const name of ['uViewport', 'uAnchor', 'uPointer', 'uTilt', 'uWave', 'uTime', 'uMorph', 'uEntrance', 'uDim', 'uDpr', 'uStill']) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      for (const data of [...positions, seeds]) {
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error('buffer');
        buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      }
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
      pair = -1;
    }
    function bind(name, buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(attributes[name]);
      gl.vertexAttribPointer(attributes[name], 3, gl.FLOAT, false, 0, 0);
    }
    function draw() {
      if (dead || lost || !program || document.hidden) return;
      gl.useProgram(program);
      const value = clamp(shape.value, 0, specs.length - 1), a = Math.floor(value);
      const b = Math.min(a + 1, specs.length - 1);
      if (pair !== a) {
        bind('aFrom', buffers[a]); bind('aTo', buffers[b]); bind('aSeed', buffers[specs.length]); pair = a;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.uViewport, width, height);
      gl.uniform3f(uniforms.uAnchor, ax.value, ay.value, scale.value);
      gl.uniform3f(uniforms.uPointer, px.value, py.value, reduced ? 0 : force.value);
      gl.uniform2f(uniforms.uTilt, reduced ? 0 : tiltX.value, reduced ? 0 : tiltY.value);
      gl.uniform2f(uniforms.uWave, specs[a].type === 'wave' ? 1 : 0, specs[b].type === 'wave' ? 1 : 0);
      gl.uniform1f(uniforms.uTime, reduced ? 0 : time);
      gl.uniform1f(uniforms.uMorph, value - a);
      gl.uniform1f(uniforms.uEntrance, reduced ? 1 : entrance);
      gl.uniform1f(uniforms.uDim, dim.value);
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uStill, reduced ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    function resize() {
      if (dead) return;
      width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight);
      dpr = Math.min(compact ? 1 : 1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      draw();
    }
    function tick(now) {
      frame = 0;
      if (dead || lost || reduced || document.hidden) { last = 0; return; }
      const elapsed = last ? (now - last) / 1000 : 1 / 60;
      if (compact && last && elapsed < 1 / 30 - 0.001) { frame = requestAnimationFrame(tick); return; }
      last = now;
      const dt = Math.min(elapsed, 0.05);
      time += dt; entrance = Math.min(1, entrance + dt / 2.2); pointerAge += dt;
      if (pointerAge > 0.16) force.target = 0;
      for (const s of springs) advance(s, dt);
      if (dpr !== Math.min(compact ? 1 : 1.5, window.devicePixelRatio || 1)) resize();
      draw(); frame = requestAnimationFrame(tick);
    }
    function start() {
      if (!frame && !dead && !lost && !reduced && !document.hidden) frame = requestAnimationFrame(tick);
    }
    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; }
    function settle() { for (const s of springs) { s.value = s.target; s.velocity = 0; } }
    function changed() { if (dead) return; if (reduced) { settle(); draw(); } else start(); }
    function pointer(event) {
      if (dead || reduced || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      px.target = (event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1;
      py.target = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1) * 2;
      tiltX.target = clamp(px.target, -1, 1) * 0.12;
      tiltY.target = clamp(py.target, -1, 1) * -0.09;
      force.target = 1; pointerAge = 0;
    }
    function leave() { force.target = 0; tiltX.target = 0; tiltY.target = 0; }
    function visibility() { if (document.hidden) stop(); else { resize(); start(); } }
    function contextLost(event) { event.preventDefault(); lost = true; stop(); }
    function contextRestored() {
      if (dead) return;
      buffers = []; shaders = []; program = null;
      try { initialize(); lost = false; resize(); start(); }
      catch { release(); lost = true; }
    }
    cleanup = () => {
      if (dead) return;
      dead = true; stop(); observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerout', pointerOut);
      window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      if (!lost) { gl.clear(gl.COLOR_BUFFER_BIT); release(); }
      positions.length = 0;
    };
    function pointerOut(event) { if (!event.relatedTarget) leave(); }
    initialize();
    canvas.addEventListener('webglcontextlost', contextLost, false);
    canvas.addEventListener('webglcontextrestored', contextRestored, false);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerout', pointerOut, { passive: true });
    window.addEventListener('blur', leave);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(resize); observer.observe(canvas); }
    resize(); start();
    return {
      setShape(value) { if (!dead && finite(value)) { shape.target = clamp(value, 0, specs.length - 1); changed(); } },
      setAnchor(x, y, size) {
        if (dead) return;
        if (finite(x)) ax.target = clamp(x, -1, 1);
        if (finite(y)) ay.target = clamp(y, -1, 1);
        if (finite(size)) scale.target = Math.max(0, size);
        changed();
      },
      setDim(value) { if (!dead && finite(value)) { dim.target = clamp(value, 0, 1); changed(); } },
      burst() { if (!dead) { entrance = reduced ? 1 : 0; changed(); } },
      setReduced(value) {
        if (dead || reduced === !!value) return;
        reduced = !!value; stop();
        if (reduced) { entrance = 1; settle(); draw(); } else start();
      },
      destroy() { cleanup(); },
    };
  } catch { try { cleanup(); } catch { /* Unavailable or invalidated context. */ } return null; }
}
