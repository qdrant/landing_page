/*
 * fusion-signals island — theme-aware replacement for fusion-signals.png.
 *
 * Two panels, three number lines each, for the same four documents. RRF reads
 * only positions, so its dense and sparse rows sit on evenly spaced rank slots
 * and the dense list's wide lead disappears: B wins. DBSF rescales each list
 * onto one shared axis, so the raw spacing survives the sum: A wins.
 *
 * The scores and formulas are the ones in experiments/fusion/
 * figure_fusion_signals.py, which generated the PNG (commit 73a92f7e0). They
 * are illustrative values, not measurements. The fused rows are computed here
 * with Qdrant's own scoring, not traced from the image:
 *   RRF   1 / ((pos + 1) / weight + k - 1), weight 1, k = 2
 *   DBSF  (score - (mean - 3s)) / 6s per list, s = sample std, then summed
 *
 * The panels are separate SVGs in a grid, so below ~780px of rendered width
 * they stack instead of shrinking side by side, and the labels stay legible.
 * No controls: the comparison is the point, so both panels stay visible.
 */

const DOCS = ['A', 'B', 'C', 'D'];
const DENSE = { A: 0.91, B: 0.62, C: 0.58, D: 0.55 };
const SPARSE = { A: 13.6, B: 14.8, C: 14.1, D: 12.9 };
const K = 2;

// Panel geometry (viewBox units). Dots run between X0 and X1.
const VB_W = 400;
const VB_H = 276;
const LABEL_X = 70;
const LINE_X0 = 86;
const LINE_X1 = 392;
const X0 = 98;
const X1 = 380;
const ROWS = { dense: 90, sparse: 168, fused: 252 };

const ranked = (scores) => [...DOCS].sort((a, b) => scores[b] - scores[a]);

function rrfPart(scores) {
  const out = {};
  ranked(scores).forEach((doc, pos) => {
    out[doc] = 1 / ((pos + 1) / 1 + K - 1);
  });
  return out;
}

function dbsfPart(scores) {
  const v = DOCS.map((d) => scores[d]);
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const s = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1));
  const out = {};
  DOCS.forEach((d) => {
    out[d] = (scores[d] - (mean - 3 * s)) / (6 * s);
  });
  return out;
}

const summed = (a, b) => Object.fromEntries(DOCS.map((d) => [d, a[d] + b[d]]));
const winner = (fused) => ranked(fused)[0];

// Evenly spaced slots, rank 1 on the right, so the spacing carries nothing.
function rankSlots(scores) {
  const order = ranked(scores);
  return Object.fromEntries(order.map((d, pos) => [d, (order.length - 1 - pos) / (order.length - 1)]));
}

function rankNotes(scores) {
  return Object.fromEntries(ranked(scores).map((d, pos) => [d, String(pos + 1)]));
}

// Raw score under the lowest and highest dot of a rescaled row.
function extremeNotes(scores) {
  const order = ranked(scores);
  const first = order[0];
  const last = order[order.length - 1];
  return { [first]: String(scores[first]), [last]: String(scores[last]) };
}

function row(y, label, values, low, high, cls, { notes = null, ring = null } = {}) {
  const x = (v) => X0 + ((v - low) / (high - low)) * (X1 - X0);
  const parts = [
    `<line class="qi-fs__line" x1="${LINE_X0}" y1="${y}" x2="${LINE_X1}" y2="${y}"/>`,
    `<text class="qi-fs__row" x="${LABEL_X}" y="${y}" text-anchor="end" dominant-baseline="central">${label}</text>`,
  ];
  for (const doc of DOCS) {
    const cx = x(values[doc]).toFixed(1);
    parts.push(`<circle class="qi-fs__dot qi-fs__dot--${cls}" cx="${cx}" cy="${y}" r="6.5"/>`);
    parts.push(`<text class="qi-fs__doc" x="${cx}" y="${y - 17}" text-anchor="middle">${doc}</text>`);
    if (notes && doc in notes) {
      parts.push(`<text class="qi-fs__note" x="${cx}" y="${y + 29}" text-anchor="middle">${notes[doc]}</text>`);
    }
    if (doc === ring) {
      parts.push(`<circle class="qi-fs__ring" cx="${cx}" cy="${y}" r="13"/>`);
    }
  }
  return parts.join('');
}

function span(values) {
  const v = Object.values(values);
  return [Math.min(...v), Math.max(...v)];
}

function panel(title, label, rows, fused) {
  const [fLow, fHigh] = span(fused);
  const body = [
    `<text class="qi-fs__title" x="4" y="24">${title}</text>`,
    ...rows.map((r) => row(ROWS[r.cls], r.cls, r.values, r.low, r.high, r.cls, { notes: r.notes })),
    row(ROWS.fused, 'fused', fused, fLow, fHigh, 'fused', { ring: winner(fused) }),
  ].join('');
  return [
    '<div class="qi-fs__panel">',
    `  <svg class="qi-svg qi-fs__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="${label}">`,
    body,
    '  </svg>',
    '</div>',
  ].join('');
}

const order = (fused) => ranked(fused).join(', ');
const fmt = (n) => n.toFixed(2);

export function mount(node) {
  node.classList.add('qi-fs');

  const rrf = { dense: rrfPart(DENSE), sparse: rrfPart(SPARSE) };
  const rrfFused = summed(rrf.dense, rrf.sparse);
  const dbsf = { dense: dbsfPart(DENSE), sparse: dbsfPart(SPARSE) };
  const dbsfFused = summed(dbsf.dense, dbsf.sparse);
  // Both DBSF rows share one axis, so a lead on one list is comparable to the other.
  const both = [...Object.values(dbsf.dense), ...Object.values(dbsf.sparse)];
  const [dLow, dHigh] = [Math.min(...both), Math.max(...both)];

  const rrfPanel = panel(
    `RRF k=${K}`,
    `RRF with k=${K}. Dense ranks ${order(DENSE)}; sparse ranks ${order(SPARSE)}. Only positions count, so the fused order is ${order(rrfFused)} and ${winner(rrfFused)} wins with ${fmt(rrfFused[winner(rrfFused)])} against ${fmt(rrfFused.A)} for A.`,
    [
      { cls: 'dense', values: rankSlots(DENSE), low: 0, high: 1, notes: rankNotes(DENSE) },
      { cls: 'sparse', values: rankSlots(SPARSE), low: 0, high: 1, notes: rankNotes(SPARSE) },
    ],
    rrfFused,
  );
  const dbsfPanel = panel(
    'DBSF',
    `DBSF. Dense scores run from ${DENSE.D} to ${DENSE.A}, with A far ahead of B, C, and D; sparse scores run from ${SPARSE.D} to ${SPARSE.B}. After rescaling onto one axis A's lead survives the sum, so the fused order is ${order(dbsfFused)} and ${winner(dbsfFused)} wins.`,
    [
      { cls: 'dense', values: dbsf.dense, low: dLow, high: dHigh, notes: extremeNotes(DENSE) },
      { cls: 'sparse', values: dbsf.sparse, low: dLow, high: dHigh, notes: extremeNotes(SPARSE) },
    ],
    dbsfFused,
  );

  node.innerHTML = `<div class="qi-fig qi-fs__fig"><div class="qi-fs__panels">${rrfPanel}${dbsfPanel}</div></div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
