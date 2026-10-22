/*
 * filter-order island — replaces pre-filtering.png and post-filtering.png.
 *
 * The five laptops from the guide's basic example, ranked by cosine similarity
 * to the query [0.2, 0.1, 0.9, 0.7] (scores measured on Qdrant 1.19.2):
 * $899.99 (0.927), $1299.99 (0.914), $799.99 (0.900), $1099.99 (0.889),
 * $949.99 (0.881). The filter is price <= $1000.
 *   Post-filtering: take the top 3, then filter. $1299.99 fails, so only two
 *   results come back.
 *   Pre-filtering: filter first, then score the matches. All three results fit.
 *
 * Static; drawn in the style of the CTO-validated quantization islands
 * (bit-depth): muted mono captions, rounded cells with the shared cell stroke,
 * cyan for points that pass the filter, Qdrant red for the lost result.
 *
 * Two drawings of the same content: a wide one for the article column and a
 * compact one for phones (like the repairs island), switched by a container
 * query in index.css so labels stay readable instead of shrinking.
 */

// Ranked by similarity to the query, most similar first.
const LAPTOPS = [
  { price: '$899.99', pass: true },
  { price: '$1299.99', pass: false },
  { price: '$799.99', pass: true },
  { price: '$1099.99', pass: false },
  { price: '$949.99', pass: true },
];

const LAYOUTS = {
  wide: {
    w: 700, h: 286, pitch: 112, cellW: 104, cellH: 30, postY: 64, preY: 178, resultX: 700, resultDy: 20,
    postCaption: 'Post-filtering · top 3 by similarity, then price ≤ $1000',
    preCaption: 'Pre-filtering · price ≤ $1000 first, then score the matches',
    ranked: true, legendCols: true,
  },
  narrow: {
    w: 340, h: 316, pitch: 68, cellW: 62, cellH: 26, postY: 50, preY: 166, resultX: 0, resultDy: 64,
    postCaption: 'Post-filtering · top 3, then filter',
    preCaption: 'Pre-filtering · filter, then score',
    ranked: false, legendCols: false,
  },
};

function cell(L, i, y, state) {
  const x = i * L.pitch;
  const cls = `qi-fo__cell qi-fo__cell--${state === 'lost' ? 'fail' : state}`;
  const parts = [
    `<rect class="${cls}" x="${x}" y="${y}" width="${L.cellW}" height="${L.cellH}" rx="3"/>`,
    `<text class="qi-label qi-label--strong" x="${x + L.cellW / 2}" y="${y + L.cellH + 16}" text-anchor="middle">${LAPTOPS[i].price}</text>`,
  ];
  if (state === 'lost') {
    parts.push(`<path class="qi-fo__lost" d="M${x + 7} ${y + 6} L${x + L.cellW - 7} ${y + L.cellH - 6} M${x + L.cellW - 7} ${y + 6} L${x + 7} ${y + L.cellH - 6}"/>`);
  }
  return parts.join('');
}

function result(L, y, text, lost) {
  const anchor = L.resultX ? 'end' : 'start';
  return `<text class="qi-label ${lost ? 'qi-fo__result--lost' : 'qi-label--strong'}" x="${L.resultX}" y="${y + L.resultDy}" text-anchor="${anchor}">${text}</text>`;
}

function legend(L) {
  const items = [['pass', 'passes the filter'], ['fail', 'fails the filter'], ['out', 'not retrieved']];
  return items.map(([k, t], i) => {
    const x = L.legendCols ? i * 200 : 0;
    const y = L.legendCols ? L.h - 14 : L.h - 54 + i * 20;
    return `<rect class="qi-fo__cell qi-fo__cell--${k}" x="${x}" y="${y - 11}" width="22" height="14" rx="3"/><text class="qi-label" x="${x + 30}" y="${y}">${t}</text>`;
  }).join('');
}

function drawing(name) {
  const L = LAYOUTS[name];
  const y1 = L.postY;
  const y2 = L.preY;
  const top3 = 3 * L.pitch - (L.pitch - L.cellW);
  const post = LAPTOPS.map((l, i) => cell(L, i, y1, i < 3 ? (l.pass ? 'pass' : 'lost') : 'out')).join('');
  const pre = LAPTOPS.map((l, i) => cell(L, i, y2, l.pass ? 'pass' : 'fail')).join('');
  return `
  <svg class="qi-svg qi-fo__svg qi-fo__svg--${name}" viewBox="0 0 ${L.w} ${L.h}" role="img"
    aria-label="Five laptops ranked by similarity: 899.99, 1299.99, 799.99, 1099.99, and 949.99 dollars. Post-filtering takes the top 3 and then drops the 1299.99 laptop, returning 2 of 3 results. Pre-filtering keeps the three laptops under 1000 dollars and returns all 3.">
    ${L.ranked ? `<text class="qi-label" x="${5 * L.pitch - 8}" y="14" text-anchor="end">most similar first →</text>` : ''}
    <text class="qi-label" x="0" y="14">${L.postCaption}</text>
    <path class="qi-fo__bracket" d="M0 ${y1 - 10} V${y1 - 16} H${top3} V${y1 - 10}"/>
    <text class="qi-label" x="${top3 / 2}" y="${y1 - 22}" text-anchor="middle">top 3</text>
    ${post}
    ${result(L, y1, '2 of 3', true)}
    <text class="qi-label" x="0" y="${y2 - 22}">${L.preCaption}</text>
    ${pre}
    ${result(L, y2, '3 of 3', false)}
    ${legend(L)}
  </svg>`;
}

export function mount(node) {
  node.classList.add('qi-fo');
  node.innerHTML = `<div class="qi-fig">${drawing('wide')}${drawing('narrow')}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
