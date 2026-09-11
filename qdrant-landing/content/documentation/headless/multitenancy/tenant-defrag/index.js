/*
 * tenant-defrag island — interactive replacement for defragmentation.png.
 *
 * Illustrates payload-based tenancy with is_tenant=true: a shard's points are
 * colored by tenant. Toggle "Optimize" to reorder them from scattered (many
 * random disk seeks to read one tenant) to grouped (one sequential read). Pick
 * a tenant to highlight its points and see the seek count.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss): chrome
 * colors switch with the host theme, tenant hues are the categorical palette.
 */

const NS = 'http://www.w3.org/2000/svg';

const TENANTS = [
  { id: 'a', label: 'Tenant A' },
  { id: 'b', label: 'Tenant B' },
  { id: 'c', label: 'Tenant C' },
  { id: 'd', label: 'Tenant D' },
];
const COUNTS = { a: 12, b: 10, c: 10, d: 8 };

// Geometry (SVG user units).
const VB_W = 700;
const AX = 28; // bars area left
const AW = 644; // bars area width
const AY = 70; // bars top
const AH = 96; // bars height
const UY = AY + AH + 12; // underline row (contiguity indicator)

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

// Deterministic shuffle so the "scattered" layout is stable across renders.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mount(node) {
  node.classList.add('qi-td');

  // Build the point set: each point belongs to a tenant.
  const points = [];
  let pid = 0;
  for (const t of TENANTS) for (let i = 0; i < COUNTS[t.id]; i++) points.push({ id: pid++, tenant: t.id });
  const N = points.length;
  const slot = AW / N;
  const barW = Math.max(3, slot * 0.55);

  // grouped order = points sorted by tenant; scattered = a fixed shuffle.
  const grouped = points.map((p) => p.id);
  const scattered = points.map((p) => p.id);
  const rnd = mulberry32(1337);
  for (let i = scattered.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [scattered[i], scattered[j]] = [scattered[j], scattered[i]];
  }
  const tenantOf = {};
  points.forEach((p) => (tenantOf[p.id] = p.tenant));

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <button type="button" class="qi-chip qi-td__toggle" aria-pressed="false">',
    '      <span class="qi-switch__track"><span class="qi-switch__knob"></span></span>',
    '      <span class="qi-td__toggle-label">is_tenant = <b>false</b></span>',
    '    </button>',
    '    <div class="qi-group" role="group" aria-label="Highlight a tenant">',
    TENANTS.map(
      (t) =>
        `<button type="button" class="qi-chip qi-td__chip qi-td__chip--${t.id}" data-tenant="${t.id}" aria-pressed="false">` +
        `<span class="qi-chip__swatch"></span>${t.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-td__svg" viewBox="0 0 ${VB_W} 210" role="img" aria-label="A shard of points colored by tenant, shown scattered and grouped by is_tenant.">`,
    `    <rect class="qi-frame" x="2" y="30" width="${VB_W - 4}" height="${AH + 60}" rx="6"/>`,
    '    <text class="qi-frame-label" x="20" y="52">Shard A</text>',
    '    <g class="qi-td__bars"></g>',
    '    <g class="qi-td__runs"></g>',
    '  </svg>',
    '  <p class="qi-status qi-td__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-td__svg');
  const barsG = node.querySelector('.qi-td__bars');
  const runsG = node.querySelector('.qi-td__runs');
  const statusEl = node.querySelector('.qi-td__status');
  const toggle = node.querySelector('.qi-td__toggle');
  const toggleLabel = toggle.querySelector('.qi-td__toggle-label b');
  const chips = [...node.querySelectorAll('.qi-td__chip')];

  // Create one rect per point, keyed by id.
  const rects = {};
  points.forEach((p) => {
    const r = el('rect', {
      class: `qi-td__bar qi-td__bar--${p.tenant}`,
      x: AX,
      y: AY,
      width: barW,
      height: AH,
      rx: 2,
    });
    rects[p.id] = r;
    barsG.appendChild(r);
  });

  let optimized = false;
  let selected = null;

  function currentOrder() {
    return optimized ? grouped : scattered;
  }

  function layout() {
    const order = currentOrder();
    order.forEach((id, pos) => rects[id].setAttribute('x', AX + pos * slot + (slot - barW) / 2));
  }

  // Contiguous runs of the selected tenant in the current order.
  function runsFor(tenant) {
    const order = currentOrder();
    const runs = [];
    let start = -1;
    order.forEach((id, pos) => {
      const isT = tenantOf[id] === tenant;
      if (isT && start === -1) start = pos;
      if (!isT && start !== -1) {
        runs.push([start, pos - 1]);
        start = -1;
      }
    });
    if (start !== -1) runs.push([start, order.length - 1]);
    return runs;
  }

  function renderSelection() {
    // Dim non-selected bars.
    points.forEach((p) => {
      rects[p.id].classList.toggle('is-dim', selected != null && p.tenant !== selected);
      rects[p.id].classList.toggle('is-on', selected != null && p.tenant === selected);
    });

    // Draw contiguity underlines under each run of the selected tenant.
    runsG.replaceChildren();
    if (selected == null) {
      statusEl.textContent = 'Pick a tenant to see how many disk reads it takes.';
      return;
    }
    const runs = runsFor(selected);
    runs.forEach(([s, e]) => {
      const x = AX + s * slot + (slot - barW) / 2;
      const w = (e - s) * slot + barW;
      runsG.appendChild(
        el('rect', { class: `qi-td__run qi-td__run--${selected}`, x, y: UY, width: Math.max(w, barW), height: 5, rx: 2.5 }),
      );
    });
    const label = TENANTS.find((t) => t.id === selected).label;
    if (runs.length === 1) {
      statusEl.innerHTML = `<b>${label}</b> is contiguous — <b>1 sequential read</b>.`;
    } else {
      statusEl.innerHTML = `<b>${label}</b> is split across ${runs.length} locations — <b>${runs.length} random disk seeks</b>.`;
    }
  }

  toggle.addEventListener('click', () => {
    optimized = !optimized;
    toggle.setAttribute('aria-pressed', String(optimized));
    toggleLabel.textContent = String(optimized);
    layout();
    renderSelection();
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const t = chip.dataset.tenant;
      selected = selected === t ? null : t;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.tenant === selected)));
      renderSelection();
    });
  });

  layout();
  renderSelection();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
