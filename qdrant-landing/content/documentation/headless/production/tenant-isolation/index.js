/*
 * tenant-isolation island: one collection, many tenants.
 *
 * Every tenant's points live in a single collection and carry the tenant in a
 * payload field (group_id). A query filtered on that field only reaches that
 * tenant's points. Select a tenant to see which points its query can return.
 * The points and vectors are the sample values from the production guide.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Wide
 * containers lay the points out in a row; narrow ones stack them.
 */

const NS = 'http://www.w3.org/2000/svg';

const NARROW_PX = 560;
const CARD_H = 84;
const PILL_H = 32;

const POINTS = [
  { id: 1, tenant: 'tenant_1', vector: '[0.9, 0.1, 0.1]' },
  { id: 2, tenant: 'tenant_1', vector: '[0.1, 0.9, 0.1]' },
  { id: 3, tenant: 'tenant_2', vector: '[0.1, 0.1, 0.9]' },
];
const TENANTS = [
  { id: 'tenant_1', label: 'Tenant 1' },
  { id: 'tenant_2', label: 'Tenant 2' },
];

const OVERVIEW =
  'One collection holds every tenant. Each point carries its tenant in the group_id payload field. Select a tenant to see what its filtered query can reach.';

function status(t) {
  const own = POINTS.filter((p) => p.tenant === t.id).map((p) => p.id);
  const other = POINTS.filter((p) => p.tenant !== t.id).map((p) => p.id);
  const list = (ids) => (ids.length === 1 ? `point ${ids[0]}` : `points ${ids.join(' and ')}`);
  return `<b>${t.label}</b> queries with the filter group_id = ${t.id}, so only ${list(own)} can be returned. ${list(other).replace(/^p/, 'P')} belongs to the other tenant and never appears in the results.`;
}

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-ti');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Tenant">',
    TENANTS.map(
      (t) =>
        `<button type="button" class="qi-chip qi-ti__chip qi-ti__chip--${t.id}" data-tenant="${t.id}" aria-pressed="false">` +
        `<span class="qi-chip__swatch" aria-hidden="true"></span>${t.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-ti__svg" role="img"',
    '    aria-label="A collection named tenant_data holding three points. Points 1 and 2 belong to tenant 1 and point 3 belongs to tenant 2, each tagged with a group_id payload value.">',
    '  </svg>',
    '  <p class="qi-status qi-status--3 qi-ti__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-ti__svg');
  const statusEl = node.querySelector('.qi-ti__status');
  const chips = [...node.querySelectorAll('.qi-ti__chip')];

  let selected = null;
  let narrow = null;
  let cards = [];
  let links = [];
  let pills = [];

  function build() {
    svg.replaceChildren();
    cards = [];
    links = [];
    pills = [];
    node.dataset.layout = narrow ? 'column' : 'row';

    let W;
    let H;
    let cardPos; // [x, y, w]
    let pillPos; // tenant id -> [x, y, w]
    let route; // (tenantId, point) -> path d
    const framePad = 12;

    if (narrow) {
      W = 340;
      const cardW = 216;
      const cardX = W - cardW - framePad;
      cardPos = POINTS.map((_, i) => [cardX, framePad + 28 + i * (CARD_H + 12), cardW]);
      H = framePad + 28 + 3 * (CARD_H + 12) - 12 + 24 + framePad;
      const centerY = (ids) => ids.map((i) => cardPos[i][1] + CARD_H / 2).reduce((a, b) => a + b, 0) / ids.length;
      pillPos = {
        tenant_1: [0, centerY([0, 1]) - PILL_H / 2, 84],
        tenant_2: [0, centerY([2]) - PILL_H / 2, 84],
      };
      route = (tid, i) => {
        const p = pillPos[tid];
        const x1 = p[0] + p[2];
        const y1 = p[1] + PILL_H / 2;
        const x2 = cardPos[i][0];
        const y2 = cardPos[i][1] + CARD_H / 2;
        const mid = x1 + (x2 - x1) / 2;
        return `M${x1} ${y1}H${mid}V${y2}H${x2}`;
      };
      // Collection frame spans the card column plus its label.
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.appendChild(el('rect', { class: 'qi-frame', x: cardX - framePad, y: 0, width: cardW + 2 * framePad, height: H, rx: 6 }));
      svg.appendChild(el('text', { class: 'qi-ti__collection', x: cardX, y: H - framePad - 4 }, 'collection_name="tenant_data"'));
    } else {
      W = 760;
      const cardW = 220;
      const gap = 20;
      const x0 = (W - (3 * cardW + 2 * gap)) / 2;
      const cardY = 112;
      cardPos = POINTS.map((_, i) => [x0 + i * (cardW + gap), cardY, cardW]);
      const centers = cardPos.map((c) => c[0] + c[2] / 2);
      pillPos = {
        tenant_1: [(centers[0] + centers[1]) / 2 - 48, 4, 96],
        tenant_2: [centers[2] - 48, 4, 96],
      };
      route = (tid, i) => {
        const p = pillPos[tid];
        const x1 = p[0] + p[2] / 2;
        const y1 = p[1] + PILL_H;
        const x2 = centers[i];
        return `M${x1} ${y1}V74H${x2}V${cardPos[i][1]}`;
      };
      H = cardY + CARD_H + 44;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.appendChild(el('rect', { class: 'qi-frame', x: x0 - framePad, y: 92, width: 3 * cardW + 2 * gap + 2 * framePad, height: H - 92, rx: 6 }));
      svg.appendChild(el('text', { class: 'qi-ti__collection', x: x0, y: cardY + CARD_H + 28 }, 'collection_name="tenant_data"'));
    }

    // Connectors first so the cards and pills sit on top of them.
    POINTS.forEach((pt, i) => {
      const path = el('path', { class: `qi-ti__link qi-ti__link--${pt.tenant}`, d: route(pt.tenant, i), 'data-tenant': pt.tenant });
      svg.appendChild(path);
      links.push(path);
    });

    POINTS.forEach((pt, i) => {
      const [x, y, w] = cardPos[i];
      const g = el('g', { class: `qi-ti__card qi-ti__card--${pt.tenant}`, 'data-tenant': pt.tenant, transform: `translate(${x} ${y})` });
      g.appendChild(el('rect', { class: 'qi-ti__card-box', width: w, height: CARD_H, rx: 4 }));
      g.appendChild(el('text', { class: 'qi-ti__card-id', x: 12, y: 24 }, `id=${pt.id}`));
      g.appendChild(el('text', { class: 'qi-label', x: 12, y: 46 }, `group_id: "${pt.tenant}"`));
      g.appendChild(el('text', { class: 'qi-label', x: 12, y: 66 }, `vector: ${pt.vector}`));
      svg.appendChild(g);
      cards.push(g);
    });

    TENANTS.forEach((t) => {
      const [x, y, w] = pillPos[t.id];
      const g = el('g', { class: `qi-ti__pill qi-ti__pill--${t.id}`, 'data-tenant': t.id, transform: `translate(${x} ${y})` });
      g.appendChild(el('rect', { class: 'qi-ti__pill-box', width: w, height: PILL_H, rx: 6 }));
      g.appendChild(el('text', { class: 'qi-ti__pill-text', x: w / 2, y: PILL_H / 2 + 5, 'text-anchor': 'middle' }, t.label));
      g.addEventListener('click', () => select(t.id));
      svg.appendChild(g);
      pills.push(g);
    });
    render();
  }

  function render() {
    const mark = (n) => {
      const mine = n.getAttribute('data-tenant') === selected;
      n.classList.toggle('is-active', selected !== null && mine);
      n.classList.toggle('is-dim', selected !== null && !mine);
    };
    [...cards, ...links, ...pills].forEach(mark);
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.tenant === selected)));
    statusEl.innerHTML = selected ? status(TENANTS.find((t) => t.id === selected)) : OVERVIEW;
  }

  function select(id) {
    selected = selected === id ? null : id;
    render();
  }

  function layout() {
    const isNarrow = node.clientWidth > 0 && node.clientWidth < NARROW_PX;
    if (isNarrow === narrow) return;
    narrow = isNarrow;
    build();
  }

  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.tenant)));

  layout();
  if (narrow === null) {
    narrow = false;
    build();
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(node);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
