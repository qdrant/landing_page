/*
 * int8-value-range island — theme-aware replacement for int8-value-range.png.
 *
 * Drawn in the style of the CTO-validated bit-depth island: each 8-bit type is
 * a row of cyan cells under a muted caption. One byte holds 256 values: int8
 * spans [-128, +127] and uint8 spans [0, 255]. The 16 cells per row stand for
 * the 256 values, as in the original figure.
 */

const VB_W = 700;
const VB_H = 92;
const CELLS = 16;
const CELL = 18;
const PITCH = 21;
const ROW_W = CELLS * PITCH - (PITCH - CELL); // 333
const ROW_Y = 26;
const ROWS = [
  { x: 0, caption: 'int8 · signed · 256 values', lo: '-128', hi: '+127' },
  { x: VB_W - ROW_W, caption: 'uint8 · unsigned · 256 values', lo: '0', hi: '+255' },
];

function row(r) {
  const cells = Array.from({ length: CELLS }, (_, i) =>
    `<rect class="qi-sq__cell qi-sq__cell--int" x="${r.x + i * PITCH}" y="${ROW_Y}" width="${CELL}" height="24" rx="3"/>`).join('');
  return `
    <text class="qi-label" x="${r.x}" y="14">${r.caption}</text>
    ${cells}
    <text class="qi-label qi-label--strong" x="${r.x}" y="${ROW_Y + 44}">${r.lo}</text>
    <text class="qi-label qi-label--strong" x="${r.x + ROW_W}" y="${ROW_Y + 44}" text-anchor="end">${r.hi}</text>`;
}

export function mount(node) {
  node.classList.add('qi-sq');
  node.innerHTML = `
<div class="qi-fig">
  <svg class="qi-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"
    aria-label="Two 8-bit integer types of 256 values each: signed int8 from -128 to +127, and unsigned uint8 from 0 to +255.">
    ${ROWS.map(row).join('')}
  </svg>
</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
