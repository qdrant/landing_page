/*
 * nested filter modes island for blog/qdrant-1.20-performance.
 *
 * An animated walkthrough of how Qdrant answers one nested filter in three
 * ways. The filter is an author named Ada Hopper: first = Ada, last = Hopper.
 * Two points are indexed. P1 has the authors Ada Lovelace and Grace Hopper, so
 * it has an Ada and a Hopper, but no author named Ada Hopper. P2 has the
 * authors Ada Hopper and Alan Turing, so only P2 is a correct result.
 *   - flat filter: each condition is looked up in its own index, and the
 *     points in both lists pass. P1 passes by mistake. Payload storage is not
 *     opened;
 *   - nested filter on regular indexes: the same lookup gives the candidates
 *     P1 and P2. Qdrant reads both payloads from storage and checks one author
 *     at a time, which rejects P1;
 *   - nested filter on a per-element index: the index lists authors, written
 *     point.author. Only P2.0 is in both lists, so no payload is read.
 * A mode switch and a replay button restart the animation. With reduced
 * motion, the final state is shown at once.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Condition
 * hues are constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';
const STEP_MS = 1700;

const CONDITIONS = [
  { key: 'first', label: 'first = Ada', w: 108 },
  { key: 'last', label: 'last = Hopper', w: 124 },
];

// Each author is [first name, last name].
const POINTS = [
  { id: 'P1', authors: [['Ada', 'Lovelace'], ['Grace', 'Hopper']] },
  { id: 'P2', authors: [['Ada', 'Hopper'], ['Alan', 'Turing']] },
];

// Geometry (viewBox 560 x 372).
const VB_W = 560;
const VB_H = 372;
const FILTER = { y: 2, labelX: 0, x: 60, gap: 8 };
const IDX = { x: 0, y: 40, w: 250, h: 214 };
const STO = { x: 310, y: 40, w: 250, h: 214 };
const RES = { x: 0, y: 268, w: VB_W, h: 96 };
const LOOKUP = { y: IDX.y + 34, pitch: 68, hitDy: 28 };
const COMBINE_Y = LOOKUP.y + 2 * LOOKUP.pitch;
const CARD = { x: STO.x + 12, y: STO.y + 34, w: 226, h: 78, gap: 8, row: 24, head: 26 };
const CHIP_H = 20;

const MODES = [
  {
    id: 'flat',
    label: 'flat filter',
    lists: { first: ['P1', 'P2'], last: ['P1', 'P2'] },
    combine: ['P1', 'P2'],
  },
  {
    id: 'regular',
    label: 'nested, regular indexes',
    lists: { first: ['P1', 'P2'], last: ['P1', 'P2'] },
    combine: ['P1', 'P2'],
  },
  {
    id: 'indexed',
    label: 'nested, per-element index',
    lists: { first: ['P1.0', 'P2.0'], last: ['P1.1', 'P2.0'] },
    combine: ['P2.0'],
  },
];

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function chip(parent, text, x, y, w, cls) {
  const g = el('g', { class: `qi-nm__chip ${cls || ''}`.trim() }, parent);
  el('rect', { x, y, width: w, height: CHIP_H, rx: 3 }, g);
  el('text', { x: x + w / 2, y: y + 14, 'text-anchor': 'middle' }, g, text);
  return g;
}

// Fade an element in on the next frame.
function appear(node) {
  node.classList.add('is-hidden');
  setTimeout(() => node.classList.remove('is-hidden'), 30);
}

export function mount(node) {
  node.classList.add('qi-nm');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="How the filter is answered">',
    MODES.map((m) => `      <button type="button" class="qi-chip" data-mode="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '    </div>',
    '    <button type="button" class="qi-chip" data-replay>Replay</button>',
    '  </div>',
    `  <svg class="qi-svg qi-nm__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="An animation of three ways to answer a filter for an author named Ada Hopper. A payload index sits next to payload storage, which holds the authors of points P1 and P2. A flat filter returns P1 by mistake. A nested filter on regular indexes reads both payloads to reject P1. A nested filter on a per-element index returns P2 using only index lookups.">',
    '  </svg>',
    '  <p class="qi-status qi-nm__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-nm__svg');
  const statusEl = node.querySelector('.qi-nm__status');
  const buttons = [...node.querySelectorAll('[data-mode]')];
  const replayBtn = node.querySelector('[data-replay]');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The filter: one chip per condition.
  el('text', { class: 'qi-label', x: FILTER.labelX, y: FILTER.y + 14 }, svg, 'filter');
  const queryChips = {};
  let fx = FILTER.x;
  CONDITIONS.forEach((c) => {
    queryChips[c.key] = chip(svg, c.label, fx, FILTER.y, c.w, `qi-nm__chip--${c.key}`);
    fx += c.w + FILTER.gap;
  });

  // Payload index (left) and payload storage (right).
  el('rect', { class: 'qi-frame', x: IDX.x, y: IDX.y, width: IDX.w, height: IDX.h, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: IDX.x + 14, y: IDX.y + 22 }, svg, 'Payload index');
  el('rect', { class: 'qi-frame', x: STO.x, y: STO.y, width: STO.w, height: STO.h, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: STO.x + 14, y: STO.y + 22 }, svg, 'Payload storage');
  const readsText = el('text', { class: 'qi-label qi-label--strong', x: STO.x + STO.w - 14, y: STO.y + 22, 'text-anchor': 'end' }, svg);
  CONDITIONS.forEach((c, i) => chip(svg, c.label, IDX.x + 12, LOOKUP.y + i * LOOKUP.pitch, c.w, `qi-nm__chip--${c.key}`));
  el('text', { class: 'qi-label', x: IDX.x + 12, y: COMBINE_Y + 14 }, svg, 'both');
  el('rect', { class: 'qi-frame', x: RES.x, y: RES.y, width: RES.w, height: RES.h, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: RES.x + 14, y: RES.y + 22 }, svg, 'Result');

  // Payload cards: one per point, one row per author, two dots per row.
  const cards = POINTS.map((p, i) => {
    const y = CARD.y + i * (CARD.h + CARD.gap);
    const g = el('g', { class: 'qi-nm__card' }, svg);
    el('rect', { class: 'qi-nm__card-box', x: CARD.x, y, width: CARD.w, height: CARD.h, rx: 5 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: CARD.x + 10, y: y + 18 }, g, p.id);
    const tag = el('text', { class: 'qi-label qi-nm__tag', x: CARD.x + CARD.w - 10, y: y + 18, 'text-anchor': 'end' }, g);
    const rows = p.authors.map((a, r) => {
      const ry = y + CARD.head + r * CARD.row;
      el('text', { class: 'qi-nm__name', x: CARD.x + 10, y: ry + 15 }, g, `${a[0]} ${a[1]}`);
      const dots = CONDITIONS.map((c, k) =>
        el('circle', { class: `qi-nm__dot qi-nm__dot--${c.key}`, cx: CARD.x + CARD.w - 50 + k * 26, cy: ry + 10, r: 5 }, g),
      );
      return { dots };
    });
    return { g, tag, rows, midY: y + CARD.h / 2 };
  });

  const dyn = el('g', { class: 'qi-nm__dyn' }, svg);
  let timers = [];
  let current = MODES[0];

  const setDot = (p, r, key) => cards[p].rows[r].dots[CONDITIONS.findIndex((c) => c.key === key)].classList.add(`is-${key}`);
  const setTag = (p, text, bad) => {
    cards[p].tag.textContent = text;
    cards[p].tag.classList.toggle('is-bad', !!bad);
  };

  function hits(row, texts) {
    const w = texts[0].includes('.') ? 56 : 44;
    const y = LOOKUP.y + row * LOOKUP.pitch + LOOKUP.hitDy;
    texts.forEach((t, k) => appear(chip(dyn, t, IDX.x + 12 + k * (w + 8), y, w, `qi-nm__chip--${CONDITIONS[row].key}`)));
  }
  function combine(texts) {
    const w = texts[0].includes('.') ? 56 : 44;
    texts.forEach((t, k) => appear(chip(dyn, t, IDX.x + 60 + k * (w + 8), COMBINE_Y, w, 'is-hot')));
  }
  function link(toCard) {
    const x1 = IDX.x + IDX.w;
    const y1 = COMBINE_Y + CHIP_H / 2;
    const path = el('path', { class: 'qi-nm__link', d: `M${x1} ${y1}L${STO.x} ${cards[toCard].midY}`, pathLength: 1 }, dyn);
    setTimeout(() => path.classList.add('is-drawn'), 30);
  }
  function read(p) {
    cards[p].g.classList.add('is-active');
    readsText.textContent = `reads: ${cards.filter((c) => c.g.classList.contains('is-active')).length}`;
  }
  function results(list) {
    let x = RES.x + 14;
    list.forEach(({ text, bad }) => {
      const w = Math.round(text.length * 7.3 + 18);
      appear(chip(dyn, text, x, RES.y + 44, w, bad ? 'qi-nm__chip--bad' : 'qi-nm__chip--ok'));
      x += w + 10;
    });
  }
  const pulse = (key) => {
    queryChips[key].classList.add('is-pulse');
  };

  // Each step has the status text and what it draws.
  const SCRIPTS = {
    flat: [
      { text: 'The filter asks for an author named Ada Hopper: first name Ada, last name Hopper.', run: () => { pulse('first'); pulse('last'); } },
      { text: 'A flat filter looks up each condition in its own index. The Adas are in P1 and P2.', run: () => hits(0, ['P1', 'P2']) },
      { text: 'The Hoppers are in P1 and P2 too.', run: () => hits(1, ['P1', 'P2']) },
      { text: 'The index keeps the points that are in both lists, so P1 and P2 both pass.', run: () => combine(['P1', 'P2']) },
      {
        text: 'But in P1, the Ada is Ada Lovelace and the Hopper is Grace Hopper. No single author is Ada Hopper.',
        run: () => {
          setDot(0, 0, 'first');
          setDot(0, 1, 'last');
          setDot(1, 0, 'first');
          setDot(1, 0, 'last');
          setTag(0, 'different authors', true);
          // The dashed cards show why P1 passes. Qdrant does not read them.
          cards.forEach((c) => c.g.classList.add('is-explain'));
        },
      },
      { text: 'A flat filter never opens the payloads, so it returns P1 as well. The result is wrong.', run: () => results([{ text: 'P1 (wrong)', bad: true }, { text: 'P2' }]) },
    ],
    regular: [
      { text: 'The filter asks for an author named Ada Hopper: first name Ada, last name Hopper.', run: () => { pulse('first'); pulse('last'); } },
      { text: 'The regular indexes list points, not authors. The Adas are in P1 and P2.', run: () => hits(0, ['P1', 'P2']) },
      { text: 'The Hoppers are in P1 and P2 too.', run: () => hits(1, ['P1', 'P2']) },
      { text: 'Both points pass the index, so they are only candidates. Qdrant must check them.', run: () => combine(['P1', 'P2']) },
      { text: 'Qdrant reads the payload of P1 from storage, and checks one author at a time.', run: () => { link(0); read(0); } },
      {
        text: 'Ada Lovelace has the first name but not the last. Grace Hopper has the last name but not the first. P1 is rejected.',
        run: () => {
          setDot(0, 0, 'first');
          setDot(0, 1, 'last');
          setTag(0, 'no author fits', true);
        },
      },
      {
        text: 'Qdrant reads the payload of P2 as well. Ada Hopper has both, so P2 matches.',
        run: () => {
          link(1);
          read(1);
          setDot(1, 0, 'first');
          setDot(1, 0, 'last');
          setTag(1, 'author 0 fits', false);
        },
      },
      { text: 'The result is correct. Two payload reads fixed the answer.', run: () => results([{ text: 'P2' }]) },
    ],
    indexed: [
      { text: 'The filter asks for an author named Ada Hopper: first name Ada, last name Hopper.', run: () => { pulse('first'); pulse('last'); } },
      { text: 'The per-element index lists authors, written point.author. The Adas are P1.0 and P2.0.', run: () => hits(0, ['P1.0', 'P2.0']) },
      { text: 'The Hoppers are P1.1 and P2.0.', run: () => hits(1, ['P1.1', 'P2.0']) },
      { text: 'Only P2.0 is in both lists. It is one author with both names. P1 never matches.', run: () => combine(['P2.0']) },
      { text: 'Payload storage stays closed. The index alone answered the filter.', run: () => { readsText.textContent = 'reads: 0'; } },
      { text: 'The result is correct, with no payload read.', run: () => results([{ text: 'P2' }]) },
    ],
  };

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    dyn.replaceChildren();
    Object.values(queryChips).forEach((c) => c.classList.remove('is-pulse'));
    cards.forEach((c, i) => {
      c.g.classList.remove('is-active', 'is-explain');
      c.tag.textContent = '';
      c.tag.classList.remove('is-bad');
      c.rows.forEach((r) => r.dots.forEach((d) => d.classList.remove('is-first', 'is-last')));
    });
    readsText.textContent = 'reads: 0';
  }

  function play(id) {
    current = MODES.find((m) => m.id === id);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === id)));
    reset();
    const steps = SCRIPTS[id];
    const apply = (s) => {
      s.run();
      statusEl.textContent = s.text;
    };
    if (reduced) {
      steps.forEach((s) => s.run());
      statusEl.textContent = steps[steps.length - 1].text;
      // With no motion, show every element at once.
      dyn.querySelectorAll('.is-hidden').forEach((n) => n.classList.remove('is-hidden'));
      dyn.querySelectorAll('.qi-nm__link').forEach((n) => n.classList.add('is-drawn'));
      return;
    }
    steps.forEach((s, i) => timers.push(setTimeout(() => apply(s), i * STEP_MS)));
  }

  buttons.forEach((b) => b.addEventListener('click', () => play(b.dataset.mode)));
  replayBtn.addEventListener('click', () => play(current.id));

  play('flat');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
