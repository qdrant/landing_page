/*
 * nested filter modes island for blog/qdrant-1.20-performance.
 *
 * Two papers, filtered on first name Ada and last name Hopper. Each point's
 * authors are drawn as element boxes, with chips colored by the condition they
 * meet. A mode selector switches how Qdrant answers the filter, and the
 * pipeline frame lists the steps for that mode:
 *   - flat: each condition is looked up in a per-field index, and the point
 *     sets are intersected. Conditions may match different authors, so point 1
 *     is a false match.
 *   - nested, regular indexes: the same lookup narrows candidates, then the
 *     payload of each candidate is read to check every author on its own.
 *   - nested, per-element index: the index stores (point, element) pairs, so
 *     the intersection already happens per author and no payload is read.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Condition
 * hues are constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';

const CONDITIONS = [
  { key: 'first', label: 'first = Ada', test: (a) => a.first === 'Ada' },
  { key: 'last', label: 'last = Hopper', test: (a) => a.last === 'Hopper' },
];

const POINTS = [
  { id: 1, authors: [{ first: 'Ada', last: 'Lovelace' }, { first: 'Grace', last: 'Hopper' }] },
  { id: 2, authors: [{ first: 'Ada', last: 'Hopper' }, { first: 'Alan', last: 'Turing' }] },
];

// What each mode shows in the pipeline. `match` lists the verdict per point.
const MODES = [
  {
    id: 'flat',
    label: 'flat filter',
    match: { 1: 'false match', 2: 'match' },
    reads: 0,
    steps: [
      { label: '1 Index lookup', items: [{ text: 'first = Ada: P1, P2', cond: 'first' }, { text: 'last = Hopper: P1, P2', cond: 'last' }] },
      { label: '2 Payload reads', items: [{ text: 'none', dim: true }] },
    ],
    status:
      'A flat filter checks each condition on its own. Point 1 has an Ada and a Hopper, but they are different authors, so it is a false match. It is fast, and it returns the wrong points.',
  },
  {
    id: 'regular',
    label: 'nested, regular indexes',
    match: { 1: 'no match', 2: 'match' },
    reads: 2,
    steps: [
      { label: '1 Index lookup', items: [{ text: 'first = Ada: P1, P2', cond: 'first' }, { text: 'last = Hopper: P1, P2', cond: 'last' }] },
      { label: '2 Payload reads', items: [{ text: 'read P1 and P2', hot: true }] },
    ],
    status:
      'The regular indexes only narrow the candidates to P1 and P2. Qdrant then reads their payloads, usually from disk, to check one author at a time. The result is correct, and the reads grow with the number of candidates.',
  },
  {
    id: 'indexed',
    label: 'nested, per-element index',
    match: { 1: 'no match', 2: 'match' },
    reads: 0,
    steps: [
      { label: '1 Index lookup', items: [{ text: 'first = Ada: P1.0, P2.0', cond: 'first' }, { text: 'last = Hopper: P1.1, P2.0', cond: 'last' }] },
      { label: '2 Payload reads', items: [{ text: 'none', dim: true }] },
    ],
    status:
      'The per-element index stores each author as its own entry, written point.author. Only P2.0 is in both lists, so the filter is answered from the index and no payload is read.',
  },
];

// Geometry (viewBox 480 x 426). Narrow on purpose, so the text renders large.
const VB_W = 480;
const FILTER = { y: 2, h: 20, labelX: 0, x: 60, gap: 8, widths: [108, 124] };
const FRAME = { y: 36, pad: 14, head: 34, pitch: 72 };
const ROW = { x: 14, w: VB_W - 28, h: 64 };
const AUTHOR = { x: 94, y: [6, 36], w: 232, h: 24 };
const CHIP = { h: 20, firstX: 6, firstW: 96, lastX: 110, lastW: 112 };
const VERDICT_X = 336;
const FRAME_H = FRAME.head + POINTS.length * FRAME.pitch - (FRAME.pitch - ROW.h) + FRAME.pad;
const STEP = { head: 24, pitch: 28, pad: 10 };
const PIPE = { y: FRAME.y + FRAME_H + 14, head: 34, labelX: 14, itemX: 26, charW: 7.3, pad: 18 };
const stepH = (s) => STEP.head + s.items.length * STEP.pitch + STEP.pad;
const PIPE_H = PIPE.head + Math.max(...MODES.map((m) => m.steps.reduce((n, s) => n + stepH(s), 0))) + 4;
const VB_H = PIPE.y + PIPE_H + 2;
const READS_X = VB_W - 14;

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function chip(parent, text, x, y, w, cond, extra) {
  const g = el('g', { class: 'qi-nm__chip' + (cond ? ` qi-nm__chip--${cond}` : '') + (extra ? ` ${extra}` : '') }, parent);
  el('rect', { x, y, width: w, height: CHIP.h, rx: 3 }, g);
  el('text', { x: x + w / 2, y: y + 14, 'text-anchor': 'middle' }, g, text);
  return g;
}

export function mount(node) {
  node.classList.add('qi-nm');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="How the filter is answered">',
    MODES.map((m) => `      <button type="button" class="qi-chip" data-mode="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-nm__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="Two papers filtered on first name Ada and last name Hopper. Paper 1 has an author named Ada Lovelace and another named Grace Hopper. Paper 2 has an author named Ada Hopper. A list of steps shows how a flat filter, a nested filter on regular indexes, and a nested filter on a per-element index answer the filter.">',
    '  </svg>',
    '  <p class="qi-status qi-nm__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-nm__svg');
  const statusEl = node.querySelector('.qi-nm__status');
  const buttons = [...node.querySelectorAll('[data-mode]')];

  // The filter: one chip per condition, in its condition color.
  el('text', { class: 'qi-label', x: FILTER.labelX, y: FILTER.y + 14 }, svg, 'filter');
  let fx = FILTER.x;
  CONDITIONS.forEach((c, i) => {
    chip(svg, c.label, fx, FILTER.y, FILTER.widths[i], c.key);
    fx += FILTER.widths[i] + FILTER.gap;
  });

  // The collection: one row per paper, one box per author.
  el('rect', { class: 'qi-frame', x: 0, y: FRAME.y, width: VB_W, height: FRAME_H, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: 14, y: FRAME.y + 22 }, svg, 'Collection');

  const rows = POINTS.map((p, r) => {
    const y = FRAME.y + FRAME.head + r * FRAME.pitch;
    const g = el('g', { class: 'qi-nm__row', transform: `translate(${ROW.x} ${y})` }, svg);
    el('rect', { class: 'qi-nm__box', width: ROW.w, height: ROW.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 24 }, g, `Point ${p.id}`);
    p.authors.forEach((a, i) => {
      const y = AUTHOR.y[i];
      el('rect', { class: 'qi-nm__author-box', x: AUTHOR.x, y: y - 2, width: AUTHOR.w, height: AUTHOR.h + 4, rx: 4 }, g);
      el('text', { class: 'qi-label', x: AUTHOR.x - 8, y: y + 14, 'text-anchor': 'end' }, g, `[${i}]`);
      const [first, last] = CONDITIONS;
      chip(g, `first: ${a.first}`, AUTHOR.x + CHIP.firstX, y, CHIP.firstW, first.test(a) && first.key);
      chip(g, `last: ${a.last}`, AUTHOR.x + CHIP.lastX, y, CHIP.lastW, last.test(a) && last.key);
    });
    const verdict = el('text', { class: 'qi-label qi-nm__verdict', x: VERDICT_X, y: 36 }, g);
    return { p, el: g, verdict };
  });

  // The pipeline for the selected mode.
  el('rect', { class: 'qi-frame', x: 0, y: PIPE.y, width: VB_W, height: PIPE_H, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: 14, y: PIPE.y + 22 }, svg, 'How Qdrant answers it');
  const readsText = el('text', { class: 'qi-label qi-label--strong qi-nm__reads', x: READS_X, y: PIPE.y + 22, 'text-anchor': 'end' }, svg);
  const pipe = el('g', { class: 'qi-nm__pipe' }, svg);

  function renderPipe(mode) {
    pipe.replaceChildren();
    let y = PIPE.y + PIPE.head;
    mode.steps.forEach((s) => {
      el('text', { class: 'qi-label', x: PIPE.labelX, y: y + 14 }, pipe, s.label);
      s.items.forEach((it, k) => {
        const w = Math.round(it.text.length * PIPE.charW + PIPE.pad);
        const cls = [it.dim ? 'is-dim' : '', it.hot ? 'is-hot' : ''].filter(Boolean).join(' ');
        chip(pipe, it.text, PIPE.itemX, y + STEP.head + k * STEP.pitch - 4, w, it.cond, cls);
      });
      y += stepH(s);
    });
  }

  function select(id) {
    const mode = MODES.find((m) => m.id === id);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
    rows.forEach((r) => {
      const verdict = mode.match[r.p.id];
      const ok = verdict === 'match';
      r.el.classList.toggle('is-miss', verdict === 'no match');
      r.el.classList.toggle('is-wrong', verdict === 'false match');
      r.verdict.textContent = verdict;
      r.verdict.classList.toggle('qi-label--strong', verdict !== 'no match');
      r.verdict.classList.toggle('is-ok', ok);
    });
    renderPipe(mode);
    readsText.textContent = `payload reads: ${mode.reads}`;
    statusEl.textContent = mode.status;
  }

  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.mode)));

  select('regular');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
