/*
 * scalar island: how scalar quantization turns float32 coordinates into int8.
 *
 * One illustrative 12-coordinate vector with one outlier. Each coordinate is
 * mapped linearly onto 256 levels between a low and a high bound and stored as
 * an int8 code (-128 to 127). With the whole range the outlier stretches the
 * bounds, so every level covers a wider slice of values; with the outlier
 * clipped (the effect of `quantile`) the levels get finer for typical values and
 * the outlier pays. The values are illustrative, not measured.
 *
 * encode(), render() and statusText() are pure and exported so the static
 * fallback image can be generated from the same code.
 */

export const VALUES = [0.31, -0.52, 0.08, 0.74, -0.19, 0.45, -0.88, 0.12, 0.63, -0.34, 0.27, 2.9];
const RANGES = { whole: [-0.88, 2.9], clip: [-0.9, 0.9] };
export const MODES = [
  { id: 'whole', label: 'Whole range' },
  { id: 'clip', label: 'Clip outliers (quantile)' },
];

const VB_W = 760;
const VB_H = 286;
const X0 = 112;
const PITCH = 54;
const CELL = 48;

export function encode(mode) {
  const [lo, hi] = RANGES[mode] || RANGES.whole;
  const step = (hi - lo) / 255;
  const cols = VALUES.map((x) => {
    const q = Math.round((Math.min(hi, Math.max(lo, x)) - lo) / step);
    const dec = lo + q * step;
    return { x, code: q - 128, dec, err: Math.abs(x - dec) };
  });
  return { lo, hi, step, cols };
}

const f2 = (v) => v.toFixed(2);

export function statusText(mode) {
  const { step, cols } = encode(mode);
  const typical = cols.slice(0, -1);
  const mean = typical.reduce((a, c) => a + c.err, 0) / typical.length;
  const out = cols[cols.length - 1];
  const tail =
    mode === 'clip'
      ? ` The outlier is clipped to the top level and decodes as ${f2(out.dec)} instead of ${f2(out.x)}, an error of ${f2(out.err)}.`
      : ` The outlier fits, but it stretches the range, so every level covers a wider slice of values.`;
  return `One level is ${step.toFixed(4)} wide. The 11 typical values are off by ${mean.toFixed(4)} on average.${tail}`;
}

export function render(mode) {
  const { cols } = encode(mode);
  const out = [];
  const rows = [
    { label: 'float32', y: 24, text: (c) => f2(c.x) },
    { label: 'int8 code', y: 66, text: (c) => String(c.code) },
    { label: 'decoded', y: 108, text: (c) => f2(c.dec) },
    { label: 'error', y: 150, text: (c) => f2(c.err) },
  ];
  rows.forEach((r) => {
    out.push(`<text class="qscalar-h" x="0" y="${r.y + 20}">${r.label}</text>`);
    cols.forEach((c, i) => {
      const hot = mode === 'clip' && i === cols.length - 1;
      const big = r.label === 'error' && c.err > 0.5;
      out.push(
        `<rect class="qscalar-cell${hot ? ' is-hot' : ''}" x="${X0 + i * PITCH}" y="${r.y}" width="${CELL}" height="30" rx="4"/>`,
        `<text class="qscalar-num${big ? ' is-over' : ''}" x="${X0 + i * PITCH + CELL / 2}" y="${r.y + 20}" text-anchor="middle">${r.text(c)}</text>`,
      );
    });
  });
  const full = 540;
  const bits = cols.length * 32;
  out.push(
    `<text class="qscalar-h" x="0" y="226">float32</text>`,
    `<rect class="qscalar-bar is-full" x="${X0}" y="212" width="${full}" height="18" rx="3"/>`,
    `<text class="qscalar-h" x="${X0 + full + 10}" y="226">${bits} bit</text>`,
    `<text class="qscalar-h" x="0" y="262">int8</text>`,
    `<rect class="qscalar-bar" x="${X0}" y="248" width="${full / 4}" height="18" rx="3"/>`,
    `<text class="qscalar-h" x="${X0 + full / 4 + 10}" y="262">${bits / 4} bit, 4× smaller</text>`,
  );
  return out.join('');
}

export function mount(node) {
  node.classList.add('qscalar');
  let mode = 'whole';
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls"><div class="qi-group" role="group" aria-label="Range">',
    MODES.map((m) => `<button type="button" class="qi-chip" data-mode="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '  </div></div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-status--2 qscalar__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qscalar__status');
  function draw() {
    svg.innerHTML = render(mode);
    status.textContent = statusText(mode);
    svg.setAttribute('aria-label', `One vector of 12 float32 coordinates stored as int8 codes. ${statusText(mode)}`);
    node.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }
  node.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-mode]') : null;
    if (b) { mode = b.dataset.mode; draw(); }
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
