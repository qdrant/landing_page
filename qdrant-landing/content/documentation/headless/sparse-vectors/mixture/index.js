/*
 * sparse-vectors mixture island: editable, theme-aware replacement for
 * mixture.jpg. Dense and sparse result scores sit on number lines, get
 * normalized, then fuse into one mixture line. Dot positions are illustrative.
 */

const D = 'dense';
const S = 'sparse';

// Rows: [label lines, kind, line y, line x1, line x2, dots [cx, kind]]
const ROWS = [
  [['Dense', 'Results'], D, 55, 196, 528, [[227, D], [250, D], [281, D]]],
  [['Sparse', 'Results'], S, 103, 196, 528, [[307, S], [332, S], [505, S]]],
  [['Dense', 'Results'], D, 220, 192, 535, [[227, D], [356, D], [406, D]]],
  [['Sparse', 'Results'], S, 269, 195, 534, [[265, S], [332, S], [473, S]]],
  [['Mixture'], 'mix', 382, 195, 531, [[227, D], [265, S], [332, S], [356, D], [406, D], [473, S]]],
];

// Arrows: [label, x, y1, y2]
const ARROWS = [
  ['Normalization', 329, 141, 191],
  ['Fusion', 329, 310, 361],
];

function row([label, kind, y, x1, x2, dots]) {
  // em-based offsets keep two-line labels centered on the line at any font size
  const tspans = label
    .map((t, i) => `<tspan x="176" dy="${label.length === 1 ? 0.35 : i ? 1.1 : -0.2}em">${t}</tspan>`)
    .join('');
  return [
    `<text class="qi-mix__label qi-mix__label--${kind}" y="${y}">${tspans}</text>`,
    `<line class="qi-mix__axis" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`,
    ...dots.map(([cx, k]) => `<circle class="qi-mix__dot qi-mix__dot--${k}" cx="${cx}" cy="${y}" r="8"/>`),
  ].join('');
}

function arrow([label, x, y1, y2]) {
  return [
    `<line class="qi-mix__arrow" x1="${x}" y1="${y1}" x2="${x}" y2="${y2 - 6}"/>`,
    `<path class="qi-mix__arrowhead" d="M ${x - 6} ${y2 - 8} L ${x + 6} ${y2 - 8} L ${x} ${y2} z"/>`,
    `<text class="qi-mix__step" x="${x + 21}" y="${(y1 + y2) / 2}" dy="0.35em">${label}</text>`,
  ].join('');
}

export function mount(node) {
  node.classList.add('qi-mix');
  node.innerHTML =
    '<svg class="qi-svg qi-mix__svg" viewBox="0 0 630 423" role="img" ' +
    'aria-label="Dense and sparse result scores on separate number lines are normalized to a common scale, then fused into one mixture line that interleaves both.">' +
    ROWS.map(row).join('') +
    ARROWS.map(arrow).join('') +
    '</svg>';
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
