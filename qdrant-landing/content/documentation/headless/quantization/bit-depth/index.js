/*
 * bit-depth island — interactive replacement for 2-bit-quantization.png.
 *
 * Illustrates how binary quantization encodes a float32 vector at 1, 1.5 and
 * 2 bits per dimension. The left column shows one vector: its float
 * components, the resulting bits, and the storage bars (512 bit -> 16/24/32
 * bit). The right column shows the distribution of component values with the
 * thresholds that split it into buckets: two for 1 bit (sign only), three for
 * 2 bit (-1 / 0 / 1, so values near zero are not a coin-flip sign). At 1.5 bit
 * two neighbouring values share their "+1" bit, so a pair costs 3 bits.
 * Hover (or click to pin) a component to trace it through the encoding, or
 * hover a histogram bin / bucket band to see which components fall there.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss); the data
 * palette (blues for buckets, teal for bits) is constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';

const D = 16; // dimensions in the sample vector
const SIGMA = 1; // 2-bit thresholds at ±σ (the zero bucket lies between)
const RANGE = 3; // histogram spans [-RANGE, RANGE]

const MODES = [
  { id: 'one', label: '1 bit', short: '1 bit', bpd: 1, ratio: 32 },
  { id: 'half', label: '1.5 bit', short: '1.5 bit', bpd: 1.5, ratio: 24 },
  { id: 'two', label: '2 bit', short: '2 bit', bpd: 2, ratio: 16 },
];

// Geometry (viewBox 760 x 266). Left column: the vector. Right: distribution.
const VB_W = 760;
const VB_H = 266;
const CELL = 21;
const PITCH = 25;
const LEFT_W = D * PITCH - (PITCH - CELL); // 396
const FLOAT_Y = 22;
const BITS_Y = 88;
const ROW_H = 24;
const BAR_FLOAT_Y = 152;
const BAR_Q_Y = 188;
const BAR_H = 12;

const BINS = 12;
const BIN_PITCH = 22;
const SQ = 18;
const HX0 = 470;
const HW = BINS * BIN_PITCH; // 264
const BASE_Y = 210;
const SQ_PITCH = 20;
const BAND_Y = 224;
const BAND_H = 12;
const BAND_LABEL_Y = 254;

// Data palette (constant across themes): light blue (-1) -> dark navy (+1).
const SHADE_STEPS = 5; // discrete palette steps for the float-cell shade ramp

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box-Muller, clipped to the histogram range.
function gaussian(rnd) {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-RANGE + 0.05, Math.min(RANGE - 0.05, g));
}

// Shade over ±2 (not the full ±3 range) so typical values keep contrast.
// Stepped rather than interpolated: lerping between two palette endpoints put
// almost every cell on a colour outside the palette, so the value picks one of
// the --bd-shade-N entries instead.
function shade(v) {
  const t = Math.max(0, Math.min(1, (v + 2) / 4));
  return `var(--bd-shade-${1 + Math.min(SHADE_STEPS - 1, Math.floor(t * SHADE_STEPS))})`;
}

function fmt(v, digits = 2) {
  return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(digits);
}

// Bucket of a value under the current mode: -1 | 0 | 1 (1-bit has no 0 bucket).
function bucketOf(v, mode) {
  if (mode.id === 'one') return v > 0 ? 1 : -1;
  if (v <= -SIGMA) return -1;
  if (v >= SIGMA) return 1;
  return 0;
}

// Two-bit code of a bucket, as written in the docs: -1 -> 00, 0 -> 01, 1 -> 11.
function twoBits(b) {
  return [b === 1, b >= 0];
}

function xOfValue(v) {
  return HX0 + ((v + RANGE) / (2 * RANGE)) * HW;
}

export function mount(node) {
  node.classList.add('qi-bd');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Bits per dimension">',
    MODES.map(
      (m) =>
        `<button type="button" class="qi-chip qi-bd__seg-btn" data-mode="${m.id}" aria-pressed="false">` +
        `${m.label}<small>${m.ratio}×</small></button>`,
    ).join(''),
    '    </div>',
    '    <button type="button" class="qi-chip qi-bd__shuffle">',
    '      <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>New vector',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-bd__svg" viewBox="-3 0 ${VB_W + 6} ${VB_H}" role="img"`,
    '    aria-label="A float vector encoded with 1, 1.5 or 2 bits per dimension, next to the distribution of its component values split into buckets by thresholds.">',
    // Left column: the vector
    `    <text class="qi-label" x="0" y="14">Float vector · 32 bit / dim</text>`,
    '    <g class="qi-bd__floats"></g>',
    `    <text class="qi-label qi-bd__bits-label" x="0" y="80"></text>`,
    '    <g class="qi-bd__bits"></g>',
    `    <text class="qi-label" x="0" y="${BAR_FLOAT_Y - 6}">Storage per vector</text>`,
    `    <rect class="qi-bd__bar qi-bd__bar--float" x="0" y="${BAR_FLOAT_Y}" width="${LEFT_W}" height="${BAR_H}" rx="3"/>`,
    `    <text class="qi-label" x="${LEFT_W}" y="${BAR_FLOAT_Y + BAR_H + 13}" text-anchor="end">float32 · ${D} × 32 = ${D * 32} bit</text>`,
    `    <rect class="qi-bd__bar qi-bd__bar--q" x="0" y="${BAR_Q_Y}" width="0" height="${BAR_H}" rx="3"/>`,
    `    <text class="qi-label qi-bd__bar-text--q" x="0" y="${BAR_Q_Y + BAR_H + 13}"></text>`,
    // Right column: distribution + thresholds + buckets
    `    <text class="qi-label" x="${HX0}" y="14">Distribution of component values</text>`,
    '    <g class="qi-bd__hist"></g>',
    `    <line class="qi-axis" x1="${HX0 - 6}" y1="${BASE_Y}" x2="${HX0 + HW + 6}" y2="${BASE_Y}"/>`,
    '    <g class="qi-bd__thresholds"></g>',
    '    <g class="qi-bd__bands"></g>',
    `    <polygon class="qi-bd__marker" points="0,0 -6,10 6,10" style="display:none"/>`,
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-bd__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const floatsG = node.querySelector('.qi-bd__floats');
  const bitsG = node.querySelector('.qi-bd__bits');
  const bitsLabel = node.querySelector('.qi-bd__bits-label');
  const histG = node.querySelector('.qi-bd__hist');
  const thrG = node.querySelector('.qi-bd__thresholds');
  const bandsG = node.querySelector('.qi-bd__bands');
  const marker = node.querySelector('.qi-bd__marker');
  const barQ = node.querySelector('.qi-bd__bar--q');
  const barQText = node.querySelector('.qi-bd__bar-text--q');
  const statusEl = node.querySelector('.qi-bd__status');
  const segBtns = [...node.querySelectorAll('.qi-bd__seg-btn')];
  const shuffleBtn = node.querySelector('.qi-bd__shuffle');

  // --- Static histogram: a bell of stacked squares, colored by bucket. ---
  const binSquares = []; // per bin: array of rects
  for (let b = 0; b < BINS; b++) {
    const center = -RANGE + (b + 0.5) * ((2 * RANGE) / BINS);
    const n = Math.max(1, Math.round(8 * Math.exp(-(center * center) / 2)));
    const x = HX0 + b * BIN_PITCH + (BIN_PITCH - SQ) / 2;
    const rects = [];
    for (let k = 0; k < n; k++) {
      const r = el('rect', { class: 'qi-bd__sq', x, y: BASE_Y - 3 - (k + 1) * SQ_PITCH + (SQ_PITCH - SQ), width: SQ, height: SQ, rx: 2, 'data-bin': b });
      rects.push(r);
      histG.appendChild(r);
    }
    binSquares.push({ center, rects });
  }

  // --- The float cells (one per dimension). ---
  const floatRects = [];
  for (let i = 0; i < D; i++) {
    const r = el('rect', { class: 'qi-bd__cell', x: i * PITCH, y: FLOAT_Y, width: CELL, height: ROW_H, rx: 3, 'data-index': i });
    floatRects.push(r);
    floatsG.appendChild(r);
  }

  let rnd = mulberry32(2024);
  let values = [];
  let mode = MODES[2];
  let hovered = null;
  let pinned = null;

  function regenerate() {
    values = [];
    for (let i = 0; i < D; i++) values.push(gaussian(rnd));
  }

  function bitCellsFor(i) {
    return [...bitsG.querySelectorAll(`[data-index~="${i}"]`)];
  }

  function renderBits() {
    bitsG.replaceChildren();
    bitsLabel.textContent = `Binary vector · ${mode.short} / dim`;
    const on = (b) => (b ? ' is-on' : '');

    if (mode.id === 'one') {
      values.forEach((v, i) => {
        bitsG.appendChild(
          el('rect', { class: `qi-bd__bit${on(v > 0)}`, x: i * PITCH, y: BITS_Y, width: CELL, height: ROW_H, rx: 3, 'data-index': i }),
        );
      });
    } else if (mode.id === 'two') {
      const w = (CELL - 3) / 2;
      values.forEach((v, i) => {
        const [hi, lo] = twoBits(bucketOf(v, mode));
        bitsG.appendChild(el('rect', { class: `qi-bd__bit${on(hi)}`, x: i * PITCH, y: BITS_Y, width: w, height: ROW_H, rx: 2, 'data-index': i }));
        bitsG.appendChild(el('rect', { class: `qi-bd__bit${on(lo)}`, x: i * PITCH + w + 3, y: BITS_Y, width: w, height: ROW_H, rx: 2, 'data-index': i }));
      });
    } else {
      // 1.5 bit: each value keeps its own "not −1" bit; the pair shares one "+1" bit (OR).
      const pairW = PITCH + CELL; // 46
      const w = (pairW - 6) / 3;
      for (let i = 0; i < D; i += 2) {
        const j = Math.min(i + 1, D - 1);
        const [hiI, loI] = twoBits(bucketOf(values[i], mode));
        const [hiJ, loJ] = twoBits(bucketOf(values[j], mode));
        const x0 = i * PITCH;
        bitsG.appendChild(el('rect', { class: `qi-bd__bit${on(loI)}`, x: x0, y: BITS_Y, width: w, height: ROW_H, rx: 2, 'data-index': `${i}` }));
        bitsG.appendChild(
          el('rect', { class: `qi-bd__bit qi-bd__bit--shared${on(hiI || hiJ)}`, x: x0 + w + 3, y: BITS_Y, width: w, height: ROW_H, rx: 2, 'data-index': `${i} ${j}` }),
        );
        bitsG.appendChild(el('rect', { class: `qi-bd__bit${on(loJ)}`, x: x0 + 2 * (w + 3), y: BITS_Y, width: w, height: ROW_H, rx: 2, 'data-index': `${j}` }));
      }
    }
    // Storage bar for the quantized vector.
    const bits = D * mode.bpd;
    barQ.setAttribute('width', Math.max(4, (LEFT_W * bits) / (D * 32)));
    barQText.textContent = `${mode.short} · ${D} × ${mode.bpd} = ${bits} bit (${mode.ratio}×)`;
  }

  function renderDistribution() {
    const thresholds = mode.id === 'one' ? [0] : [-SIGMA, SIGMA];
    thrG.replaceChildren();
    thresholds.forEach((t) => {
      const x = xOfValue(t);
      thrG.appendChild(el('line', { class: 'qi-bd__threshold', x1: x, y1: 44, x2: x, y2: BASE_Y + 4 }));
      thrG.appendChild(el('text', { class: 'qi-label qi-bd__threshold-label', x, y: 40, 'text-anchor': 'middle' }, t === 0 ? '0' : t < 0 ? '−σ' : '+σ'));
    });

    // Color the bell by bucket.
    binSquares.forEach(({ center, rects }) => {
      const b = bucketOf(center, mode);
      rects.forEach((r) => {
        r.classList.toggle('is-neg', b === -1);
        r.classList.toggle('is-zero', b === 0);
        r.classList.toggle('is-pos', b === 1);
      });
    });

    // Bucket bands with their bit codes.
    bandsG.replaceChildren();
    const edges = [-RANGE, ...thresholds, RANGE];
    for (let k = 0; k < edges.length - 1; k++) {
      const x1 = xOfValue(edges[k]);
      const x2 = xOfValue(edges[k + 1]);
      const b = bucketOf((edges[k] + edges[k + 1]) / 2, mode);
      const cls = b === -1 ? 'is-neg' : b === 0 ? 'is-zero' : 'is-pos';
      bandsG.appendChild(el('rect', { class: `qi-bd__band ${cls}`, x: x1 + 1, y: BAND_Y, width: x2 - x1 - 2, height: BAND_H, rx: 3, 'data-bucket': b }));
      const code = mode.id === 'one' ? (b === 1 ? '1' : '0') : twoBits(b).map((z) => (z ? '1' : '0')).join('');
      const name = b === -1 ? '−1' : b === 0 ? '0' : '+1';
      bandsG.appendChild(el('text', { class: 'qi-label qi-label--strong', x: (x1 + x2) / 2, y: BAND_LABEL_Y, 'text-anchor': 'middle' }, `${name} → ${code}`));
    }
  }

  function renderFloats() {
    values.forEach((v, i) => (floatRects[i].style.fill = shade(v)));
  }

  function bucketName(b) {
    return b === -1 ? '−1' : b === 0 ? '0' : '+1';
  }

  function binOf(v) {
    return Math.min(BINS - 1, Math.max(0, Math.floor(((v + RANGE) / (2 * RANGE)) * BINS)));
  }

  function codeOf(b) {
    return mode.id === 'one' ? (b === 1 ? '1' : '0') : twoBits(b).map((z) => (z ? '1' : '0')).join('');
  }

  function whereOf(v) {
    if (mode.id === 'one') return v > 0 ? 'positive' : 'negative';
    const b = bucketOf(v, mode);
    return b === 0 ? 'within ±σ' : b === 1 ? 'above +σ' : 'below −σ';
  }

  function defaultStatus() {
    const total = D * mode.bpd;
    const tail = `${D * 32} bit → <b>${total} bit</b> per vector, <b>${mode.ratio}×</b> compression.`;
    if (mode.id === 'one') {
      return `<b>1 bit per dimension</b>: only the sign survives, so values near zero become a coin-flip. ${tail}`;
    }
    if (mode.id === 'two') {
      return `<b>2 bits per dimension</b>: three buckets, so values within ±σ are stored as an explicit 0. ${tail}`;
    }
    return `<b>1.5 bits per dimension</b>: the same buckets, but neighbouring values share their +1 bit (dashed cell). ${tail}`;
  }

  // hot: null | { type: 'dim', i } | { type: 'bin', b } | { type: 'bucket', bucket }
  function renderHighlight() {
    const hot = pinned || hovered;
    floatRects.forEach((r) => r.classList.remove('is-hot'));
    bitsG.querySelectorAll('.qi-bd__bit').forEach((r) => r.classList.remove('is-hot'));
    binSquares.forEach(({ rects }) => rects.forEach((r) => r.classList.remove('is-hot')));
    bandsG.querySelectorAll('.qi-bd__band').forEach((r) => r.classList.remove('is-hot'));
    marker.style.display = 'none';

    if (!hot) {
      statusEl.innerHTML = defaultStatus();
      return;
    }

    const markDims = (idxs) => {
      idxs.forEach((i) => {
        floatRects[i].classList.add('is-hot');
        bitCellsFor(i).forEach((r) => r.classList.add('is-hot'));
      });
    };

    if (hot.type === 'dim') {
      const idx = hot.i;
      const v = values[idx];
      markDims([idx]);
      marker.style.display = '';
      marker.setAttribute('transform', `translate(${xOfValue(v)} ${BASE_Y + 1})`);
      binSquares[binOf(v)].rects.forEach((r) => r.classList.add('is-hot'));
      const b = bucketOf(v, mode);
      let tail = '';
      if (mode.id === 'half') {
        const j = idx % 2 === 0 ? Math.min(idx + 1, D - 1) : idx - 1;
        const bj = bucketOf(values[j], mode);
        tail = ` Its pair x<sub>${j + 1}</sub> is ${bucketName(bj)}, so the shared bit is <b>${b === 1 || bj === 1 ? '1' : '0'}</b>.`;
      }
      statusEl.innerHTML = `x<sub>${idx + 1}</sub> = <b>${fmt(v)}</b> is ${whereOf(v)} → bucket <b>${bucketName(b)}</b> → bits <b>${codeOf(b)}</b>.${tail}`;
      return;
    }

    if (hot.type === 'bin') {
      const { center, rects } = binSquares[hot.b];
      rects.forEach((r) => r.classList.add('is-hot'));
      const idxs = values.map((v, i) => (binOf(v) === hot.b ? i : -1)).filter((i) => i >= 0);
      markDims(idxs);
      const half = RANGE / BINS;
      const b = bucketOf(center, mode);
      const count = idxs.length === 0 ? 'None' : idxs.length === 1 ? 'One' : String(idxs.length);
      statusEl.innerHTML =
        `Values from <b>${fmt(center - half, 1)}</b> to <b>${fmt(center + half, 1)}</b> are ${whereOf(center)} → bucket <b>${bucketName(b)}</b> → bits <b>${codeOf(b)}</b>. ` +
        `${count} of the ${D} components fall here${idxs.length === 0 ? ': tail values are rare' : ''}.`;
      return;
    }

    // Whole bucket.
    const bucket = hot.bucket;
    binSquares.forEach(({ center, rects }) => {
      if (bucketOf(center, mode) === bucket) rects.forEach((r) => r.classList.add('is-hot'));
    });
    const band = bandsG.querySelector(`[data-bucket="${bucket}"]`);
    if (band) band.classList.add('is-hot');
    const idxs = values.map((v, i) => (bucketOf(v, mode) === bucket ? i : -1)).filter((i) => i >= 0);
    markDims(idxs);
    const range =
      mode.id === 'one' ? (bucket === 1 ? 'positive values' : 'negative values') : bucket === 0 ? 'values within ±σ' : bucket === 1 ? 'values above +σ' : 'values below −σ';
    statusEl.innerHTML = `Bucket <b>${bucketName(bucket)}</b> holds all ${range} and is stored as bits <b>${codeOf(bucket)}</b>. <b>${idxs.length}</b> of the ${D} components land in it.`;
  }

  function renderAll() {
    renderFloats();
    renderBits();
    renderDistribution();
    renderHighlight();
  }

  function setMode(id) {
    mode = MODES.find((m) => m.id === id) || MODES[2];
    segBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode.id)));
    renderAll();
  }

  segBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  shuffleBtn.addEventListener('click', () => {
    regenerate();
    pinned = null;
    renderAll();
  });

  // Hover / pin: a component (float or bit cell), a histogram bin, or a bucket band.
  const svg = node.querySelector('.qi-bd__svg');
  function hotFromEvent(e) {
    const t = e.target.closest ? e.target.closest('[data-index], [data-bin], [data-bucket]') : null;
    if (!t) return null;
    if (t.hasAttribute('data-index')) return { type: 'dim', i: Number(String(t.getAttribute('data-index')).split(' ')[0]) };
    if (t.hasAttribute('data-bin')) return { type: 'bin', b: Number(t.getAttribute('data-bin')) };
    return { type: 'bucket', bucket: Number(t.getAttribute('data-bucket')) };
  }
  const sameHot = (a, b) => !!a && !!b && a.type === b.type && a.i === b.i && a.b === b.b && a.bucket === b.bucket;
  svg.addEventListener('pointerover', (e) => {
    const h = hotFromEvent(e);
    if (h && !sameHot(h, hovered)) {
      hovered = h;
      renderHighlight();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (hotFromEvent(e)) {
      hovered = null;
      renderHighlight();
    }
  });
  svg.addEventListener('click', (e) => {
    const h = hotFromEvent(e);
    if (!h) return;
    pinned = sameHot(h, pinned) ? null : h;
    renderHighlight();
  });

  regenerate();
  setMode('two');

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
