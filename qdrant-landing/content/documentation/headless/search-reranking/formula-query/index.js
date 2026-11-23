/*
 * formula-query island: how a formula query reorders the candidates of a
 * prefetch.
 *
 * A prefetch returns candidates with a similarity score, payload fields such
 * as popularity and stock sit next to them, and the formula adds boosts to the
 * similarity score before Qdrant returns the top results. The chips switch the
 * ranking between similarity alone and the formula, so the reader sees the
 * same four products change places, and selecting a product shows its score as
 * a sum. The scores are illustrative.
 *
 * Two compositions share one data set. At article width the stages run left to
 * right with the ranked list on the right. Below 700px of rendered width the
 * same stages stack, with the prefetch and the payload fields side by side
 * above the formula, so the in-drawing text stays above 12px at phone width
 * without shrinking the desktop drawing.
 */

const NS = 'http://www.w3.org/2000/svg';
const NARROW_BELOW = 700;

// Illustrative scores for a "white sofa" query. Totals: Linen 0.88, Velvet 0.98,
// Leather 1.00, Sectional 0.86.
const PRODUCTS = [
  { id: 'linen', name: 'Linen 3-seater', sim: 0.86, pop: 0.02, stock: 0.0, out: true },
  { id: 'velvet', name: 'Velvet loveseat', sim: 0.8, pop: 0.1, stock: 0.08 },
  { id: 'leather', name: 'Leather sofa', sim: 0.78, pop: 0.14, stock: 0.08 },
  { id: 'sectional', name: 'Sectional', sim: 0.74, pop: 0.04, stock: 0.08 },
];

const MODES = [
  { id: 'sim', label: 'Similarity only' },
  { id: 'formula', label: 'With formula' },
];

const STAGES = {
  prefetch: { name: 'Prefetch', knobs: '100 candidates', role: 'win' },
  formula: { name: 'Formula', knobs: '$score + boosts', role: 'accent' },
  payload: { name: 'Payload fields', knobs: 'popularity · stock', role: 'cat1', dashed: true },
};

const LAYOUTS = {
  wide: {
    w: 1200,
    h: 420,
    stages: {
      prefetch: { x: 15, y: 40, w: 255, h: 110, nameY: 45, knobsY: 80 },
      formula: { x: 335, y: 40, w: 300, h: 110, nameY: 45, knobsY: 80 },
      payload: { x: 335, y: 250, w: 300, h: 110, nameY: 45, knobsY: 80 },
    },
    wires: ['M270 95 H335', 'M485 250 V150', 'M635 95 H700'],
    panel: { x: 700, y: 15, w: 485, h: 390 },
    title: { x: 725, y: 55 },
    rank: { x: 725 },
    name: { x: 760, dy: 24 },
    suffix: { x: 1170, dy: 24 },
    bar: { x: 760, dy: 36, w: 300, h: 22 },
    value: { x: 1080, dy: 56 },
    rowY0: 80,
    pitch: 78,
  },
  narrow: {
    w: 600,
    h: 700,
    stages: {
      prefetch: { x: 15, y: 10, w: 275, h: 84, nameY: 34, knobsY: 66 },
      payload: { x: 310, y: 10, w: 275, h: 84, nameY: 34, knobsY: 66 },
      formula: { x: 15, y: 124, w: 570, h: 84, nameY: 34, knobsY: 66 },
    },
    wires: ['M152 94 V124', 'M447 94 V124', 'M300 208 V248'],
    panel: { x: 15, y: 248, w: 570, h: 440 },
    title: { x: 35, y: 290 },
    rank: { x: 35 },
    name: { x: 65, dy: 26 },
    suffix: { x: 565, dy: 26 },
    bar: { x: 65, dy: 40, w: 380, h: 24 },
    value: { x: 465, dy: 62 },
    rowY0: 312,
    pitch: 92,
  },
};

const total = (p) => p.sim + p.pop + p.stock;
const fmt = (n) => n.toFixed(2);

function stageMarkup(id, g) {
  const s = STAGES[id];
  const L = g.stages[id];
  const cx = L.x + L.w / 2;
  const fill = s.dashed ? 'fill="none" stroke-dasharray="7 6"' : `fill="var(--fq-${s.role}-fill)"`;
  return [
    `<g class="qi-fq__stage">`,
    `<rect class="qi-fq__box qi-fq__box--${s.role}" x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" rx="10" ${fill}/>`,
    `<text class="qi-fq__name qi-fq__name--${s.role}" x="${cx}" y="${L.y + L.nameY}" text-anchor="middle">${s.name}</text>`,
    `<text class="qi-fq__knobs qi-fq__knobs--${s.role}" x="${cx}" y="${L.y + L.knobsY}" text-anchor="middle">${s.knobs}</text>`,
    `</g>`,
  ].join('');
}

function rowMarkup(p, g) {
  const bar = g.bar;
  const simW = p.sim * bar.w;
  const popW = p.pop * bar.w;
  const stockW = p.stock * bar.w;
  const hitX = g.panel.x + 10;
  const hitW = g.panel.w - 20;
  const rowTop = g.rowY0 - 6;
  return [
    `<g class="qi-fq__row" data-product="${p.id}" role="button" tabindex="0" aria-pressed="false">`,
    `<rect class="qi-fq__hit" x="${hitX}" y="${rowTop}" width="${hitW}" height="${g.pitch - 10}" rx="6"/>`,
    `<text class="qi-fq__pname" x="${g.name.x}" y="${g.rowY0 + g.name.dy}">${p.name}</text>`,
    p.out
      ? `<text class="qi-fq__suffix" x="${g.suffix.x}" y="${g.rowY0 + g.suffix.dy}" text-anchor="end">out of stock</text>`
      : '',
    `<rect class="qi-fq__seg qi-fq__seg--sim" x="${bar.x}" y="${g.rowY0 + bar.dy}" width="${simW}" height="${bar.h}"/>`,
    `<rect class="qi-fq__seg qi-fq__seg--pop qi-fq__boost" x="${bar.x + simW}" y="${g.rowY0 + bar.dy}" width="${popW}" height="${bar.h}"/>`,
    `<rect class="qi-fq__seg qi-fq__seg--stock qi-fq__boost" x="${bar.x + simW + popW}" y="${g.rowY0 + bar.dy}" width="${stockW}" height="${bar.h}"/>`,
    `<text class="qi-fq__value" x="${g.value.x}" y="${g.rowY0 + g.value.dy}"></text>`,
    `</g>`,
  ].join('');
}

function svgMarkup(g, mode) {
  const rankLabels = PRODUCTS.map(
    (_, i) =>
      `<text class="qi-fq__rank" x="${g.rank.x}" y="${g.rowY0 + i * g.pitch + g.name.dy}">${i + 1}</text>`,
  ).join('');
  return [
    `<svg class="qi-svg qi-fq__svg" viewBox="0 0 ${g.w} ${g.h}" role="group"`,
    ' aria-label="A prefetch returns 100 candidates with similarity scores. A formula adds boosts from payload fields, such as popularity and stock, to each score, and the top results are returned in the new order.">',
    '<defs>',
    '<marker id="qi-fq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '<path d="M0 0 L10 5 L0 10 z" class="qi-fq__arrowhead"/>',
    '</marker>',
    '</defs>',
    g.wires.map((d) => `<path class="qi-fq__wire" d="${d}" marker-end="url(#qi-fq-arrow)"/>`).join(''),
    ['prefetch', 'payload', 'formula'].map((id) => stageMarkup(id, g)).join(''),
    `<rect class="qi-fq__panel" x="${g.panel.x}" y="${g.panel.y}" width="${g.panel.w}" height="${g.panel.h}" rx="10"/>`,
    `<text class="qi-fq__title" x="${g.title.x}" y="${g.title.y}"></text>`,
    rankLabels,
    PRODUCTS.map((p) => rowMarkup(p, g)).join(''),
    '</svg>',
  ].join('');
}

export function mount(node) {
  node.classList.add('qi-fq');

  node.innerHTML = [
    '<div class="qi-fig qi-fq__fig">',
    '  <div class="qi-controls qi-controls--split">',
    '    <div class="qi-group" role="group" aria-label="Ranking">',
    MODES.map((m) => `<button type="button" class="qi-chip" data-mode="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group qi-fq__legend">',
    '      <span class="qi-hint"><i class="qi-chip__swatch" style="--swatch: var(--fq-sim)"></i> Similarity</span>',
    '      <span class="qi-hint"><i class="qi-chip__swatch" style="--swatch: var(--fq-pop)"></i> Popularity boost</span>',
    '      <span class="qi-hint"><i class="qi-chip__swatch" style="--swatch: var(--fq-stock)"></i> In-stock boost</span>',
    '    </div>',
    '  </div>',
    '  <div class="qi-fq__stage"></div>',
    '  <p class="qi-status qi-status--2 qi-fq__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stageEl = node.querySelector('.qi-fq__stage');
  const statusEl = node.querySelector('.qi-fq__status');
  const chips = [...node.querySelectorAll('[data-mode]')];

  let mode = 'sim';
  let selected = null;
  let layout = null;

  const ranked = () =>
    [...PRODUCTS].sort((a, b) => (mode === 'formula' ? total(b) - total(a) : b.sim - a.sim));

  function statusText() {
    const on = mode === 'formula';
    const first = ranked()[0];
    if (selected) {
      const p = PRODUCTS.find((x) => x.id === selected);
      return on
        ? `${p.name}: similarity ${fmt(p.sim)} + popularity ${fmt(p.pop)} + in stock ${fmt(p.stock)} = ${fmt(total(p))}.`
        : `${p.name}: similarity ${fmt(p.sim)}, the only score used for ranking.`;
    }
    return on
      ? `With the formula, the ${first.name} moves to first because popularity and stock add to its similarity score, and the out-of-stock Linen 3-seater drops to third. Select a product to see its score.`
      : 'Ranked by similarity alone, the Linen 3-seater comes first even though it is out of stock and has few reviews. Select a product to see its score.';
  }

  function apply() {
    const on = mode === 'formula';
    const order = ranked();
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.mode === mode)));
    const title = node.querySelector('.qi-fq__title');
    title.textContent = on ? 'Ranked by formula score' : 'Ranked by similarity';
    PRODUCTS.forEach((p) => {
      const row = node.querySelector(`[data-product="${p.id}"]`);
      const slot = order.indexOf(p);
      row.style.transform = `translate(0px, ${slot * layout.pitch}px)`;
      row.classList.toggle('is-on', on);
      row.setAttribute('aria-pressed', String(selected === p.id));
      row.classList.toggle('is-selected', selected === p.id);
      row.querySelector('.qi-fq__value').textContent = fmt(on ? total(p) : p.sim);
      row.setAttribute(
        'aria-label',
        `${p.name}, rank ${slot + 1}, score ${fmt(on ? total(p) : p.sim)}${p.out ? ', out of stock' : ''}`,
      );
    });
    statusEl.textContent = statusText();
  }

  function render() {
    const narrow = (node.getBoundingClientRect().width || 800) < NARROW_BELOW;
    const next = narrow ? 'narrow' : 'wide';
    if (layout && layout.key === next) return;
    layout = { ...LAYOUTS[next], key: next };
    node.classList.toggle('qi-fq--narrow', narrow);
    node.classList.toggle('qi-fq--wide', !narrow);
    node.classList.add('qi-fq--instant');
    stageEl.innerHTML = svgMarkup(layout, mode);
    apply();
    // Re-enable the reorder transition once the new layout has painted.
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('qi-fq--instant')));
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      mode = c.dataset.mode;
      apply();
    }),
  );

  const pick = (row) => {
    const id = row.dataset.product;
    selected = selected === id ? null : id;
    apply();
  };
  stageEl.addEventListener('click', (e) => {
    const row = e.target.closest('[data-product]');
    if (row) pick(row);
  });
  stageEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest('[data-product]');
    if (!row) return;
    e.preventDefault();
    pick(row);
  });

  render();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => render()).observe(node);
  }

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
