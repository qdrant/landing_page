/*
 * turbo island: why TurboQuant rotates a vector before encoding it.
 *
 * TurboQuant encodes every coordinate with one shared codebook. That only works
 * if all coordinates have a similar spread. A real embedding can have a few
 * large coordinates, so the vector is first multiplied by a pseudo-random
 * orthogonal matrix, which spreads the energy evenly. Here the rotation is a
 * seeded sign flip followed by a Walsh-Hadamard transform, an orthogonal
 * matrix, so lengths and distances are preserved. The vector is illustrative.
 * The codebook is also illustrative: evenly spaced levels over +-0.5, which
 * covers the range rotated coordinates occupy. Qdrant's actual codebook values
 * are not shown, and the figure makes no claim about error or recall.
 */

const D = 16;
const RAW = [0.1, -0.2, 0.05, 0.15, -0.1, 4.0, 0.2, 0.08, -0.12, 0.1, 0.05, -0.15, -2.2, 0.1, 0.07, -0.05];
const SIGNS = [1, -1, -1, 1, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1];
const LIM = 0.5;

export const BITS = [
  { id: 4, label: '4-bit', levels: 16 },
  { id: 2, label: '2-bit', levels: 4 },
  { id: 1, label: '1-bit', levels: 2 },
];

function unit(v) {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

// y = H (s * x) / sqrt(16), with H the +-1 Hadamard matrix of size 16.
export function rotate(x) {
  let a = x.map((v, i) => v * SIGNS[i]);
  for (let h = 1; h < D; h *= 2) {
    const b = a.slice();
    for (let i = 0; i < D; i += 2 * h) {
      for (let j = i; j < i + h; j++) {
        b[j] = a[j] + a[j + h];
        b[j + h] = a[j] - a[j + h];
      }
    }
    a = b;
  }
  return a.map((v) => v / Math.sqrt(D));
}

export function levelsFor(count) {
  const w = (2 * LIM) / count;
  return Array.from({ length: count }, (_, i) => -LIM + (i + 0.5) * w);
}

export function encode(rotated, bits) {
  const base = unit(RAW);
  const x = rotated ? rotate(base) : base;
  const lv = levelsFor((BITS.find((b) => b.id === bits) || BITS[0]).levels);
  const cols = x.map((v) => {
    let best = lv[0];
    for (const l of lv) if (Math.abs(l - v) < Math.abs(best - v)) best = l;
    return { v, dec: best, clipped: Math.abs(v) > LIM };
  });
  return { cols, lv, max: Math.max(...x.map(Math.abs)), length: Math.hypot(...x) };
}

export function statusText(rotated, bits) {
  const { cols, max, length } = encode(rotated, bits);
  const out = cols.filter((c) => c.clipped).length;
  if (!rotated) {
    return `Before rotation the largest coordinate is ${max.toFixed(2)} of the vector's length${out ? ', outside the shared levels' : ''}, while most coordinates sit near zero. One set of levels cannot suit both.`;
  }
  return `After rotation the largest coordinate is ${max.toFixed(2)} and every coordinate sits in the same range. The length is still ${length.toFixed(2)}, so distances are preserved, and one shared set of levels suits them all.`;
}

const VB_W = 760;
const VB_H = 252;
const X0 = 44;
const PITCH = 42;
export const PANEL_H = 196;
const BASE = 118;
const SCALE = 94 / 0.9; // px per unit value, so +-0.9 fills the plot

export function render(rotated, bits, legend = true) {
  const { cols, lv } = encode(rotated, bits);
  const out = [`<text class="qturbo-h" x="0" y="16">${rotated ? 'After rotation' : 'Before rotation'}: one illustrative unit-length vector, ${D} coordinates</text>`];
  lv.forEach((l) => {
    out.push(`<line class="qturbo-lvl" x1="${X0 - 12}" y1="${BASE - l * SCALE}" x2="${X0 + D * PITCH}" y2="${BASE - l * SCALE}"/>`);
  });
  out.push(`<line class="qi-axis" x1="${X0 - 12}" y1="${BASE}" x2="${X0 + D * PITCH}" y2="${BASE}"/>`);
  cols.forEach((c, i) => {
    const x = X0 + i * PITCH + PITCH / 2;
    const h = Math.max(-0.9, Math.min(0.9, c.v)) * SCALE;
    out.push(
      `<rect class="qturbo-bar${c.clipped ? ' is-over' : ''}" x="${x - 7}" y="${h >= 0 ? BASE - h : BASE}" width="14" height="${Math.max(1.5, Math.abs(h))}" rx="2"/>`,
      `<circle class="qturbo-dot" cx="${x}" cy="${BASE - c.dec * SCALE}" r="5"/>`,
    );
  });
  if (legend) {
    out.push(
      `<text class="qturbo-h" x="0" y="${BASE + 112}">bar: original coordinate</text>`,
      `<circle class="qturbo-dot" cx="226" cy="${BASE + 107}" r="5"/>`,
      `<text class="qturbo-h" x="238" y="${BASE + 112}">dot: decoded level (${(BITS.find((b) => b.id === bits) || BITS[0]).levels} shared levels)</text>`,
    );
  }
  return out.join('');
}

export function mount(node) {
  node.classList.add('qturbo');
  let rotated = false;
  let bits = 4;
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip qturbo__rot" aria-pressed="false">Rotate the vector</button>',
    '    <div class="qi-group" role="group" aria-label="Bits per coordinate">',
    BITS.map((b) => `<button type="button" class="qi-chip" data-bits="${b.id}" aria-pressed="false">${b.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-status--2 qturbo__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qturbo__status');
  function draw() {
    svg.innerHTML = render(rotated, bits);
    const text = statusText(rotated, bits);
    status.textContent = text;
    svg.setAttribute('aria-label', `TurboQuant encoding of one vector ${rotated ? 'after' : 'before'} rotation. ${text}`);
    node.querySelector('.qturbo__rot').setAttribute('aria-pressed', String(rotated));
    node.querySelectorAll('[data-bits]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.bits) === bits)));
  }
  node.addEventListener('click', (e) => {
    const t = e.target.closest ? e.target.closest('.qi-chip') : null;
    if (!t) return;
    if (t.classList.contains('qturbo__rot')) rotated = !rotated;
    if (t.dataset.bits) bits = Number(t.dataset.bits);
    draw();
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
