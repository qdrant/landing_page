/*
 * rescore island: the two-stage search over a quantized copy.
 *
 * Step 1 (oversampling) fetches limit x oversampling candidates from the
 * quantized index in rough-score order. Step 2 (rescoring) re-scores those
 * candidates against the original vectors and returns the best `limit`.
 * One illustrative query at limit 10 whose true neighbor sits at rough
 * rank 14. The exact-score order is a fixed illustrative permutation, not
 * measured data.
 *
 * stageOne(), stageTwo(), render() and statusText() are pure and exported
 * so the static fallback image can be generated from the same code.
 */

export const LIMIT = 10;
export const HIT = 14;
export const OVERSAMPLING = [1, 2, 3];
// Illustrative exact-score order of the first 30 rough-ranked candidates.
const EXACT = [2, 1, 3, 14, 4, 6, 5, 7, 9, 8, 11, 10, 13, 12, 15, 16, 18, 17, 19, 20, 21, 23, 22, 24, 26, 25, 27, 29, 28, 30];

export const VB_W = 760;
export const VB_H = 158;
const SLOTS = 30;
const SLOT = VB_W / SLOTS;
const CW = 21;
const CH = 26;

function cells(ranks, y) {
  return ranks
    .map((r, i) => {
      const x = i * SLOT;
      const hit = r === HIT ? ' is-hit' : '';
      return (
        `<rect class="qrs-cell${hit}" x="${x.toFixed(1)}" y="${y}" width="${CW}" height="${CH}" rx="4"/>` +
        `<text class="qrs-n${hit}" x="${(x + CW / 2).toFixed(1)}" y="${y + 17}" text-anchor="middle">${r}</text>`
      );
    })
    .join('');
}

function range(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function returned(ov, rescore) {
  const pool = LIMIT * ov;
  const order = rescore ? EXACT.filter((r) => r <= pool) : range(pool);
  return order.slice(0, LIMIT);
}

export function stageOne(ov) {
  const pool = LIMIT * ov;
  const out = [
    `<text class="qrs-h" x="0" y="14">Step 1: the quantized copy returns ${pool} candidates (10 x ${ov.toFixed(1)}), rough-score order</text>`,
    cells(range(pool), 26),
  ];
  if (pool < HIT) {
    const x = (HIT - 1) * SLOT;
    out.push(
      `<rect class="qrs-cell is-miss" x="${x.toFixed(1)}" y="26" width="${CW}" height="${CH}" rx="4"/>`,
      `<text class="qrs-n is-miss" x="${(x + CW / 2).toFixed(1)}" y="43" text-anchor="middle">${HIT}</text>`,
    );
  }
  return out.join('');
}

export function stageTwo(ov, rescore) {
  const pool = LIMIT * ov;
  const got = returned(ov, rescore);
  const pos = got.indexOf(HIT) + 1;
  const header = rescore
    ? `Step 2: rescoring reads ${pool} originals, re-sorts by exact score, returns the top 10`
    : 'Rescoring off: the rough scores are final, the top 10 are returned as-is';
  let outcome;
  if (pos) outcome = `<text class="qrs-keep" x="0" y="152">the true neighbor climbs from rough rank ${HIT} to position ${pos} of the returned 10</text>`;
  else if (pool >= HIT) outcome = `<text class="qrs-note" x="0" y="152">the true neighbor at rough rank ${HIT} is discarded with the extra ${pool - LIMIT}</text>`;
  else outcome = `<text class="qrs-note" x="0" y="152">the true neighbor at rough rank ${HIT} was never fetched, so it cannot be returned</text>`;
  return `<text class="qrs-h" x="0" y="88">${header}</text>` + cells(got, 100) + outcome;
}

export function render(ov, rescore) {
  return stageOne(ov) + stageTwo(ov, rescore);
}

export function statusText(ov, rescore) {
  const pool = LIMIT * ov;
  const fetched =
    pool >= HIT
      ? `Qdrant fetches ${pool} candidates from the quantized copy (limit 10 x oversampling ${ov.toFixed(1)}); the true neighbor is among them at rough rank ${HIT}.`
      : `Qdrant fetches ${pool} candidates from the quantized copy (limit 10 x oversampling ${ov.toFixed(1)}), so the true neighbor at rough rank ${HIT} is never fetched.`;
  if (!rescore) {
    return `${fetched} With rescoring off the rough scores are final and the originals are never read: ${pool >= HIT ? `the true neighbor is discarded with the extra ${pool - LIMIT}` : 'it is lost'}.`;
  }
  const pos = returned(ov, rescore).indexOf(HIT) + 1;
  const end = pos
    ? `the true neighbor lands at position ${pos} of the returned 10. Only ${pool} originals are read, not the whole collection.`
    : 'rescoring re-sorts only what the first pass found, so it cannot recover a neighbor the pool never contained.';
  return `${fetched} Rescoring reads the ${pool} original vectors and re-sorts by exact score: ${end}`;
}

export function mount(node) {
  node.classList.add('qrs');
  let ov = 2;
  let rescore = true;
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Oversampling">',
    OVERSAMPLING.map((o) => `<button type="button" class="qi-chip" data-ov="${o}" aria-pressed="false">oversampling ${o.toFixed(1)}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Rescoring">',
    '      <button type="button" class="qi-chip" data-rs="0" aria-pressed="false">rescoring off</button>',
    '      <button type="button" class="qi-chip" data-rs="1" aria-pressed="false">rescoring on</button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-status--3 qrs__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qrs__status');
  function draw() {
    svg.innerHTML = render(ov, rescore);
    const text = statusText(ov, rescore);
    status.textContent = text;
    svg.setAttribute('aria-label', `Two-stage search over a quantized copy. ${text}`);
    node.querySelectorAll('[data-ov]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ov) === ov)));
    node.querySelectorAll('[data-rs]').forEach((b) => b.setAttribute('aria-pressed', String(Boolean(Number(b.dataset.rs)) === rescore)));
  }
  node.addEventListener('click', (e) => {
    const o = e.target.closest ? e.target.closest('[data-ov]') : null;
    if (o) { ov = Number(o.dataset.ov); draw(); return; }
    const r = e.target.closest ? e.target.closest('[data-rs]') : null;
    if (r) { rescore = Boolean(Number(r.dataset.rs)); draw(); }
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
