/*
 * grouping island: how the groups API regroups a ranked result list.
 *
 * The six example points from the Grouping API section, each drawn as a row of
 * bars: its document_id value (colored by value) and its score. Turning on
 * group_by moves the rows into one group per document_id, ordered by each
 * group's best hit, with at most group_size = 2 hits per group:
 *   - point 1 has two document IDs (a and b), so a copy of it lands in each;
 *   - point 2 is a's third-best hit, so it doesn't make the cut.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Group hues
 * are constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';

const GROUPS = ['a', 'b', '123', '-10']; // in result order: best hit first
const GROUP_SIZE = 2;

// Ranked results. Point 1 has an array document_id, so it belongs to two groups.
const POINTS = [
  { id: 0, score: 0.91, docs: ['a'] },
  { id: 1, score: 0.85, docs: ['a', 'b'] },
  { id: 3, score: 0.79, docs: ['123'] },
  { id: 4, score: 0.75, docs: ['123'] },
  { id: 5, score: 0.6, docs: ['-10'] },
  { id: 2, score: 0.2, docs: ['a'] },
];

// Geometry (viewBox 760 x 290).
const VB_W = 760;
const VB_H = 290;
const ROW = { w: 600, h: 30 };
const CHIP = { x: 84, y: 6, w: 64, h: 18, gap: 2 };
const SCORE = { x: 186, y: 10, h: 10, max: 330 };
// Ranked list: one column on the left.
const LIST = { x: 0, y: 24, pitch: 36 };
// Groups: one frame per group, stacked in result order. The group's chip sits
// to the left of its rows, so the rows move right and down when grouped.
const FRAME = { rowsX: 148, pad: 8, pitch: 36, gap: 10 };

// Each frame is as tall as the hits it keeps.
const kept = GROUPS.map((doc) => Math.min(GROUP_SIZE, POINTS.filter((p) => p.docs.includes(doc)).length));
const frameH = (g) => 2 * FRAME.pad + kept[g] * FRAME.pitch - (FRAME.pitch - ROW.h);
const frameY = (g) => 2 + GROUPS.slice(0, g).reduce((y, _, i) => y + frameH(i) + FRAME.gap, 0);

const STATUS = {
  off: 'A regular query ranks points by score. Several of the top hits come from the same document.',
  on: `Each group holds the best hits for one <code>document_id</code>, at most ${GROUP_SIZE}, because of the <code>group_size</code>. Point 1 has two document IDs, so it appears in groups <b>a</b> and <b>b</b>. Point 2 is the third hit for <b>a</b>, so it's left out.`,
};

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

// A colored document_id chip, as used in the rows and the group headers.
function chip(parent, doc, x, y, w) {
  const g = el('g', { class: `qi-sg__chip qi-sg__chip--${GROUPS.indexOf(doc)}`, 'data-doc': doc }, parent);
  el('rect', { x, y, width: w, height: CHIP.h, rx: 3 }, g);
  el('text', { x: x + w / 2, y: y + 13, 'text-anchor': 'middle' }, g, doc);
  return g;
}

export function mount(node) {
  node.classList.add('qi-sg');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-group aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>group_by: document_id',
    '    </button>',
    `    <span class="qi-hint">group_size: ${GROUP_SIZE}</span>`,
    '  </div>',
    `  <svg class="qi-svg qi-sg__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="Six ranked search results, each with a document ID. Grouping by document ID gathers them into one group per document.">',
    '    <g class="qi-sg__frames"></g>',
    '    <g class="qi-sg__head"></g>',
    '    <g class="qi-sg__rows"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-sg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-sg__svg');
  const framesG = svg.querySelector('.qi-sg__frames');
  const headG = svg.querySelector('.qi-sg__head');
  const rowsG = svg.querySelector('.qi-sg__rows');
  const statusEl = node.querySelector('.qi-sg__status');
  const toggle = node.querySelector('[data-group]');

  // Column headings for the ranked list; they fade out once grouped.
  el('text', { class: 'qi-label', x: LIST.x + 12, y: LIST.y - 8 }, headG, 'point');
  el('text', { class: 'qi-label', x: LIST.x + CHIP.x, y: LIST.y - 8 }, headG, 'document_id');
  el('text', { class: 'qi-label', x: LIST.x + SCORE.x, y: LIST.y - 8 }, headG, 'score');

  GROUPS.forEach((doc, g) => {
    const f = el('g', { class: 'qi-sg__frame' }, framesG);
    el('rect', { class: 'qi-frame', x: 0, y: frameY(g), width: VB_W, height: frameH(g), rx: 6 }, f);
    el('text', { class: 'qi-frame-label', x: 14, y: frameY(g) + FRAME.pad + 20 }, f, 'Group');
    chip(f, doc, 68, frameY(g) + FRAME.pad + CHIP.y, CHIP.w);
  });

  // One row per (point, group) placement. In the ranked list, the extra copy
  // of point 1 sits exactly under the first one, so it is not seen until it
  // moves to group b.
  const rows = [];
  const filled = GROUPS.map(() => 0);
  POINTS.forEach((p, rank) => {
    p.docs.forEach((doc, copy) => {
      const g = GROUPS.indexOf(doc);
      const slot = filled[g]++;
      const inGroup = slot < GROUP_SIZE;
      const r = el('g', { class: 'qi-sg__row' }, rowsG);
      el('rect', { class: 'qi-sg__box', width: ROW.w, height: ROW.h, rx: 6 }, r);
      el('text', { class: 'qi-label qi-label--strong', x: 12, y: 20 }, r, `Point ${p.id}`);
      const w = (CHIP.w - CHIP.gap * (p.docs.length - 1)) / p.docs.length;
      p.docs.forEach((d, i) => {
        const c = chip(r, d, CHIP.x + i * (w + CHIP.gap), CHIP.y, w);
        // Inside a group, the chip of the other group is dimmed.
        c.classList.toggle('is-other', d !== doc);
      });
      el('rect', { class: 'qi-sg__score', x: SCORE.x, y: SCORE.y, width: p.score * SCORE.max, height: SCORE.h, rx: 2 }, r);
      el('text', { class: 'qi-label', x: SCORE.x + p.score * SCORE.max + 8, y: 20 }, r, p.score.toFixed(2));
      rows.push({
        el: r,
        copy,
        kept: inGroup,
        list: { x: LIST.x, y: LIST.y + rank * LIST.pitch },
        group: { x: FRAME.rowsX, y: frameY(g) + FRAME.pad + Math.min(slot, GROUP_SIZE - 1) * FRAME.pitch },
      });
    });
  });

  let grouped = false;

  function render() {
    node.classList.toggle('is-grouped', grouped);
    toggle.setAttribute('aria-pressed', String(grouped));
    rows.forEach((r) => {
      const at = grouped ? r.group : r.list;
      r.el.style.transform = `translate(${at.x}px, ${at.y}px)`;
      r.el.classList.toggle('is-hidden', grouped ? !r.kept : r.copy > 0);
    });
    statusEl.innerHTML = grouped ? STATUS.on : STATUS.off;
  }

  toggle.addEventListener('click', () => {
    grouped = !grouped;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
