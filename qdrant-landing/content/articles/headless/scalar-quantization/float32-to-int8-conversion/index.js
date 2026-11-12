/*
 * float32-to-int8-conversion island — theme-aware replacement for
 * float32-to-int8-conversion.png.
 *
 * Drawn in the style of the CTO-validated bit-depth island. The float32 range
 * kept by quantile 0.99, [-2.0, +5.0], is a row of Neon Blue cells shaded from
 * low to high value. It maps linearly onto the 256 values of an 8-bit integer,
 * a row of cyan cells: [-128, +127] for int8 or [0, 255] for uint8. Dashed
 * guides tie the ends together, so -2.0 becomes -128 (or 0) and +5.0 becomes
 * +127 (or 255). Cells are illustrative.
 */

const VB_W = 700;
const VB_H = 236;
const CELLS = 16;
const X0 = 70;
const X1 = 688;
const PITCH = (X1 - X0) / CELLS;
const CELL = PITCH - 4;
const ROWS = [
  { y: 28, caption: 'float32 · range kept by quantile 0.99', tag: 'f32', lo: '-2.0', hi: '+5.0', float: true },
  { y: 108, caption: 'int8 · 256 values', tag: 'i8', lo: '-128', hi: '+127' },
  { y: 180, caption: 'or uint8 · 256 values', tag: 'u8', lo: '0', hi: '+255' },
];

function row(r) {
  const cells = Array.from({ length: CELLS }, (_, i) => {
    const fill = r.float ? ` fill="var(--sq-shade-${1 + Math.floor((i / CELLS) * 5)})"` : '';
    const cls = r.float ? 'qi-sq__cell' : 'qi-sq__cell qi-sq__cell--int';
    return `<rect class="${cls}" x="${(X0 + i * PITCH).toFixed(2)}" y="${r.y}" width="${CELL.toFixed(2)}" height="24" rx="3"${fill}/>`;
  }).join('');
  return `
    <text class="qi-label" x="${X0}" y="${r.y - 8}">${r.caption}</text>
    <text class="qi-label qi-label--strong" x="0" y="${r.y + 17}">${r.tag}</text>
    ${cells}
    <text class="qi-label qi-label--strong" x="${X0}" y="${r.y + 42}">${r.lo}</text>
    <text class="qi-label qi-label--strong" x="${X1 - 4}" y="${r.y + 42}" text-anchor="end">${r.hi}</text>`;
}

export function mount(node) {
  node.classList.add('qi-sq');
  node.innerHTML = `
<div class="qi-fig">
  <svg class="qi-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"
    aria-label="The float32 range from -2.0 to +5.0, which quantile 0.99 keeps, maps linearly onto signed int8 from -128 to +127, or onto unsigned uint8 from 0 to +255.">
    <line class="qi-sq__guide" x1="${X0 - 6}" y1="22" x2="${X0 - 6}" y2="${VB_H - 6}"/>
    <line class="qi-sq__guide" x1="${X1 + 2}" y1="22" x2="${X1 + 2}" y2="${VB_H - 6}"/>
    ${ROWS.map(row).join('')}
  </svg>
</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
