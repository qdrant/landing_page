/*
 * ball-carving island: randomized ball carving in three steps.
 *
 * Panel 1 picks leaders, panel 2 shows one point joining its two nearest
 * leaders (fanout 2 here for readability, the article uses 7 and then 2), and
 * panel 3 shows the resulting overlapping groups. Select a step to focus on
 * it. The point positions are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const S = 0.88; // scale from the 270 x 340 sketch to a 240 x 300 panel
const PANEL_W = 240;
const PANEL_H = 300;
const PANEL_Y = 62;
const PITCH = 260;

const POINTS = [[30, 130], [85, 45], [35, 100], [205, 150], [150, 240], [40, 215], [250, 130], [170, 40]];
const X = [135, 140];
const Y = [100, 150];
const LEADERS = [
  { id: 'L1', at: [60, 90] },
  { id: 'L2', at: [215, 80] },
  { id: 'L3', at: [110, 190] },
  { id: 'L4', at: [225, 215] },
];

const STEPS = [
  { title: '1. Pick leaders', sub: 'A random sample', chip: 'Step 1' },
  { title: '2. Join leaders', sub: 'Each point picks 2', chip: 'Step 2' },
  { title: '3. Groups overlap', sub: 'x and y sit in two', chip: 'Step 3' },
];

const STATUS = [
  'Any group still larger than 1,024 points repeats the process with a smaller fanout. Select a step to focus on it.',
  'Step 1: a random sample of the points become leaders (L1 to L4). Every group is built around one leader.',
  'Step 2: with a fanout of 2, each point joins its two nearest leaders. Point x joins L3 (nearest, solid) and L1 (second nearest, dashed).',
  'Step 3: the groups overlap, so border points such as x and y sit in the groups of both L1 and L3 and keep neighbors from each side.',
];

let instanceId = 0;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

const sc = ([x, y]) => [x * S, y * S];

export function mount(node) {
  const uid = ++instanceId;
  node.classList.add('pn-bc');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Carving step">',
    STEPS.map((s, i) => `<button type="button" class="qi-chip" data-step="${i + 1}" aria-pressed="false">${s.chip}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg" viewBox="0 0 760 ${PANEL_Y + PANEL_H + 8}" role="img" aria-label="Three panels. Random leaders are picked, each point joins its two nearest leaders, and the resulting groups overlap so border points sit in both."></svg>`,
    '  <p class="qi-status qi-status--2" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.qi-status');
  const chips = [...node.querySelectorAll('[data-step]')];

  svg.appendChild(
    el('defs', {}),
  ).innerHTML = `<marker id="pn-bc-arrow-${uid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="pn-bc__arrowhead" d="M0 0L10 5L0 10Z"/></marker>`;

  const panels = STEPS.map((step, i) => {
    const g = el('g', { class: 'pn-bc__panel', transform: `translate(${i * PITCH} 0)` });
    svg.appendChild(g);
    g.appendChild(el('text', { class: 'qi-title', x: 0, y: 16 }, step.title));
    g.appendChild(el('text', { class: 'qi-label', x: 0, y: 38 }, step.sub));
    g.appendChild(el('clipPath', { id: `pn-bc-clip-${uid}-${i}` })).appendChild(
      el('rect', { x: 0, y: PANEL_Y, width: PANEL_W, height: PANEL_H, rx: 10 }),
    );
    g.appendChild(el('rect', { class: 'qi-frame', x: 0, y: PANEL_Y, width: PANEL_W, height: PANEL_H, rx: 10 }));
    const inner = el('g', { 'clip-path': `url(#pn-bc-clip-${uid}-${i})` });
    g.appendChild(inner);
    const c = el('g', { transform: `translate(0 ${PANEL_Y})` });
    inner.appendChild(c);
    return { g, c, i };
  });

  const dot = (c, p, cls, r = 4) => {
    const [x, y] = sc(p);
    c.appendChild(el('circle', { class: cls, cx: x, cy: y, r }));
  };

  panels.forEach(({ c, i }) => {
    // Step 3: group circles under everything else.
    if (i === 2) {
      const [x1, y1] = sc(LEADERS[0].at);
      const [x3, y3] = sc(LEADERS[2].at);
      c.appendChild(el('circle', { class: 'pn-bc__ball', cx: x1, cy: y1, r: 95 * S }));
      c.appendChild(el('circle', { class: 'pn-bc__ball pn-bc__ball--dashed', cx: x3, cy: y3, r: 85 * S }));
    }
    // Step 2: arrows from x to its two nearest leaders.
    if (i === 1) {
      const arrow = (to, dashed) => {
        const [ax, ay] = sc(X);
        const [bx, by] = sc(to);
        const len = Math.hypot(bx - ax, by - ay);
        const k = (len - 13) / len;
        c.appendChild(
          el('line', {
            class: `pn-bc__arrow${dashed ? ' pn-bc__arrow--dashed' : ''}`,
            x1: ax, y1: ay, x2: ax + (bx - ax) * k, y2: ay + (by - ay) * k,
            'marker-end': `url(#pn-bc-arrow-${uid})`,
          }),
        );
      };
      arrow(LEADERS[2].at, false);
      arrow(LEADERS[0].at, true);
    }
    POINTS.forEach((p) => dot(c, p, 'pn-bc__dot'));
    const hot = i > 0;
    dot(c, X, hot ? 'pn-bc__dot pn-bc__dot--hot' : 'pn-bc__dot', hot && i === 2 ? 6 : 4);
    dot(c, Y, hot ? 'pn-bc__dot pn-bc__dot--hot' : 'pn-bc__dot', hot && i === 2 ? 6 : 4);
    if (hot) {
      const [xx, xy] = sc(X);
      const [yx, yy] = sc(Y);
      c.appendChild(el('text', { class: 'pn-bc__name', x: xx + 9, y: xy - 8 }, 'x'));
      c.appendChild(el('text', { class: 'pn-bc__name', x: yx - 18, y: yy - 8 }, 'y'));
    }
    LEADERS.forEach((l) => {
      const [x, y] = sc(l.at);
      c.appendChild(el('rect', { class: 'pn-bc__leader', x: x - 7, y: y - 7, width: 14, height: 14, rx: 3 }));
      c.appendChild(el('text', { class: 'pn-bc__leader-label', x: x + 11, y: y - 9 }, l.id));
    });
    if (i === 1) {
      c.appendChild(el('text', { class: 'pn-bc__legend pn-bc__legend--red', x: 12, y: 270 }, 'solid: nearest'));
      c.appendChild(el('text', { class: 'pn-bc__legend pn-bc__legend--red', x: 12, y: 290 }, 'dashed: second nearest'));
    }
    if (i === 2) {
      c.appendChild(el('text', { class: 'pn-bc__legend', x: 12, y: 270 }, 'Solid circle: group of L1'));
      c.appendChild(el('text', { class: 'pn-bc__legend', x: 12, y: 290 }, 'Dashed circle: group of L3'));
    }
  });

  let selected = null;
  function render() {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === selected)));
    panels.forEach(({ g, i }) => g.classList.toggle('is-dim', selected !== null && selected !== i + 1));
    statusEl.textContent = STATUS[selected || 0];
  }
  chips.forEach((b) =>
    b.addEventListener('click', () => {
      const n = Number(b.dataset.step);
      selected = selected === n ? null : n;
      render();
    }),
  );

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
