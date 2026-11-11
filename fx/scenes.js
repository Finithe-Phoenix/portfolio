/** Decorative Canvas 2D loops. Coordinates use a proportional 400 × 250 stage. */
export const sceneKinds = ['translator', 'fleet', 'payments', 'clinic', 'operations', 'trading', 'course', 'pipeline'];

const TAU = Math.PI * 2;
const FONT = '"Cascadia Code", Consolas, monospace';
const ICE = '#95ddff', MUTED = '#acbdd2', RED = '#ff5365', BLUE = '#55c5ff';
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (p, a, b) => ease((p - a) / (b - a));
const mix = (a, b, t) => a + (b - a) * t;
const fract = x => x - Math.floor(x);

// Stable spatial detail; never sample randomness while painting.
function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const random = seeded(0x71c0ffee);
const agents = Array.from({ length: 71 }, (_, i) => ({
  cluster: i % 5, angle: random() * TAU, radius: 9 + random() * 21,
  size: 1.3 + random() * 1.1, offset: random()
}));
const candles = Array.from({ length: 48 }, (_, i) => {
  const open = 106 + Math.sin(i * .72) * 18 + Math.sin(i * .23) * 15;
  const close = open + (random() - .47) * 23;
  return { open, close, high: Math.min(open, close) - 4 - random() * 9,
    low: Math.max(open, close) + 4 + random() * 9, volume: 7 + random() * 23 };
});

function painter(ctx, accent) {
  const line = (points, color = accent, width = 1, alpha = 1, glow = false) => {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 9; }
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.restore();
  };
  const box = (x, y, w, h, fill = '#0e1c2e', stroke = '#203b53', radius = 7) => {
    ctx.beginPath();
    // Avoid requiring roundRect on older Canvas implementations.
    const r = Math.min(radius, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .8; ctx.stroke(); }
  };
  const text = (value, x, y, size = 9, color = MUTED, align = 'left') => {
    ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(value, x, y);
  };
  const dot = (x, y, r = 2, color = accent, glow = false) => {
    ctx.save(); if (glow) { ctx.shadowBlur = 10; ctx.shadowColor = color; }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  };
  const ring = (x, y, r, fraction = 1, color = accent, width = 1, start = -Math.PI / 2) => {
    ctx.beginPath(); ctx.arc(x, y, r, start, start + TAU * Math.max(.0001, fraction));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
  };
  const check = (x, y, color = BLUE, s = 1) => line([[x - 4 * s, y], [x - s, y + 3 * s], [x + 5 * s, y - 4 * s]], color, 1.6);
  const packet = (points, t, color = accent) => {
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    let distance = clamp(t) * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1) {
        const f = lengths[i] ? distance / lengths[i] : 0;
        dot(mix(points[i][0], points[i + 1][0], f), mix(points[i][1], points[i + 1][1], f), 2.5, color, true); break;
      }
      distance -= lengths[i];
    }
  };
  const label = (left, right) => {
    dot(21, 21, 2, accent); text(left, 30, 22, 9, ICE);
    text(right, 379, 22, 8, MUTED, 'right');
    line([[20, 36], [380, 36]], '#22364c', .7);
  };
  return { ctx, accent, line, box, text, dot, ring, check, packet, label };
}

function translator(d, p, still) {
  const { ctx, accent, box, line, text, dot, packet } = d;
  box(20, 58, 123, 134); box(257, 58, 123, 134);
  text('x86_64', 31, 72, 10, ICE); text('ARM64', 268, 72, 10, ICE);
  line([[30, 85], [132, 85]], '#294058'); line([[268, 85], [369, 85]], '#294058');
  const left = ['48 89 E5', 'mov rax, rbx', '48 83 C0 08', 'add rax, 8'];
  const right = ['mov x0, x1', 'add x2, x0, #8', 'ldr x3, [x2]', 'ret'];
  ctx.save(); ctx.beginPath(); ctx.rect(25, 91, 350, 94); ctx.clip();
  for (let i = 0; i < 4; i++) {
    const highlight = .72 + .28 * Math.pow(Math.cos(TAU * (p - i / 4)), 4);
    ctx.save(); ctx.globalAlpha *= still ? 1 : highlight;
    text(left[i], 31, still ? 103 + i * 23 : 96 + fract(i / 4 - p) * 92, 9, i % 2 ? MUTED : accent);
    text(right[i], 267, still ? 103 + i * 23 : 96 + fract(i / 4 - p + .12) * 92, 8.7, i % 2 ? MUTED : ICE); ctx.restore();
  }
  ctx.restore();
  line([[142, 126], [178, 126]], accent, 8, .07);
  line([[142, 126], [178, 126]], accent, 1.3, .8, true);
  for (let i = 0; i < 3; i++) {
    const end = 105 + i * 21;
    line([[216, 126], [244, end], [257, end]], i === 1 ? ICE : accent, 1, .65, i === 1);
    if (!still) packet([[216, 126], [244, end], [257, end]], fract(p * 3 + i / 3), ICE);
  }
  const gradient = ctx.createLinearGradient(170, 85, 227, 170);
  gradient.addColorStop(0, '#275b7e'); gradient.addColorStop(.5, '#122c49'); gradient.addColorStop(1, '#0c1a30');
  ctx.beginPath(); ctx.moveTo(200, 71); ctx.lineTo(233, 166); ctx.lineTo(166, 166); ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 1.2; ctx.stroke();
  line([[200, 71], [200, 151], [166, 166]], ICE, .8, .5);
  line([[200, 151], [233, 166]], ICE, .8, .5);
  box(181, 113, 38, 25, '#112941', '#4787a6', 4); text('IR', 200, 126, 12, ICE, 'center');
  text('i64.add', 200, 146, 6.8, ICE, 'center');
  text('%0 -> %1', 200, 158, 6.5, MUTED, 'center');
  if (!still) packet([[143, 126], [178, 126]], fract(p * 3));
  text('DECODE', 81, 211, 8, MUTED, 'center'); text('LOWER', 200, 211, 8, accent, 'center');
  text('EMIT', 318, 211, 8, MUTED, 'center');
  line([[113, 211], [175, 211]], '#294058'); line([[225, 211], [289, 211]], '#294058');
}

function fleet(d, p, still) {
  const { ctx, accent, line, dot, ring, text, box, check } = d;
  const cx = 155, cy = 130;
  ring(cx, cy, 70, 1, '#1a3047'); ring(cx, cy, 90, 1, '#12263c');
  const progress = still ? .9 : .9 * ramp(p, .04, .78);
  ring(cx, cy, 90, progress, accent, 2.5);
  for (let i = 0; i < 5; i++) {
    const angle = i * TAU / 5 - Math.PI / 2 + Math.sin(TAU * p) * .055;
    const x = cx + Math.cos(angle) * 62, y = cy + Math.sin(angle) * 62;
    line([[cx, cy], [x, y]], accent, .8, .17);
    ring(x, y, 28, 1, '#1c354c', .6);
  }
  agents.forEach((a, i) => {
    const clusterAngle = a.cluster * TAU / 5 - Math.PI / 2 + Math.sin(TAU * p) * .055;
    const angle = a.angle + TAU * p * (a.cluster % 2 ? -1 : 1);
    const x = cx + Math.cos(clusterAngle) * 62 + Math.cos(angle) * a.radius;
    const y = cy + Math.sin(clusterAngle) * 62 + Math.sin(angle) * a.radius;
    if (i % 7 === 0) {
      line([[cx, cy], [x, y]], accent, .65, .24);
      const t = still ? .66 : fract(p * 3 + a.offset);
      dot(mix(cx, x, t), mix(cy, y, t), 1.7, ICE);
    }
    dot(x, y, a.size, i % 9 === 0 ? ICE : accent);
  });
  ring(cx, cy, 24, 1, '#335775'); box(cx - 18, cy - 18, 36, 36, '#102d45', accent, 10);
  text('ORCH', cx, cy, 9, ICE, 'center');
  box(270, 67, 110, 128);
  text('AGENT MESH', 282, 83, 8, MUTED); text('71', 282, 112, 29, ICE);
  text('ONLINE', 330, 118, 8, accent);
  line([[282, 136], [368, 136]], '#294058');
  text('CCI >= 90%', 282, 153, 9, ICE);
  box(282, 169, 85, 4, '#263b4e', null, 2);
  if (progress > 0) box(282, 169, 85 * progress, 4, accent, null, 2);
  if (still || p > .8) {
    check(359, 185); text('VERIFIED', 282, 185, 7, BLUE);
    if (!still && p < .88) {
      ctx.save(); ctx.globalAlpha *= 1 - ramp(p, .8, .88);
      ring(359, 185, 6 + ramp(p, .8, .88) * 8, 1, BLUE); ctx.restore();
    }
  }
  text('DISTRIBUTED / IN SYNC', 155, 235, 8, MUTED, 'center');
}

function payments(d, p, still) {
  const { accent, box, line, text, dot, packet, check } = d;
  const states = ['CREATED', 'VALIDATED', 'RESERVED', 'SENT', 'SETTLED'];
  const progress = still ? 4 : ramp(p, .06, .8) * 4;
  const xs = [40, 120, 200, 280, 360];
  line([[40, 89], [360, 89]], '#28435c', 2);
  line([[40, 89], [40 + progress * 80, 89]], accent, 2, .8, true);
  states.forEach((s, i) => {
    box(xs[i] - 12, 77, 24, 24, i <= progress ? '#17445e' : '#102035', i <= progress ? accent : '#35506b', 7);
    if (i < progress || (still && i === 4)) check(xs[i], 89, ICE, .7);
    else dot(xs[i], 89, 2, i <= progress ? ICE : MUTED);
    text(s, xs[i], 62, 7.7, i <= progress ? ICE : MUTED, 'center');
  });
  const retry = [[200, 102], [200, 126], [280, 126], [280, 102]];
  line(retry, RED, 1, .55); text('RETRY / 01', 240, 141, 7.5, RED, 'center');
  if (!still && p > .39 && p < .58) packet(retry, ramp(p, .39, .58), RED);
  box(20, 160, 360, 65);
  text('DOUBLE-ENTRY LEDGER', 32, 174, 8, MUTED);
  line([[200, 183], [200, 214]], '#294058');
  const posted = still || progress > 2;
  const debit = still ? 240 : 240 * ramp(progress, 2, 2.5);
  const credit = still ? 240 : 240 * ramp(progress, 3.5, 3.95);
  text('DEBIT', 32, 198, 8, MUTED); text(posted ? `- ${debit.toFixed(2)}` : '—', 183, 198, 13, RED, 'right');
  text('CREDIT', 215, 198, 8, MUTED); text(credit > 0 ? `+ ${credit.toFixed(2)}` : 'PENDING', 368, 198, credit > 0 ? 13 : 9, ICE, 'right');
  text(progress >= 3.9 ? 'BALANCED / COMMITTED' : 'ATOMIC TRANSFER', 32, 215, 7, accent);
  if (!still && progress < 4) dot(40 + progress * 80, 89, 3, ICE, true);
}

function clinic(d, p, still) {
  const { accent, box, line, text, dot, packet, check } = d;
  const a = still ? 1 : ramp(p, .08, .25), b = still ? 1 : ramp(p, .27, .44);
  const c = still ? 1 : ramp(p, .48, .65), e = still ? 1 : ramp(p, .68, .82);
  const links = [[[181, 94], [219, 94]], [[300, 131], [300, 151]], [[219, 188], [181, 188]]];
  links.forEach((l, i) => { line(l, accent, 1, .45); if (!still) packet(l, fract(p * 2 - i * .3)); });
  box(20, 53, 161, 78); box(219, 53, 161, 78);
  box(219, 151, 161, 78); box(20, 151, 161, 78);
  text('01 / APPOINTMENTS', 31, 67, 8, ICE);
  box(31, 83, 27, 33, '#163149', '#34506a', 3);
  text('09', 44, 96, 12, ICE, 'center'); text('AM', 44, 108, 7, MUTED, 'center');
  text('CONSULT', 69, 91, 9, MUTED); text(a > .8 ? 'COMPLETED' : 'SCHEDULED', 69, 110, 8, a > .8 ? accent : MUTED);
  if (a > .8) check(165, 110, accent, .7);
  text('02 / INVENTORY', 230, 67, 8, ICE);
  const stock = Math.round(12 - b * 8);
  text(String(stock).padStart(2, '0'), 230, 95, 24, stock < 6 ? RED : ICE);
  text('UNITS', 267, 96, 8, MUTED);
  for (let i = 0; i < 12; i++) box(230 + i * 11.5, 113, 8, 6, i < stock ? (stock < 6 ? RED : accent) : '#203247', null, 1);
  line([[297, 106], [297, 124]], RED, 1, .7); text('MIN 06', 369, 94, 7, RED, 'right');
  text('03 / PURCHASING', 230, 166, 8, ICE);
  text(c > .5 ? 'PO-0248' : 'WATCHING STOCK', 230, 188, 11, c > .5 ? ICE : MUTED);
  text(c > .5 ? '+ 24 UNITS / QUEUED' : 'AUTO REPLENISH', 230, 213, 8, accent);
  text('04 / AUDIT TRAIL', 31, 166, 8, ICE);
  for (let i = 0; i < 3; i++) {
    const active = e > i / 3;
    dot(33, 184 + i * 15, 1.5, active ? accent : '#365069');
    text(['visit.completed', 'stock.consumed', 'order.created'][i], 41, 184 + i * 15, 8, active ? MUTED : '#415972');
  }
}

function operations(d, p, still) {
  const { ctx, accent, box, line, text, dot, packet } = d;
  const growth = still ? 1 : ramp(p, .03, .58);
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * 124;
    box(x, 52, 112, 55); text(['REVENUE', 'UPTIME', 'ORDERS'][i], x + 11, 65, 8, MUTED);
    text(['$ 24.8K', '99.98%', '1,284'][i], x + 11, 84, 16, ICE);
    box(x + 11, 97, 89, 3, '#23394e', null, 1);
    box(x + 11, 97, Math.max(1, (64 + i * 10) * growth), 3, accent, null, 1);
  }
  box(20, 119, 218, 110); box(250, 119, 130, 110);
  text('SALES / 24H', 31, 133, 8, MUTED); text('+18.4%', 226, 133, 8, accent, 'right');
  for (let i = 0; i < 3; i++) line([[32, 157 + i * 24], [226, 157 + i * 24]], '#213449', .7);
  const points = Array.from({ length: 25 }, (_, i) => [32 + i * 8, 204 - i * 2 - Math.sin(i * .8) * 8]);
  ctx.save(); ctx.beginPath(); ctx.rect(31, 145, 1 + 192 * growth, 75); ctx.clip();
  const g = ctx.createLinearGradient(0, 151, 0, 215); g.addColorStop(0, '#24557499'); g.addColorStop(1, '#24557400');
  ctx.beginPath(); ctx.moveTo(32, 214); points.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(224, 214); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  line(points, accent, 1.7, 1, true); ctx.restore();
  const segment = Math.min(23, Math.floor(growth * 24)), fraction = growth * 24 - segment;
  const tip = [mix(points[segment][0], points[segment + 1][0], fraction), mix(points[segment][1], points[segment + 1][1], fraction)];
  dot(tip[0], tip[1], 2.8, ICE);
  text('POINTS OF SALE', 261, 133, 8, MUTED);
  const nodes = [[315, 179], [274, 161], [351, 157], [363, 199], [287, 213]];
  nodes.slice(1).forEach((n, i) => {
    line([nodes[0], n], accent, 1, .35);
    if (!still) packet([n, nodes[0]], fract(p * 3 + i * .2));
    dot(n[0], n[1], 5, '#17364e'); dot(n[0], n[1], 2, ICE);
  });
  box(303, 167, 24, 24, '#19415b', accent, 6); text('HQ', 315, 179, 8, ICE, 'center');
}

function trading(d, p, still) {
  const { ctx, accent, box, line, text, dot } = d;
  box(20, 53, 237, 176); box(269, 53, 111, 176);
  text('BTC / USD', 31, 68, 9, ICE); text('1m', 245, 68, 8, MUTED, 'right');
  for (let i = 0; i < 4; i++) line([[30, 93 + i * 30], [246, 93 + i * 30]], '#22374b', .65);
  ctx.save(); ctx.beginPath(); ctx.rect(30, 80, 216, 137); ctx.clip();
  const shift = still ? 12 : p * 48;
  for (let k = -1; k < 20; k++) {
    const index = ((Math.floor(shift) + k) % 48 + 48) % 48;
    const c = candles[index], x = 34 + k * 12 - fract(shift) * 12;
    const color = c.close <= c.open ? accent : RED;
    line([[x, c.high], [x, c.low]], color, .8);
    box(x - 3, Math.min(c.open, c.close), 6, Math.max(2, Math.abs(c.open - c.close)), color, null, 1);
    ctx.globalAlpha *= .42; box(x - 3, 218 - c.volume, 6, c.volume, color, null, 1); ctx.globalAlpha /= .42;
  }
  const priceY = 124 + Math.sin(TAU * p * 2) * 12;
  ctx.setLineDash([3, 4]); line([[30, priceY], [246, priceY]], ICE, .8, .7); ctx.setLineDash([]);
  const buy = still ? 1 : ramp(p, .3, .4) * (1 - ramp(p, .8, .9));
  ctx.globalAlpha *= buy; box(91, 154, 39, 18, '#173b42', BLUE, 4); text('BUY', 110, 164, 8, BLUE, 'center');
  line([[110, 154], [110, 145]], BLUE); dot(110, 144, 2, BLUE); ctx.restore();
  text('ORDER BOOK', 280, 68, 8, ICE);
  text('PRICE', 280, 85, 7, MUTED); text('SIZE', 370, 85, 7, MUTED, 'right');
  for (let i = 0; i < 8; i++) {
    const bid = i > 3, y = 100 + i * 15;
    const pulse = still ? .6 : .5 + .5 * Math.sin(TAU * (p * 4 + i * .17));
    ctx.save(); ctx.globalAlpha *= .08 + pulse * .12;
    box(278, y - 6, 30 + 61 * (.5 + .5 * Math.sin(i * 2 + p * TAU)), 12, bid ? accent : RED, null, 1); ctx.restore();
    text((64218.5 - i * 1.5).toFixed(1), 280, y, 8, bid ? ICE : RED);
    text((.12 + i * .13 + pulse * .08).toFixed(2), 370, y, 8, MUTED, 'right');
  }
  text('VOL', 31, 220, 7, MUTED);
}

function course(d, p, still) {
  const { ctx, accent, box, line, text, dot, check, ring } = d;
  const first = still || p > .23, second = still || p > .46, third = still || p > .69;
  box(20, 53, 231, 176); box(262, 53, 118, 176);
  dot(31, 64, 2, RED); dot(40, 64, 2, '#718599'); dot(49, 64, 2, accent);
  box(65, 59, 174, 12, '#15283d', null, 3); text('localhost / enroll', 73, 65, 7, MUTED);
  line([[20, 77], [251, 77]], '#294058'); text('Create workspace', 35, 94, 12, ICE);
  text('EMAIL', 35, 116, 7, MUTED); box(35, 125, 201, 25, '#0b1728', first ? accent : '#30465d', 4);
  text(first ? 'dev@example.test' : 'you@example.test', 44, 138, 9, first ? ICE : '#67819b');
  box(35, 162, 11, 11, second ? '#194c61' : '#102237', second ? accent : '#39516b', 2);
  if (second) check(40, 168, ICE, .6); text('Enable test mode', 54, 168, 8, MUTED);
  box(35, 190, 201, 25, third ? '#173951' : '#1a4964', third ? BLUE : accent, 4);
  text(third ? 'WORKSPACE READY' : 'CREATE WORKSPACE', 135, 203, 8, third ? BLUE : ICE, 'center');
  text('TEST RUNNER', 274, 68, 8, ICE);
  const labels = ['Fill form', 'Select mode', 'Submit'];
  [first, second, third].forEach((done, i) => {
    const y = 101 + i * 31; ring(279, y, 6, 1, done ? '#345575' : '#294058');
    if (done) check(279, y, BLUE, .65); else text(String(i + 1), 279, y, 7, MUTED, 'center');
    text(labels[i], 292, y, 8, done ? ICE : MUTED);
  });
  line([[273, 185], [369, 185]], '#294058'); text(`${Number(first) + Number(second) + Number(third)} OF 3 PASSED`, 273, 204, 8, third ? BLUE : MUTED);
  const route = [[206, 108], [151, 138], [41, 168], [144, 202], [219, 219]];
  let position;
  if (still) position = route[4];
  else {
    // Arrive, dwell, click; each test tick matches the cursor's target.
    const moves = [[.05, .19], [.30, .40], [.51, .63], [.77, .87]];
    position = [...route[0]];
    moves.forEach(([start, end], i) => {
      if (p >= start) {
        const t = ramp(p, start, end);
        position = [mix(route[i][0], route[i + 1][0], t), mix(route[i][1], route[i + 1][1], t)];
      }
    });
  }
  const [x, y] = position;
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1, 14); ctx.lineTo(5, 10); ctx.lineTo(9, 16); ctx.lineTo(12, 14); ctx.lineTo(8, 8); ctx.lineTo(14, 7); ctx.closePath();
  ctx.fillStyle = ICE; ctx.fill(); ctx.strokeStyle = '#0a1220'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  if (!still) {
    const click = [p - .23, p - .46, p - .69].find(v => v >= 0 && v < .055);
    if (click !== undefined) { ctx.save(); ctx.globalAlpha *= 1 - click / .055; ring(x, y, 5 + click * 240, 1, accent); ctx.restore(); }
  }
  if (!still && p > .12 && p < .30) text('[name=email]', 146, 119, 7, accent);
  if (!still && p >= .30 && p < .51) text('[type=checkbox]', 231, 157, 7, accent, 'right');
  if (!still && p >= .51 && p < .77) text('#create', 231, 183, 7, accent, 'right');
}

function pipeline(d, p, still) {
  const { ctx, accent, box, line, text, dot, check } = d;
  const labels = ['CODE', 'BUILD', 'TEST', 'DEPLOY', 'OBSERVE'];
  const xs = [44, 122, 200, 278, 356];
  line([[27, 117], [373, 117]], '#26435c', 2);
  line([[27, 124], [373, 124]], '#162d43', 1);
  labels.forEach((label, i) => {
    text(label, xs[i], 62, 8, MUTED, 'center');
    box(xs[i] - 19, 77, 38, 31, '#10263c', '#315c79', 6);
    if (i === 0) text('</>', xs[i], 93, 12, ICE, 'center');
    if (i === 1) { box(xs[i] - 7, 86, 14, 14, '#234b65', accent, 2); line([[xs[i] - 7, 90], [xs[i] + 7, 90]], ICE, .7); }
    if (i === 2) check(xs[i], 92, ICE, 1.2);
    if (i === 3) { line([[xs[i], 100], [xs[i], 85], [xs[i] - 5, 90]], ICE, 1.3); line([[xs[i], 85], [xs[i] + 5, 90]], ICE, 1.3); }
    if (i === 4) { d.ring(xs[i], 93, 9, 1, accent); dot(xs[i], 93, 3, ICE); }
  });
  ctx.save(); ctx.beginPath(); ctx.rect(25, 108, 350, 22); ctx.clip();
  for (let i = 0; i < 7; i++) {
    const x = 20 + fract(i / 7 + p) * 364;
    box(x - 7, 112, 14, 10, '#245271', accent, 2);
    line([[x - 3, 115], [x - 3, 119]], ICE, .7); line([[x + 2, 115], [x + 2, 119]], ICE, .7);
  }
  ctx.restore();
  box(20, 145, 168, 84); box(201, 145, 179, 84);
  const pods = still ? 12 : 3 + Math.floor(ramp(p, .14, .7) * 9);
  text('REPLICAS', 31, 160, 8, MUTED); text(String(pods).padStart(2, '0'), 176, 160, 11, ICE, 'right');
  for (let i = 0; i < 12; i++) {
    const x = 32 + (i % 6) * 24, y = 177 + Math.floor(i / 6) * 24;
    box(x, y, 17, 16, i < pods ? '#1b465e' : '#102238', i < pods ? accent : '#294159', 3);
    if (i < pods) dot(x + 8.5, y + 8, 2, ICE);
  }
  text('HEALTH / LATENCY', 212, 160, 8, MUTED); text('24 ms', 368, 160, 8, accent, 'right');
  const points = Array.from({ length: 32 }, (_, i) => [212 + i * 5, 194 + Math.sin(i * .7 + p * TAU * 2) * 6 + Math.cos(i * 1.4 + p * TAU) * 3]);
  line([[212, 211], [369, 211]], '#243b51'); line(points, accent, 1.5, 1, true);
  dot(367, points[31][1], 2.5, ICE); text('ALL SYSTEMS NOMINAL', 212, 220, 7, MUTED);
}

const scenes = { translator, fleet, payments, clinic, operations, trading, course, pipeline };
const titles = {
  translator: ['BINARY TRANSLATION', '01 / COMPILER'], fleet: ['AGENT ORCHESTRATION', '02 / MESH'],
  payments: ['TRANSFER PROTOCOL', '03 / LEDGER'], clinic: ['CLINIC WORKFLOW', '04 / CARE'],
  operations: ['OPERATIONS CONTROL', '05 / LIVE'], trading: ['MARKET TERMINAL', '06 / SPOT'],
  course: ['BROWSER AUTOMATION', '07 / E2E'], pipeline: ['DELIVERY PIPELINE', '08 / CLOUD']
};

/** Mount inactive. The host owns intersection visibility and reduced-motion preference. */
export function mountScene(canvas, kind, options) {
  const noop = () => {};
  const inert = { setReduced: noop, setActive: noop, setShot: noop, destroy: noop };
  let ctx, view, doc;
  try {
    ctx = canvas?.getContext('2d');
    if (!ctx) return inert;
    doc = canvas.ownerDocument || globalThis.document;
    view = doc?.defaultView || globalThis;
  } catch { return inert; }

  let active = false, reduced = false, destroyed = false, failed = false;
  let observer, raf = null, previous = null, elapsed = 0, width = 0, height = 0, ratio = 1;
  let accent = '#55c5ff', shot = null;
  const safely = fn => (...args) => { try { return fn(...args); } catch { /* Decorative content must never break its host. */ } };
  const stop = safely(() => {
    if (raf !== null) view.cancelAnimationFrame(raf);
    raf = null; previous = null;
  });
  const visible = () => !doc?.hidden && doc?.visibilityState !== 'hidden';
  const running = () => active && !reduced && visible() && width > 0 && height > 0 && !destroyed && !failed;
  let draw;
  const paint = () => {
    if (destroyed || failed) return;
    try { draw(); } catch { failed = true; stop(); }
  };
  const tick = safely(now => {
    raf = null;
    if (!running()) { previous = null; paint(); return; }
    if(previous!==null&&now-previous<(options?.maxFps===30?32:16)){raf=view.requestAnimationFrame(tick);return;}
    if (previous !== null) elapsed += Math.max(0, now - previous);
    previous = now;
    paint();
    if (running()) raf = view.requestAnimationFrame(tick);
  });
  const sync = safely(() => {
    if (destroyed) return;
    stop(); paint();
    if (running()) raf = view.requestAnimationFrame(tick);
  });
  const resize = safely(() => {
    if (destroyed) return;
    const w = Math.max(0, Number(canvas.clientWidth) || 0), h = Math.max(0, Number(canvas.clientHeight) || 0);
    const dpr = Math.min(2, Math.max(1, Number(view.devicePixelRatio) || 1));
    if (w !== width || h !== height || ratio !== dpr) {
      width = w; height = h; ratio = dpr;
      canvas.width = Math.max(1, Math.round(w * ratio)); canvas.height = Math.max(1, Math.round(h * ratio));
    }
    sync();
  });
  const destroy = safely(() => {
    if (destroyed) return;
    destroyed = true; stop();
    safely(() => observer?.disconnect())();
    safely(() => view.removeEventListener?.('resize', resize))();
    safely(() => doc?.removeEventListener?.('visibilitychange', sync))();
  });
  try {
    reduced = Boolean(options?.reduced);
    // Canvas validates CSS colors and ignores invalid assignments.
    ctx.save(); ctx.fillStyle = accent;
    if (typeof options?.accent === 'string') ctx.fillStyle = options.accent;
    accent = ctx.fillStyle; ctx.restore();
    kind = typeof kind === 'string' && Object.prototype.hasOwnProperty.call(scenes, kind) ? kind : 'pipeline';
    const d = painter(ctx, accent);
    draw = () => {
      if (!width || !height) return;
      const still = !active || reduced || !visible();
      const duration = kind === 'fleet' ? 9600 : 8400;
      // A selected shot breathes inside its phase instead of snapping back at a loop seam.
      const p = shot === null ? (still ? .84 : (elapsed % duration) / duration) : .14 + shot * .22 + (still ? 0 : Math.sin(elapsed / 1600) * .04);
      ctx.setTransform(canvas.width / 400, 0, 0, canvas.height / 250, 0, 0);
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.setLineDash([]);
      ctx.fillStyle = '#0a1220'; ctx.fillRect(0, 0, 400, 250);
      const halo = ctx.createRadialGradient(190, 120, 5, 190, 120, 230);
      halo.addColorStop(0, '#10263c'); halo.addColorStop(1, '#0a1220');
      ctx.fillStyle = halo; ctx.fillRect(0, 0, 400, 250);
      for (let x = 12; x < 400; x += 20) for (let y = 46; y < 250; y += 20) d.dot(x, y, .55, '#233c51');
      d.label(...titles[kind]);
      // Naturally periodic scenes wrap directly. Sequential scenes crossfade into
      // their next opening pose, keeping the illustration present at the seam.
      const periodic = kind === 'translator' || kind === 'trading';
      const reset = still || periodic ? 0 : ramp(p, .92, 1);
      ctx.save(); ctx.globalAlpha = 1 - reset; scenes[kind](d, p, still && shot === null); ctx.restore();
      if (reset > 0) {
        ctx.save(); ctx.globalAlpha = reset; scenes[kind](d, 0, false); ctx.restore();
      }
    };
    doc?.addEventListener?.('visibilitychange', sync);
    view.addEventListener?.('resize', resize);
    if (typeof view.ResizeObserver === 'function') {
      observer = new view.ResizeObserver(resize); observer.observe(canvas);
    }
    resize();
  } catch { destroy(); return inert; }
  return {
    setShot: safely(value => { shot = Number.isInteger(value) ? Math.max(0, Math.min(3, value)) : null; elapsed = 0; sync(); }),
    setReduced: safely(value => { if (!destroyed && reduced !== Boolean(value)) { reduced = Boolean(value); sync(); } }),
    setActive: safely(value => { if (!destroyed && active !== Boolean(value)) { active = Boolean(value); sync(); } }),
    destroy
  };
}
