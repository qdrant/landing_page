/*
 * product island: how product quantization compresses a vector.
 *
 * A 16-coordinate vector is cut into sub-vectors. Each sub-vector is replaced by
 * one byte: the id of its nearest centroid in a codebook of 256 centroids
 * learned from your data. How many coordinates share a byte sets the ratio:
 * 1 -> x4, 2 -> x8, 4 -> x16, 16 -> x64 (a float32 coordinate is 4 bytes).
 * The centroid ids shown are illustrative.
 */

export const RATIOS = [
  { id: 4, label: 'x4', per: 1 },
  { id: 8, label: 'x8', per: 2 },
  { id: 16, label: 'x16', per: 4 },
  { id: 64, label: 'x64', per: 16 },
];
const D = 16;
const VB_W = 760;
const VB_H = 290;
const X0 = 36;
const PITCH = 42;
const CELL = 38;

const centroidId = (g, per) => (g * 97 + per * 31 + 41) % 256;

export function statusText(ratio) {
  const r = RATIOS.find((x) => x.id === ratio) || RATIOS[1];
  const groups = D / r.per;
  const plural = r.per === 1 ? 'coordinate' : 'coordinates';
  return `At ${r.label}, ${r.per} ${plural} share each byte. The ${D}-coordinate vector becomes ${groups} ${groups === 1 ? 'byte' : 'bytes'}, ${groups * 8} bits instead of ${D * 32}. The codebook is learned from your data.`;
}

export function render(ratio) {
  const r = RATIOS.find((x) => x.id === ratio) || RATIOS[1];
  const groups = D / r.per;
  const out = [`<text class="qprod-h" x="0" y="14">illustrative float32 vector, ${D} coordinates, ${D * 32} bits</text>`];
  for (let i = 0; i < D; i++) {
    out.push(`<rect class="qprod-cell" x="${X0 + i * PITCH}" y="24" width="${CELL}" height="28" rx="4"/>`);
  }
  out.push(`<text class="qprod-h" x="0" y="96">Each sub-vector becomes the id of its nearest centroid (example ids)</text>`);
  for (let g = 0; g < groups; g++) {
    const x = X0 + g * r.per * PITCH;
    const w = r.per * PITCH - (PITCH - CELL);
    out.push(
      `<path class="qprod-brace" d="M${x} 60 v6 h${w} v-6"/>`,
      `<rect class="qprod-byte" x="${x}" y="106" width="${w}" height="30" rx="4"/>`,
      `<text class="qprod-num" x="${x + w / 2}" y="126" text-anchor="middle">#${centroidId(g, r.per)}</text>`,
    );
  }
  out.push(`<text class="qprod-h" x="0" y="170">Codebook: 256 centroids per sub-vector, one byte each</text>`);
  const full = 610;
  const bits = groups * 8;
  out.push(
    `<text class="qprod-h" x="0" y="214">float32</text>`,
    `<rect class="qprod-bar is-full" x="86" y="200" width="${full - 50}" height="18" rx="3"/>`,
    `<text class="qprod-h" x="${86 + full - 50 + 10}" y="214">${D * 32} bit</text>`,
    `<text class="qprod-h" x="0" y="262">PQ ${r.label}</text>`,
    `<rect class="qprod-bar" x="86" y="248" width="${Math.max(3, ((full - 50) * bits) / (D * 32))}" height="18" rx="3"/>`,
    `<text class="qprod-h" x="${86 + Math.max(3, ((full - 50) * bits) / (D * 32)) + 10}" y="262">${bits} bit, ${r.id}× smaller</text>`,
  );
  return out.join('');
}

export function mount(node) {
  node.classList.add('qprod');
  let ratio = 8;
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls"><div class="qi-group" role="group" aria-label="Compression ratio">',
    RATIOS.map((r) => `<button type="button" class="qi-chip" data-ratio="${r.id}" aria-pressed="false">${r.label}</button>`).join(''),
    '  </div></div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-status--2 qprod__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qprod__status');
  function draw() {
    svg.innerHTML = render(ratio);
    status.textContent = statusText(ratio);
    svg.setAttribute('aria-label', `Product quantization of a 16-coordinate vector. ${statusText(ratio)}`);
    node.querySelectorAll('[data-ratio]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ratio) === ratio)));
  }
  node.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-ratio]') : null;
    if (b) { ratio = Number(b.dataset.ratio); draw(); }
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
