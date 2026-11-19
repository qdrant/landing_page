/*
 * rescore island: the two-stage search over a quantized copy, one fixed
 * illustrative query at limit 10 with oversampling 2.0. The quantized copy
 * returns 20 candidates in rough-score order and the true neighbor sits at
 * rough rank 14. The only control is the rescoring toggle: off returns the
 * rough top 10 and loses the neighbor, on re-sorts the 20 by exact score and
 * recovers it. The exact-score order is a fixed illustrative permutation,
 * not measured data.
 *
 * stageOne(), stageTwo(), render() and statusText() are pure and exported
 * so the static fallback image can be generated from the same code.
 */

export const LIMIT = 10;
export const HIT = 14;
export const POOL = 20;
// Illustrative exact-score order of the 20 rough-ranked candidates.
const EXACT = [2, 1, 3, 14, 4, 6, 5, 7, 9, 8, 11, 10, 13, 12, 15, 16, 18, 17, 19, 20];

export const VB_W = 760;
export const VB_H = 158;
const SLOT = VB_W / POOL;
const CW = 33;
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

export function returned(rescore) {
  return (rescore ? EXACT : EXACT.map((_, i) => i + 1)).slice(0, LIMIT);
}

export function stageOne() {
  return (
    `<text class="qrs-h" x="0" y="14">Step 1: oversampling fetches ${POOL} candidates (limit 10 x 2.0), rough-score order</text>` +
    cells(EXACT.map((_, i) => i + 1), 26)
  );
}

export function stageTwo(rescore) {
  const header = rescore
    ? 'Step 2: rescoring re-sorts them by exact score and returns the top 10'
    : 'Rescoring off: the top 10 by rough score are returned';
  const outcome = rescore
    ? `<text class="qrs-keep" x="0" y="152">the true neighbor at rank ${HIT} is recovered</text>`
    : `<text class="qrs-note" x="0" y="152">the true neighbor at rank ${HIT} is lost</text>`;
  return `<text class="qrs-h" x="0" y="88">${header}</text>` + cells(returned(rescore), 100) + outcome;
}

export function render(rescore) {
  return stageOne() + stageTwo(rescore);
}

export function statusText(rescore) {
  return rescore
    ? `The quantized copy returns ${POOL} candidates. Rescoring reads those ${POOL} original vectors, re-sorts by exact score, and the true neighbor at rough rank ${HIT} climbs into the returned 10.`
    : `The quantized copy returns ${POOL} candidates. With rescoring off the rough scores are final, the originals are never read, and the true neighbor at rough rank ${HIT} is lost.`;
}

export function mount(node) {
  node.classList.add('qrs');
  let rescore = true;
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Rescoring">',
    '      <button type="button" class="qi-chip" data-rs="0" aria-pressed="false">rescoring off</button>',
    '      <button type="button" class="qi-chip" data-rs="1" aria-pressed="false">rescoring on</button>',
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qrs__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qrs__status');
  function draw() {
    svg.innerHTML = render(rescore);
    const text = statusText(rescore);
    status.textContent = text;
    svg.setAttribute('aria-label', `Two-stage search over a quantized copy. ${text}`);
    node.querySelectorAll('[data-rs]').forEach((b) => b.setAttribute('aria-pressed', String(Boolean(Number(b.dataset.rs)) === rescore)));
  }
  node.addEventListener('click', (e) => {
    const r = e.target.closest ? e.target.closest('[data-rs]') : null;
    if (r) { rescore = Boolean(Number(r.dataset.rs)); draw(); }
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
