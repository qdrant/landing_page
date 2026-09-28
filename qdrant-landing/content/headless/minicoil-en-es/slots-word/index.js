/*
 * slots-word island: one concept slot, two senses, two languages.
 *
 * Pick a use of the concept {bat, murciélago, bate} and compare the sparse
 * vectors of miniCOIL v1 and miniCOIL EN-ES.
 * - "Dracula's bat": both models write "bat" into its block, with values for the
 *   animal sense; the context word "dracula" falls back to one BM25 cell.
 * - "a baseball bat": the same "bat" cells with values for the other sense;
 *   "baseball" writes into a slot of its own, in the far part of the vector.
 * - "el murciélago": v1 has no slot for it and falls back to one BM25 cell;
 *   EN-ES writes it into the concept block, close to the animal "bat".
 *
 * Every state draws the same vector: 8 cells, "…", a compressed far region of 8
 * thin slivers, "…", 2 cells. Only fills and values change, so the figure keeps
 * its size and positions while the reader switches uses.
 *
 * The example is illustrative: slots, fallbacks and values show the mechanism,
 * not a lookup in the released models. Pure SVG on the shared island design
 * system (islands.scss), on a light card that matches the static figures.
 * Below a container width of 560px the vector wraps onto several lines.
 */

const NS = 'http://www.w3.org/2000/svg';
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);

// The vector, in drawing order. Cells are numbered 0-9; slivers 0-7.
const ITEMS = [
  ...range(0, 8).map((i) => ({ t: 'cell', i })),
  { t: 'dots' },
  { t: 'zone' },
  { t: 'dots' },
  { t: 'cell', i: 8 },
  { t: 'cell', i: 9 },
];
const FB = 8; // the BM25 fallback cell, after the far region
const SLIVERS = 8;

const BAT_4 = 'word "bat", 4D';
const BAT_8 = 'concept {"bat", "murciélago", "bate"}, 8D';
const OOV = 'BM25 fallback (OOV)';
const DRACULA = OOV; // Dracula falls back like any out-of-vocabulary word

// Per use and model: blocks of cells, and optionally the slivers another slot
// of the same text lights up in the far region.
const USES = {
  dracula: {
    chip: "Dracula's bat",
    v1: {
      blocks: [
        { cells: range(0, 4), vals: ['0.62', '−0.11', '0.48', '0.20'], kind: 'word', label: BAT_4 },
        { cells: [FB], vals: ['1.0'], kind: 'fallback', label: DRACULA },
      ],
    },
    enes: {
      blocks: [
        { cells: range(0, 8), vals: ['0.52', '−0.31', '0.44', '0.18', '−0.40', '0.27', '0.36', '−0.12'], kind: 'concept', label: BAT_8 },
        { cells: [FB], vals: ['1.0'], kind: 'fallback', label: DRACULA },
      ],
    },
    say: 'Dracula\'s bat, the animal: both models write "bat" into their slot, and "Dracula" falls back to BM25 in both.',
  },
  baseball: {
    chip: 'a baseball bat',
    v1: {
      blocks: [{ cells: range(0, 4), vals: ['−0.35', '0.71', '−0.22', '0.40'], kind: 'word', label: BAT_4 }],
      far: { n: 4, kind: 'word' }, // "baseball", 4D
    },
    enes: {
      blocks: [{ cells: range(0, 8), vals: ['−0.38', '0.46', '−0.20', '0.51', '0.29', '−0.35', '0.12', '0.41'], kind: 'concept', label: BAT_8 }],
      far: { n: 8, kind: 'concept' }, // {"baseball", "béisbol"}, 8D
    },
    say: 'A baseball bat: the same "bat" cells as Dracula\'s bat, with different values for the other sense; "baseball" writes into a slot of its own, further in the vector.',
  },
  murcielago: {
    chip: 'el murciélago',
    v1: { blocks: [{ cells: [FB + 1], vals: ['1.0'], kind: 'fallback', label: OOV }] }, // its own token, so not Dracula's cell
    enes: {
      blocks: [{ cells: range(0, 8), vals: ['0.49', '−0.28', '0.47', '0.15', '−0.37', '0.30', '0.33', '−0.10'], kind: 'concept', label: BAT_8 }],
    },
    say: 'El murciélago: miniCOIL v1 has no slot for it and falls back to BM25; miniCOIL EN-ES writes it into the "bat" cells, with values close to Dracula\'s bat.',
  },
};
const ROWS = [
  { key: 'v1', tag: 'miniCOIL v1' },
  { key: 'enes', tag: 'miniCOIL EN-ES' },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const est = (t, px) => t.length * px * 0.64; // mono text width, with margin over Geist Mono's 0.6em advance
const split = (label) => label.split('\n');

// Geometry in SVG user units. At the article's desktop width the card's content
// area is ~644 CSS px, so 680 units render text at ~0.95x (15 units -> ~14.2px).
const WIDE = { vb: 680, cw: 50, gap: 4, dotsW: 18, sw: 7, sgap: 3, px: 15, wide: true };
const NARROW = { vb: 360, cw: 60, gap: 6, dotsW: 18, sw: 7, sgap: 3, px: 14, wide: false };
const CH = 44; // cell and sliver height

// Flow the vector's items into lines that fit the drawing width.
function flow(g) {
  const avail = g.vb - 16;
  const widthOf = (it) => (it.t === 'cell' ? g.cw : it.t === 'dots' ? g.dotsW : SLIVERS * (g.sw + g.sgap) - g.sgap);
  const pos = [];
  let line = 0;
  let x = 0;
  ITEMS.forEach((it) => {
    const w = widthOf(it);
    if (x > 0 && x + w > avail) {
      line += 1;
      x = 0;
    }
    pos.push({ ...it, x, w, line });
    x += w + g.gap;
  });
  const width = Math.max(...pos.map((p) => p.x + p.w));
  const lineWidths = [...new Set(pos.map((p) => p.line))].map((l) => Math.max(...pos.filter((p) => p.line === l).map((p) => p.x + p.w)));
  return { pos, lines: line + 1, x0: (g.vb - (g.wide ? width : Math.max(...lineWidths))) / 2 };
}

export function mount(node) {
  node.classList.add('qi-sw');
  const keys = Object.keys(USES);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Pick a use of the concept">',
    keys.map((k) => `<button type="button" class="qi-chip" data-use="${k}" aria-pressed="false">${USES[k].chip}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-sw__svg" role="img"></svg>',
    '  <p class="qi-sw__sr" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-sw__svg');
  const statusEl = node.querySelector('.qi-sw__sr');
  const chips = [...node.querySelectorAll('.qi-chip')];
  let use = 'dracula';
  let geo = WIDE;

  function text(x, y, str, cls, anchor, px) {
    const t = el('text', { class: cls, x, y, 'text-anchor': anchor, style: `font-size: ${px}px` });
    split(str).forEach((p, i) => t.appendChild(el('tspan', { x, dy: i ? px + 5 : 0 }, p)));
    svg.appendChild(t);
  }

  function drawRow(spec, tag, y, layout) {
    const g = geo;
    const { pos, lines, x0 } = layout;
    const lineH = CH + (g.wide ? 0 : 22);
    svg.appendChild(el('text', { class: 'qi-sw__tag', x: x0, y: y + 16, style: `font-size: ${g.px}px` }, tag));
    y += 30;
    const X = (p) => x0 + p.x;
    const Y = (p) => y + p.line * lineH;
    const cellPos = new Map(pos.filter((p) => p.t === 'cell').map((p) => [p.i, p]));

    const cellOf = new Map();
    spec.blocks.forEach((b) => b.cells.forEach((c, i) => cellOf.set(c, { kind: b.kind, val: b.vals[i] })));

    pos.forEach((p) => {
      if (p.t === 'cell') {
        const on = cellOf.get(p.i);
        svg.appendChild(el('rect', { class: `qi-sw__cell${on ? ` qi-sw__cell--${on.kind}` : ''}`, x: X(p), y: Y(p), width: g.cw, height: CH, rx: 5 }));
        if (on) text(X(p) + g.cw / 2, Y(p) + CH / 2 + 5, on.val, 'qi-sw__val', 'middle', g.px);
      } else if (p.t === 'dots') {
        text(X(p) + g.dotsW / 2, Y(p) + CH / 2 + 5, '…', 'qi-sw__dots', 'middle', g.px);
      } else {
        const lit = spec.far ? spec.far.n : 0;
        for (let s = 0; s < SLIVERS; s++) {
          const cls = s < lit ? `qi-sw__sliver qi-sw__sliver--${spec.far.kind}` : 'qi-sw__sliver';
          svg.appendChild(el('rect', { class: cls, x: X(p) + s * (g.sw + g.sgap), y: Y(p), width: g.sw, height: CH, rx: 2 }));
        }
      }
    });

    // Brackets under each block (one per line it occupies). Lit slivers carry no
    // bracket or label: they only show that another slot of the text is written.
    const bracket = (x1, x2, by, kind) =>
      svg.appendChild(el('path', { class: `qi-sw__bracket qi-sw__bracket--${kind}`, d: `M${x1},${by} v8 H${x2} v-8` }));
    spec.blocks.forEach((b) => {
      const byLine = new Map();
      b.cells.forEach((c) => {
        const p = cellPos.get(c);
        byLine.set(p.line, [...(byLine.get(p.line) || []), p]);
      });
      byLine.forEach((ps) => bracket(X(ps[0]), X(ps[ps.length - 1]) + g.cw, Y(ps[0]) + CH + 8, b.kind));
    });
    const zone = pos.find((p) => p.t === 'zone');

    // Labels, on two reserved lines. Wide: centered under their bracket, the far
    // slot's label on the second line so it never meets the first-line labels.
    // Narrow: a left-aligned list.
    const bottom = y + (lines - 1) * lineH + CH;
    const labels = [...spec.blocks.map((b) => ({ label: b.label, kind: b.kind, x1: X(cellPos.get(b.cells[0])), x2: X(cellPos.get(b.cells[b.cells.length - 1])) + g.cw, row: 0 }))];
    if (g.wide) {
      labels.forEach((l) => {
        const half = Math.max(...split(l.label).map((p) => est(p, g.px))) / 2;
        const cx = Math.min(Math.max((l.x1 + l.x2) / 2, x0 + half), g.vb - x0 - half);
        text(cx, bottom + 40 + l.row * 20, l.label, `qi-sw__label qi-sw__label--${l.kind}`, 'middle', g.px);
      });
      return bottom + 40 + 20 + 16;
    }
    labels.forEach((l, i) => text(x0, bottom + 34 + i * 19, l.label.replace('\n', ' '), `qi-sw__label qi-sw__label--${l.kind}`, 'start', 13));
    return bottom + 34 + 2 * 19 + 8; // two list lines reserved in every state
  }

  function render() {
    const layout = flow(geo);
    svg.replaceChildren();
    let y = 8;
    ROWS.forEach((row) => {
      y = drawRow(USES[use][row.key], row.tag, y, layout) + 16;
    });
    svg.setAttribute('viewBox', `0 0 ${geo.vb} ${y}`);
    svg.setAttribute('aria-label', `Cells written by "${USES[use].chip}" in miniCOIL v1 and in miniCOIL EN-ES.`);
    statusEl.textContent = USES[use].say; // read by screen readers only
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.use === use)));
  }

  chips.forEach((b) =>
    b.addEventListener('click', () => {
      use = b.dataset.use;
      render();
    }),
  );

  // Switch layouts by the island's own width, not the viewport.
  const ro = new ResizeObserver(([entry]) => {
    const next = entry.contentRect.width < 560 ? NARROW : WIDE;
    if (next !== geo) {
      geo = next;
      render();
    }
  });
  ro.observe(node);

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
