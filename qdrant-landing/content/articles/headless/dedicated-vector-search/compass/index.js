/*
 * compass island: interactive replacement for compass.png.
 *
 * Where each family of systems sits between consistency and availability, and
 * between isolation and scalability. The positions are qualitative, taken from
 * the original figure, not measurements. Pick a system to see what it prioritizes.
 */

const NS = 'http://www.w3.org/2000/svg';
const SYSTEMS = [
  {
    id: 'relational',
    chip: 'Relational DBs',
    label: ['Relational DBs', 'e.g. Postgres'],
    x: 0.14,
    y: 0.84,
    text: 'Relational databases center on transactions: strong consistency and isolation, at the cost of harder scaling out.',
  },
  {
    id: 'nosql',
    chip: 'NoSQL',
    label: ['NoSQL', 'e.g. MongoDB'],
    x: 0.27,
    y: 0.3,
    text: 'Many NoSQL stores scale out horizontally and let you tune consistency, so they sit closer to scalability.',
  },
  {
    id: 'search',
    chip: 'Search engines and vector DBs',
    label: ['Search engines', 'and vector "DBs"'],
    x: 0.78,
    y: 0.14,
    text: 'Search engines and vector databases prioritize scalability, search speed, and availability, and accept eventual consistency of updates.',
  },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('dv-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('dv-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

export function mount(node) {
  node.classList.add('dv-cp');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="System">',
    SYSTEMS.map((s) => `<button type="button" class="qi-chip" data-sys="${s.id}" aria-pressed="false">${s.chip}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 420" role="img" aria-label="Relational databases, NoSQL stores, and search engines placed between consistency and availability on one axis and isolation and scalability on the other.">',
    '    <g class="dv-cp__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 dv-cp__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.dv-cp__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.dv-cp__status');
  const chips = [...node.querySelectorAll('[data-sys]')];
  let selected = 'search';
  const isNarrow = watchNarrow(node, () => render());

  function head(x, y, ux, uy) {
    g.appendChild(el('polygon', { class: 'dv-cp__head', points: `${x},${y} ${x - ux * 9 - uy * 4.5},${y - uy * 9 + ux * 4.5} ${x - ux * 9 + uy * 4.5},${y - uy * 9 - ux * 4.5}` }));
  }
  function axis(x1, y1, x2, y2) {
    g.appendChild(el('line', { class: 'dv-cp__axis', x1, y1, x2, y2 }));
    const L = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / L;
    const uy = (y2 - y1) / L;
    head(x2, y2, ux, uy);
    head(x1, y1, -ux, -uy);
  }

  function render() {
    const narrow = isNarrow();
    const W = narrow ? 340 : 760;
    const H = narrow ? 400 : 420;
    const cx = W / 2;
    const cy = H / 2;
    g.replaceChildren();
    axis(24, cy, W - 24, cy);
    axis(cx, 24, cx, H - 24);
    g.appendChild(el('text', { class: 'qi-label', x: 24, y: cy + 22 }, 'Consistency'));
    g.appendChild(el('text', { class: 'qi-label', x: W - 24, y: cy + 22, 'text-anchor': 'end' }, 'Availability'));
    g.appendChild(el('text', { class: 'qi-label', x: cx + 12, y: 22 }, 'Scalability'));
    g.appendChild(el('text', { class: 'qi-label', x: cx + 12, y: H - 14 }, 'Isolation'));

    SYSTEMS.forEach((s) => {
      const x = Math.min(Math.max(s.x * W, 70), W - 70);
      const y = s.y * (H - 100) + 40;
      const on = s.id === selected;
      const grp = el('g', { class: `dv-cp__sys${on ? ' is-sel' : ''}`, tabindex: '-1' });
      if (on) grp.appendChild(el('circle', { class: 'dv-cp__ring', cx: x, cy: y, r: 15 }));
      grp.appendChild(el('circle', { class: 'dv-cp__dot', cx: x, cy: y, r: 7 }));
      s.label.forEach((line, i) => grp.appendChild(el('text', { class: 'qi-label qi-label--strong', x, y: y + 32 + i * 18, 'text-anchor': 'middle' }, line)));
      grp.addEventListener('click', () => setSystem(s.id));
      g.appendChild(grp);
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    statusEl.textContent = SYSTEMS.find((s) => s.id === selected).text;
  }

  function setSystem(id) {
    selected = id;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sys === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setSystem(b.dataset.sys)));

  setSystem('search');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
