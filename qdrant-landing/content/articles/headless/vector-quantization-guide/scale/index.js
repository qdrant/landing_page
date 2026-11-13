/*
 * scale island: why quantization matters, in bytes.
 *
 * Pick the dimensions of your embeddings, the number of vectors, and the RAM
 * you have. The bars show what the vectors alone take as float32 and under each
 * quantized copy, and which of them fit in that RAM.
 *
 * Everything is arithmetic, nothing is measured here:
 *   float32   vectors x dimensions x 4 bytes
 *   copy      float32 divided by the method's compression ratio
 *             (scalar int8 4x, TurboQuant 4-bit and product x8 8x, binary 1-bit 32x)
 * Sizes exclude the HNSW graph, payloads, and replicas. The guide's measured
 * heap on Quora is within 5 to 10% of these ratios.
 *
 * render() and statusText() are pure and exported so the static fallback image
 * can be generated from the same code. mount() only wires the controls.
 */

export const DIMS = [384, 768, 1024, 1536, 3072];
export const COUNTS = [
  { id: 1e6, label: '1M' },
  { id: 1e7, label: '10M' },
  { id: 1e8, label: '100M' },
  { id: 1e9, label: '1B' },
];
export const RAMS = [
  { id: 16e9, label: '16 GB' },
  { id: 64e9, label: '64 GB' },
  { id: 256e9, label: '256 GB' },
  { id: 1e12, label: '1 TB' },
];
export const DEFAULTS = { dims: 1536, count: 1e8, ram: 256e9 };

export const ROWS = [
  { id: 'f32', name: 'float32 originals', ratio: 1 },
  { id: 'sq', name: 'Scalar int8 · 4×', ratio: 4 },
  { id: 'tq', name: 'TurboQuant 4-bit or product x8 · 8×', ratio: 8 },
  { id: 'bq', name: 'Binary 1-bit · 32×', ratio: 32 },
];

const VB_W = 760;
const VB_H = 236;
const BAR_X = 322;
const BAR_MAX = 290;
const ROW_Y0 = 46;
const ROW_PITCH = 46;

const fmt = (n) => n.toLocaleString('en-US');
const times = (x) => (x >= 10 ? fmt(Math.round(x)) : x.toFixed(1));

export function fmtBytes(b) {
  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e10) return `${Math.round(b / 1e9)} GB`;
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  return `${Math.round(b / 1e6)} MB`;
}

export function sizes(dims, count) {
  const f32 = count * dims * 4;
  return ROWS.map((r) => ({ ...r, bytes: f32 / r.ratio, perVector: (dims * 4) / r.ratio }));
}

export function statusText(dims, count, ram) {
  const rows = sizes(dims, count);
  const f32 = rows[0].bytes;
  const countLabel = COUNTS.find((c) => c.id === count).label;
  const ramLabel = RAMS.find((r) => r.id === ram).label;
  const head = `${countLabel} vectors at ${fmt(dims)} dimensions take ${fmtBytes(f32)} as float32.`;
  if (f32 <= ram) {
    return `${head} That fits in ${ramLabel} of RAM, and a quantized copy leaves that room for the HNSW graph, payloads, and replicas.`;
  }
    const first = rows.slice(1).find((r) => r.bytes <= ram);
  const over = `That is ${times(f32 / ram)} times the ${ramLabel} of RAM.`;
  if (first) return `${head} ${over} The first copy that fits is ${first.name.split(' · ')[0]} at ${fmtBytes(first.bytes)}.`;
  const last = rows[rows.length - 1];
  return `${head} ${over} Even the 32× copy takes ${fmtBytes(last.bytes)}, ${times(last.bytes / ram)} times the RAM.`;
}

// Returns the inner markup of the SVG (no <svg> wrapper).
export function render(dims, count, ram) {
  const rows = sizes(dims, count);
  // Follow the data unless RAM is close to it, so a huge RAM does not flatten every bar.
  const onScale = ram <= rows[0].bytes * 1.5;
  const max = onScale ? Math.max(rows[0].bytes, ram) : rows[0].bytes;
  const ramX = BAR_X + (ram / max) * BAR_MAX;
  const ramLabel = RAMS.find((r) => r.id === ram).label;
  const out = [];

  out.push('<text class="qscale-h" x="0" y="20">Vectors only, per method</text>');
  if (onScale) {
    const right = ramX > BAR_X + BAR_MAX * 0.6;
    out.push(
      `<text class="qscale-h" x="${right ? ramX - 6 : ramX + 6}" y="20" text-anchor="${right ? 'end' : 'start'}">RAM ${ramLabel}</text>`,
      `<line class="qscale-ram" x1="${ramX.toFixed(1)}" y1="28" x2="${ramX.toFixed(1)}" y2="${ROW_Y0 + ROW_PITCH * rows.length - 8}"/>`,
    );
  } else {
    out.push(`<text class="qscale-h" x="${BAR_X}" y="20">RAM ${ramLabel}, beyond this scale</text>`);
  }

  rows.forEach((r, i) => {
    const y = ROW_Y0 + i * ROW_PITCH;
    const w = Math.max(2, (r.bytes / max) * BAR_MAX);
    const fits = r.bytes <= ram;
    out.push(
      `<text class="qscale-name" x="0" y="${y + 12}">${r.name}</text>`,
      `<text class="qscale-sub" x="0" y="${y + 30}">${fmt(r.perVector)} bytes per vector</text>`,
      `<rect class="qscale-bar ${fits ? 'is-fit' : 'is-over'}" x="${BAR_X}" y="${y}" width="${w.toFixed(1)}" height="20" rx="2"/>`,
      `<text class="qscale-num ${fits ? '' : 'is-over'}" x="${BAR_X + BAR_MAX + 14}" y="${y + 15}">${fmtBytes(r.bytes)}${fits ? '' : '  exceeds'}</text>`,
    );
  });
  return out.join('');
}

export function mount(node) {
  node.classList.add('qscale');
  let { dims, count, ram } = DEFAULTS;

  const group = (label, attr, items, fmtItem) =>
    `<div class="qi-group" role="group" aria-label="${label}">` +
    items.map((v) => `<button type="button" class="qi-chip" data-${attr}="${v.id ?? v}" aria-pressed="false">${fmtItem(v)}</button>`).join('') +
    '</div>';

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    group('Embedding dimensions', 'dims', DIMS, (v) => fmt(v)),
    group('Number of vectors', 'count', COUNTS, (v) => v.label),
    group('RAM available', 'ram', RAMS, (v) => v.label),
    '  </div>',
    `  <svg class="qi-svg qscale__svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qscale__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qscale__svg');
  const status = node.querySelector('.qscale__status');
  const pressed = (attr, value) =>
    node.querySelectorAll(`[data-${attr}]`).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset[attr]) === value)));

  function draw() {
    svg.innerHTML = render(dims, count, ram);
    const text = statusText(dims, count, ram);
    status.textContent = text;
    svg.setAttribute('aria-label', `Memory needed for the vectors alone under each method. ${text}`);
    pressed('dims', dims);
    pressed('count', count);
    pressed('ram', ram);
  }

  node.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('.qi-chip') : null;
    if (!b) return;
    if (b.dataset.dims) dims = Number(b.dataset.dims);
    if (b.dataset.count) count = Number(b.dataset.count);
    if (b.dataset.ram) ram = Number(b.dataset.ram);
    draw();
  });

  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
