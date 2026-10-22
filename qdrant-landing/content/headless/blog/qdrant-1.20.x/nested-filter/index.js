/*
 * nested filter island for blog/qdrant-1.20.x.
 *
 * Two points in a collection, each with two offers, filtered on shop A and a
 * price under $100. Each offer's shop and price are drawn as chips, colored
 * when they meet a condition:
 *   - with nested on, both conditions must hold for the same offer, so only
 *     point 9 matches, through its second offer;
 *   - with nested off, each condition can match a different offer, so point 7
 *     matches too.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Condition
 * hues are constant across themes.
 */

const NS = 'http://www.w3.org/2000/svg';

const CONDITIONS = [
  { key: 'shop', label: 'shop = A', test: (o) => o.shop === 'A' },
  { key: 'price', label: 'price < $100', test: (o) => o.price < 100 },
];

const POINTS = [
  { id: 7, offers: [{ shop: 'A', price: 500 }, { shop: 'B', price: 50 }] },
  { id: 9, offers: [{ shop: 'B', price: 120 }, { shop: 'A', price: 80 }] },
];

// Geometry (viewBox 760 x 184).
const VB_W = 760;
const VB_H = 184;
const FILTER = { y: 2, h: 20, labelX: 0, x: 60, gap: 8, widths: [96, 124] };
const FRAME = { y: 36, pad: 14, head: 34, pitch: 52 };
const ROW = { x: 14, w: VB_W - 28, h: 44 };
const OFFER = { x: [96, 332], y: 6, w: 224, h: 32 };
const CHIP = { y: 6, h: 20, shopX: 8, shopW: 88, priceX: 104, priceW: 112 };
const VERDICT_X = 580;
const FRAME_H = FRAME.head + POINTS.length * FRAME.pitch - (FRAME.pitch - ROW.h) + FRAME.pad;

const STATUS = {
  on: 'With <code>nested</code>, a single offer must meet both conditions. Only point 9 has an offer from shop A under $100.',
  off: 'Without <code>nested</code>, each condition can match a different offer. Point 7 matches too: one offer is from shop A, and another is under $100.',
};

function el(name, attrs, parent, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

// A chip for one value or condition. Colored by condition when `cond` is set.
function chip(parent, text, x, y, w, cond) {
  const g = el('g', { class: 'qi-nf__chip' + (cond ? ` qi-nf__chip--${cond}` : '') }, parent);
  el('rect', { x, y, width: w, height: CHIP.h, rx: 3 }, g);
  el('text', { x: x + w / 2, y: y + 14, 'text-anchor': 'middle' }, g, text);
  return g;
}

const matchesNested = (p) => p.offers.some((o) => CONDITIONS.every((c) => c.test(o)));
const matchesFlat = (p) => CONDITIONS.every((c) => p.offers.some((o) => c.test(o)));

export function mount(node) {
  node.classList.add('qi-nf');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip" data-nested aria-pressed="true">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>nested: offers',
    '    </button>',
    '  </div>',
    `  <svg class="qi-svg qi-nf__svg" viewBox="-2 0 ${VB_W + 4} ${VB_H}" role="img"`,
    '    aria-label="A filter on shop A and a price under 100 dollars, applied to two points with two offers each. Point 7 has a shop A offer and a different offer under 100 dollars. Point 9 has one shop A offer for 80 dollars.">',
    '  </svg>',
    '  <p class="qi-status qi-status--2 qi-nf__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-nf__svg');
  const statusEl = node.querySelector('.qi-nf__status');
  const toggle = node.querySelector('[data-nested]');

  // The filter: one chip per condition, in its condition color.
  el('text', { class: 'qi-label', x: FILTER.labelX, y: FILTER.y + 14 }, svg, 'filter');
  let fx = FILTER.x;
  CONDITIONS.forEach((c, i) => {
    chip(svg, c.label, fx, FILTER.y, FILTER.widths[i], c.key);
    fx += FILTER.widths[i] + FILTER.gap;
  });

  // The collection, with one row per point.
  el('rect', { class: 'qi-frame', x: 0, y: FRAME.y, width: VB_W, height: FRAME_H, rx: 6 }, svg);
  el('text', { class: 'qi-frame-label', x: 14, y: FRAME.y + 22 }, svg, 'Collection');
  OFFER.x.forEach((x, i) => {
    el('text', { class: 'qi-label', x: ROW.x + x + 8, y: FRAME.y + 22 }, svg, `offers[${i}]`);
  });

  const rows = POINTS.map((p, r) => {
    const y = FRAME.y + FRAME.head + r * FRAME.pitch;
    const g = el('g', { class: 'qi-nf__row', transform: `translate(${ROW.x} ${y})` }, svg);
    el('rect', { class: 'qi-nf__box', width: ROW.w, height: ROW.h, rx: 6 }, g);
    el('text', { class: 'qi-label qi-label--strong', x: 12, y: 27 }, g, `Point ${p.id}`);
    const offers = p.offers.map((o, i) => {
      const x = OFFER.x[i];
      const og = el('g', { class: 'qi-nf__offer' }, g);
      el('rect', { class: 'qi-nf__offer-box', x, y: OFFER.y, width: OFFER.w, height: OFFER.h, rx: 4 }, og);
      const [shop, price] = CONDITIONS;
      chip(og, `shop: ${o.shop}`, x + CHIP.shopX, OFFER.y + CHIP.y, CHIP.shopW, shop.test(o) && shop.key);
      chip(og, `price: $${o.price}`, x + CHIP.priceX, OFFER.y + CHIP.y, CHIP.priceW, price.test(o) && price.key);
      return { el: og, both: CONDITIONS.every((c) => c.test(o)) };
    });
    const verdict = el('text', { class: 'qi-label qi-nf__verdict', x: VERDICT_X, y: 27 }, g);
    return { p, el: g, offers, verdict };
  });

  let nested = true;

  function render() {
    toggle.setAttribute('aria-pressed', String(nested));
    rows.forEach((r) => {
      const match = nested ? matchesNested(r.p) : matchesFlat(r.p);
      r.el.classList.toggle('is-miss', !match);
      r.verdict.textContent = match ? 'match' : 'no match';
      r.verdict.classList.toggle('qi-label--strong', match);
      // With nested on, the offer that meets both conditions is the reason for the match.
      r.offers.forEach((o) => o.el.classList.toggle('is-hot', nested && o.both));
    });
    statusEl.innerHTML = nested ? STATUS.on : STATUS.off;
  }

  toggle.addEventListener('click', () => {
    nested = !nested;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
