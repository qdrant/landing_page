/*
 * scalar island: how scalar quantization maps float32 values onto int8.
 *
 * The histogram is the 400 coordinate values of one illustrative vector, two of
 * them outliers. Scalar quantization picks a lower and an upper bound and
 * stretches that range evenly over 256 int8 levels (-128 to 127). The bounds
 * are either the smallest and largest value, or, with a quantile below 1.0,
 * the range left after the most extreme values are ignored: quantile 0.99
 * leaves out the extreme 1%, as in Qdrant's documentation. A value outside the
 * bounds is clipped to the end level. The data is seeded and illustrative; the
 * bounds, levels and codes are computed from it.
 *
 * bounds(), encode(), render() and statusText() are pure and exported so the
 * static fallback image can be generated from the same code.
 */

const N = 400;
const DOM0 = -1.4;
const DOM1 = 3.2;
const BIN = 0.1;
export const QUANTILE = 0.99;
export const MODES = [
  { id: 'whole', label: 'Whole range' },
  { id: 'clip', label: 'Quantile 0.99' },
];

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeValues() {
  const rnd = mulberry32(7);
  const v = [];
  for (let i = 0; i < N - 2; i++) {
    const g = Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-9))) * Math.cos(2 * Math.PI * rnd());
    v.push(0.05 + 0.35 * g);
  }
  v.push(2.45, 2.9); // two outliers
  return v;
}

export const VALUES = makeValues();
const SORTED = VALUES.slice().sort((a, b) => a - b);

export function bounds(mode) {
  if (mode === 'clip') {
    const k = Math.round((N * (1 - QUANTILE)) / 2); // values ignored at each end
    return { lo: SORTED[k], hi: SORTED[N - 1 - k], ignored: 2 * k };
  }
  return { lo: SORTED[0], hi: SORTED[N - 1], ignored: 0 };
}

export function encode(mode, x) {
  const { lo, hi } = bounds(mode);
  const step = (hi - lo) / 255;
  const clipped = x < lo || x > hi;
  const q = Math.round((Math.min(hi, Math.max(lo, x)) - lo) / step);
  return { lo, hi, step, clipped, code: q - 128, dec: lo + q * step, level: q };
}

export function statusText(mode, x) {
  const e = encode(mode, x);
  const b = bounds(mode);
  const range =
    mode === 'clip'
      ? `The ${b.ignored} most extreme values (1%) are ignored, so the bounds are ${e.lo.toFixed(2)} and ${e.hi.toFixed(2)}.`
      : `The bounds are the smallest and largest value, ${e.lo.toFixed(2)} and ${e.hi.toFixed(2)}.`;
  const width = `The 256 int8 levels stretch evenly over them, so one level is ${e.step.toFixed(4)} wide.`;
  const value = e.clipped
    ? `${x.toFixed(2)} is outside the bounds, so it is clipped to code ${e.code} and decodes as ${e.dec.toFixed(2)}.`
    : `${x.toFixed(2)} becomes code ${e.code} and decodes as ${e.dec.toFixed(2)}.`;
  return `${range} ${width} ${value}`;
}

const VB_W = 760;
const VB_H = 308;
const AX0 = 30;
const AXW = 700;
const xf = (v) => AX0 + ((v - DOM0) / (DOM1 - DOM0)) * AXW;
const HIST_BASE = 142;
const HIST_H = 92;
const BAR_Y = 238;

function histogram() {
  const bins = Math.round((DOM1 - DOM0) / BIN);
  const counts = new Array(bins).fill(0);
  VALUES.forEach((v) => {
    const i = Math.floor((v - DOM0) / BIN);
    if (i >= 0 && i < bins) counts[i]++;
  });
  return { counts, max: Math.max(...counts), bins };
}
const HIST = histogram();

export function render(mode, x) {
  const e = encode(mode, x);
  const out = [`<text class="qscalar-h" x="0" y="14">float32 values of one vector, 400 coordinates</text>`];

  // bounds lines and labels
  [[e.lo, 'lower'], [e.hi, 'upper']].forEach(([v, name]) => {
    const px = xf(v);
    const right = px > AX0 + AXW * 0.6;
    out.push(
      `<line class="qscalar-bound" x1="${px.toFixed(1)}" y1="38" x2="${px.toFixed(1)}" y2="${HIST_BASE}"/>`,
      `<text class="qscalar-h" x="${(right ? px - 6 : px + 6).toFixed(1)}" y="34" text-anchor="${right ? 'end' : 'start'}">${name} bound ${v.toFixed(2)}</text>`,
    );
  });

  // histogram
  HIST.counts.forEach((c, i) => {
    if (!c) return;
    const v0 = DOM0 + i * BIN;
    const inside = v0 + BIN / 2 >= e.lo && v0 + BIN / 2 <= e.hi;
    const h = (c / HIST.max) * HIST_H;
    out.push(`<rect class="qscalar-bin ${inside ? 'is-in' : 'is-out'}" x="${xf(v0).toFixed(1)}" y="${(HIST_BASE - h).toFixed(1)}" width="${(xf(DOM0 + BIN) - xf(DOM0) - 1.5).toFixed(1)}" height="${h.toFixed(1)}"/>`);
  });
  if (e.hi < SORTED[N - 1]) out.push(`<text class="qscalar-ign" x="${xf((SORTED[N - 1] + SORTED[N - 2]) / 2).toFixed(1)}" y="${HIST_BASE - 14}" text-anchor="middle">ignored</text>`);
  out.push(`<line class="qi-axis" x1="${AX0}" y1="${HIST_BASE}" x2="${AX0 + AXW}" y2="${HIST_BASE}"/>`);
  [-1, 0, 1, 2, 3].forEach((t) => {
    out.push(`<text class="qscalar-h" x="${xf(t).toFixed(1)}" y="${HIST_BASE + 20}" text-anchor="middle">${t}</text>`);
  });

  // funnel from the bounds onto the 256 int8 levels
  const fy = HIST_BASE + 30;
  out.push(
    `<polygon class="qscalar-funnel" points="${xf(e.lo).toFixed(1)},${fy} ${xf(e.hi).toFixed(1)},${fy} ${AX0 + AXW},${BAR_Y} ${AX0},${BAR_Y}"/>`,
    `<rect class="qscalar-int8" x="${AX0}" y="${BAR_Y}" width="${AXW}" height="20" rx="3"/>`,
    `<text class="qscalar-h" x="${AX0}" y="${BAR_Y + 40}">-128</text>`,
    `<text class="qscalar-h" x="${AX0 + AXW / 2}" y="${BAR_Y + 40}" text-anchor="middle">int8 codes: 256 levels</text>`,
    `<text class="qscalar-h" x="${AX0 + AXW}" y="${BAR_Y + 40}" text-anchor="end">127</text>`,
  );

  // the chosen value and where it lands
  const pos = AX0 + (e.level / 255) * AXW;
  out.push(
    `<line class="qscalar-mark${e.clipped ? ' is-over' : ''}" x1="${xf(x).toFixed(1)}" y1="44" x2="${xf(x).toFixed(1)}" y2="${fy}"/>`,
    `<line class="qscalar-mark${e.clipped ? ' is-over' : ''}" x1="${xf(x).toFixed(1)}" y1="${fy}" x2="${pos.toFixed(1)}" y2="${BAR_Y + 10}"/>`,
    `<circle class="qscalar-dot${e.clipped ? ' is-over' : ''}" cx="${pos.toFixed(1)}" cy="${BAR_Y + 10}" r="6"/>`,
  );
  return out.join('');
}

export function mount(node) {
  node.classList.add('qscalar');
  let mode = 'whole';
  let x = 0.3;
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="How the bounds are chosen">',
    MODES.map((m) => `<button type="button" class="qi-chip" data-mode="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '    </div>',
    `    <label class="qscalar__val">float32 value <input type="range" min="${DOM0}" max="${DOM1}" step="0.01" value="${x}"> <output></output></label>`,
    '  </div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-status--3 qscalar__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qscalar__status');
  const slider = node.querySelector('input');
  const output = node.querySelector('output');
  function draw() {
    svg.innerHTML = render(mode, x);
    const text = statusText(mode, x);
    status.textContent = text;
    output.textContent = x.toFixed(2);
    svg.setAttribute('aria-label', `How float32 values map onto int8 codes. ${text}`);
    node.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }
  node.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-mode]') : null;
    if (b) { mode = b.dataset.mode; draw(); }
  });
  slider.addEventListener('input', () => { x = Number(slider.value); draw(); });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
