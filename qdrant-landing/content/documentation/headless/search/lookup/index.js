/*
 * lookup island: interactive replacement for lookup_id_linking.png.
 *
 * Grouped chunk results (groups 200 and 201, as in the Lookup in Groups
 * example) next to the `documents` collection, which holds one point per
 * document. Turning on with_lookup copies each document into the group whose
 * ID equals the document's point ID. The ID is the join key, so it carries the
 * same color on both sides. Document 202 matches no group and stays unused.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). ID hues
 * are constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';

const DOCS = [
  { id: 200, title: 'Document A' },
  { id: 201, title: 'Document B' },
  { id: 202, title: 'Document C' },
];
const GROUPS = [
  {
    id: 200,
    hits: [
      { id: 0, score: 0.91 },
      { id: 1, score: 0.85 },
    ],
  },
  { id: 201, hits: [{ id: 1, score: 0.85 }] },
];

// Geometry (viewBox 760 x 270). Groups on the left, documents on the right.
const VB_W = 760;
const VB_H = 270;
const GROUP = { x: 0, w: 380, gap: 12, hitsY: 34, pitch: 34, pad: 8 };
const HIT = { dx: 15, w: 350, h: 28 };
const SCORE = { x: 90, y: 9, h: 10, max: 160 };
const DOC = { w: 280, h: 30, pitch: 40 };
const CHIP = { x: 8, y: 6, w: 48, h: 18 };
const TITLE = { x: 64, w: 206 };
const LOOKUP = { labelDx: 24, dx: 85 };
const DOCS_FRAME = { x: 440, w: 320, rowsY: 34 };
DOCS_FRAME.h = DOCS_FRAME.rowsY + DOCS.length * DOC.pitch;
DOCS_FRAME.y = (VB_H - DOCS_FRAME.h) / 2;

const STAGGER_MS = 200;

const STATUS = {
  off: 'The chunks are grouped by <code>document_id</code>. The <code>documents</code> collection holds one point per document, and its point IDs are the same values.',
  on: 'Each group gets the point from <code>documents</code> whose ID equals the group ID. Document 202 matches no group, so it isn\'t returned.',
};

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function chip(parent, id, x, y) {
  const g = el('g', { class: `qi-lk__chip qi-lk__chip--${DOCS.findIndex((d) => d.id === id)}` }, parent);
  el('rect', { x, y, width: CHIP.w, height: CHIP.h, rx: 3 }, g);
  el('text', { x: x + CHIP.w / 2, y: y + 13, 'text-anchor': 'middle' }, g, String(id));
  return g;
}

// A documents point: its ID and its title payload.
function docRow(parent, doc) {
  const g = el('g', { class: 'qi-lk__doc' }, parent);
  el('rect', { class: 'qi-lk__box', width: DOC.w, height: DOC.h, rx: 6 }, g);
  chip(g, doc.id, CHIP.x, CHIP.y);
  el('rect', { class: 'qi-lk__title', x: TITLE.x, y: CHIP.y, width: TITLE.w, height: CHIP.h, rx: 3 }, g);
  el('text', { class: 'qi-label qi-label--strong', x: TITLE.x + 8, y: CHIP.y + 13 }, g, doc.title);
  return g;
}

export function mount(node) {
  node.classList.add('qi-lk');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-lookup aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>with_lookup: documents',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-lk__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="Search results grouped by document ID, next to a documents collection. With lookup, each group gets the document whose point ID equals the group ID.">',
    '    <g class="qi-lk__frames"></g>',
    '    <g class="qi-lk__copies"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-lk__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-lk__svg');
  const framesG = svg.querySelector('.qi-lk__frames');
  const copiesG = svg.querySelector('.qi-lk__copies');
  const statusEl = node.querySelector('.qi-lk__status');
  const toggle = node.querySelector('[data-lookup]');

  // The documents collection.
  el('rect', { class: 'qi-frame', x: DOCS_FRAME.x, y: DOCS_FRAME.y, width: DOCS_FRAME.w, height: DOCS_FRAME.h, rx: 6 }, framesG);
  el('text', { class: 'qi-frame-label', x: DOCS_FRAME.x + 14, y: DOCS_FRAME.y + 22 }, framesG, 'documents');
  const docAt = (i) => ({ x: DOCS_FRAME.x + (DOCS_FRAME.w - DOC.w) / 2, y: DOCS_FRAME.y + DOCS_FRAME.rowsY + i * DOC.pitch });
  const docEls = DOCS.map((d, i) => {
    const g = docRow(framesG, d);
    const at = docAt(i);
    g.setAttribute('transform', `translate(${at.x} ${at.y})`);
    return g;
  });

  // The groups, each with its hits and an empty lookup slot.
  let y = 2;
  const copies = GROUPS.map((grp, gi) => {
    const h = GROUP.hitsY + (grp.hits.length + 1) * GROUP.pitch + GROUP.pad;
    el('rect', { class: 'qi-frame', x: GROUP.x, y, width: GROUP.w, height: h, rx: 6 }, framesG);
    el('text', { class: 'qi-frame-label', x: GROUP.x + 14, y: y + 22 }, framesG, 'Group');
    chip(framesG, grp.id, GROUP.x + 68, y + 8);
    grp.hits.forEach((hit, k) => {
      const hy = y + GROUP.hitsY + k * GROUP.pitch;
      const g = el('g', { transform: `translate(${GROUP.x + HIT.dx} ${hy})` }, framesG);
      el('rect', { class: 'qi-lk__box', width: HIT.w, height: HIT.h, rx: 6 }, g);
      el('text', { class: 'qi-label qi-label--strong', x: 12, y: 19 }, g, `Point ${hit.id}`);
      el('rect', { class: 'qi-lk__score', x: SCORE.x, y: SCORE.y, width: hit.score * SCORE.max, height: SCORE.h, rx: 2 }, g);
      el('text', { class: 'qi-label', x: SCORE.x + hit.score * SCORE.max + 8, y: 19 }, g, hit.score.toFixed(2));
    });
    const slotY = y + GROUP.hitsY + grp.hits.length * GROUP.pitch;
    el('text', { class: 'qi-label qi-lk__slot-label', x: GROUP.x + LOOKUP.labelDx, y: slotY + 20 }, framesG, 'lookup');
    el('rect', { class: 'qi-lk__slot', x: GROUP.x + LOOKUP.dx, y: slotY, width: DOC.w, height: DOC.h, rx: 6 }, framesG);
    y += h + GROUP.gap;

    // The copy that travels from documents into this group's slot. Drawn
    // after every frame so it stays on top while it crosses them.
    const di = DOCS.findIndex((d) => d.id === grp.id);
    const copy = docRow(copiesG, DOCS[di]);
    copy.classList.add('qi-lk__copy');
    copy.style.transitionDelay = `${gi * STAGGER_MS}ms`;
    return { el: copy, from: docAt(di), to: { x: GROUP.x + LOOKUP.dx, y: slotY }, doc: docEls[di] };
  });
  const unused = docEls.filter((_, i) => !GROUPS.some((g) => g.id === DOCS[i].id));

  let on = false;

  function render() {
    node.classList.toggle('is-on', on);
    toggle.setAttribute('aria-pressed', String(on));
    copies.forEach((c) => {
      const at = on ? c.to : c.from;
      c.el.style.transform = `translate(${at.x}px, ${at.y}px)`;
    });
    unused.forEach((g) => g.classList.toggle('is-unused', on));
    statusEl.innerHTML = on ? STATUS.on : STATUS.off;
  }

  toggle.addEventListener('click', () => {
    on = !on;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
