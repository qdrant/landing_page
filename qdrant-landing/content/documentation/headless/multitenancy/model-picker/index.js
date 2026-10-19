/*
 * model-picker island — a decision tool, not measured data.
 *
 * The decision lives on two axes: how many tenants you have (x), and how
 * unevenly sized they are (y). Each of the three pool models owns a region
 * of that plane; a fourth control ("different configs needed") overrides
 * both axes, since it forces Collection per tenant regardless of tenant
 * count or size. The reader picks a point and a marker lands in the
 * matching region, with the plane itself showing the boundary structure
 * (e.g. "one dominant tenant" is a full-width band: that choice always
 * means Shard per tenant, whatever the tenant count is).
 *
 * No SVG anywhere in this island, deliberately, after two rounds of
 * viewBox-scaling bugs (desktop ballooning when the viewBox was kept narrow
 * for mobile, then mobile label clipping once it was widened back). Every
 * zone, gridline, the marker, and the crosshair are plain divs positioned by
 * CSS percentage inside an aspect-ratio box, which has no scale factor to
 * reason about at any width. Axis labels are plain HTML text for the same
 * reason index-timing and per-tenant-graphs are plain HTML.
 */

const COUNTS = [
  { id: '10', label: '~10' },
  { id: '1k', label: '~1,000' },
  { id: '10k', label: '~10,000' },
  { id: '100k', label: '~100,000+' },
];

// Rows, top to bottom (top = most skewed).
const DISTS = [
  { id: 'dominant', label: 'One dominant tenant' },
  { id: 'few-big', label: 'A few big, many small' },
  { id: 'similar', label: 'Similar sizes' },
];
const ROW_PCT = 100 / DISTS.length;
const COL_PCT = 100 / COUNTS.length;

const MODELS = {
  payload: { name: 'Payload field with a tenant index', cat: '--qi-cat-1' },
  tiered: { name: 'Tiered multitenancy', cat: '--qi-cat-2' },
  shard: { name: 'Shard per tenant', cat: '--qi-cat-3' },
  collection: { name: 'Collection per tenant', cat: '--qi-cat-4' },
};

// Decision table (final — mirrors the prose decision table in the guide):
//  - "Different configs needed" -> always Collection per tenant.
//  - "One dominant tenant" -> always Shard per tenant, any count.
//  - ~10 tenants (and not dominant) -> Collection per tenant.
//  - >=1,000 tenants, "Similar sizes" -> Payload field with a tenant index.
//  - >=1,000 tenants, "A few big, many small" -> Tiered multitenancy.
function pickModel(count, dist, configsNeeded) {
  if (configsNeeded) return 'collection';
  if (dist === 'dominant') return 'shard';
  if (count === '10') return 'collection';
  return dist === 'similar' ? 'payload' : 'tiered';
}

function reason(count, dist, configsNeeded) {
  const countLabel = COUNTS.find((c) => c.id === count).label;
  if (configsNeeded) {
    const base = 'Different embedding models or collection settings per tenant force separate collections, whatever the tenant count.';
    return count === '100k' ? `${base} That is unusual at ${countLabel} tenants — double-check the tenant count.` : base;
  }
  if (dist === 'dominant') {
    return `${countLabel} tenants, but one dominates the load — give it a shard of its own instead of crowding a shared collection.`;
  }
  if (count === '10') {
    return `Only ${countLabel} tenants — too few to bother sharing a collection; give each one its own.`;
  }
  if (dist === 'similar') {
    return `${countLabel} similarly sized tenants fit cleanly in one collection, partitioned by a tenant_id payload index.`;
  }
  return `${countLabel} tenants with a few big ones — dedicate shards to the big tenants and let the rest share a fallback shard.`;
}

export function mount(node) {
  node.classList.add('qi-mp');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group qi-mp__counts" role="group" aria-label="About how many tenants do you have? (x-axis)">',
    '      <span class="qi-hint">Tenants:</span>',
    COUNTS.map((c) => `<button type="button" class="qi-chip qi-mp__count" data-count="${c.id}" aria-pressed="false">${c.label}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group qi-mp__dists" role="group" aria-label="How are tenant sizes distributed? (y-axis)">',
    '      <span class="qi-hint">Sizes:</span>',
    DISTS.slice()
      .reverse()
      .map((d) => `<button type="button" class="qi-chip qi-mp__dist" data-dist="${d.id}" aria-pressed="false">${d.label}</button>`)
      .join(''),
    '      <button type="button" class="qi-chip qi-mp__configs" aria-pressed="false">Different configs needed</button>',
    '    </div>',
    '  </div>',
    '  <div class="qi-mp__chart-wrap">',
    '    <div class="qi-mp__y-title">Size skew</div>',
    '    <div class="qi-mp__chart">',
    '      <div class="qi-mp__row-labels">',
    DISTS.map((d) => `<div class="qi-mp__row-label">${d.label}</div>`).join(''),
    '      </div>',
    '      <div class="qi-mp__plot" role="img" aria-label="Tenant count on the x-axis against how skewed tenant sizes are on the y-axis, with a marker at the reader\'s selection.">',
    '        <div class="qi-mp__zones"></div>',
    '        <div class="qi-mp__gridlines"></div>',
    '        <div class="qi-mp__crosshair-h"></div>',
    '        <div class="qi-mp__crosshair-v"></div>',
    '        <div class="qi-mp__marker"></div>',
    '        <div class="qi-mp__override">',
    '          <span class="qi-mp__override-pill">Different configs → Collection per tenant</span>',
    '        </div>',
    '      </div>',
    '      <div class="qi-mp__corner"></div>',
    '      <div class="qi-mp__col-labels">',
    COUNTS.map((c) => `<div class="qi-mp__col-label">${c.label}</div>`).join(''),
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div class="qi-mp__x-title">Tenant count</div>',
    '  <p class="qi-status qi-mp__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const zonesEl = node.querySelector('.qi-mp__zones');
  const gridEl = node.querySelector('.qi-mp__gridlines');
  const marker = node.querySelector('.qi-mp__marker');
  const crosshairH = node.querySelector('.qi-mp__crosshair-h');
  const crosshairV = node.querySelector('.qi-mp__crosshair-v');
  const overrideEl = node.querySelector('.qi-mp__override');
  const statusEl = node.querySelector('.qi-mp__status');
  const countChips = [...node.querySelectorAll('.qi-mp__count')];
  const distChips = [...node.querySelectorAll('.qi-mp__dist')];
  const configsChip = node.querySelector('.qi-mp__configs');

  const zoneDiv = (cat, left, top, width, height) => {
    const d = document.createElement('div');
    d.className = 'qi-mp__zone';
    d.style.setProperty('--zone-color', `var(${cat})`);
    d.style.left = `${left}%`;
    d.style.top = `${top}%`;
    d.style.width = `${width}%`;
    d.style.height = `${height}%`;
    return d;
  };

  // --- Zones: 5 rectangles, derived from pickModel, not per-cell lookup. ---
  // Row 0 (dominant) is one full-width Shard band. Rows 1-2 split into a
  // Collection strip (count === '10', the first column) and a
  // Payload/Tiered block covering the other three columns.
  const dominantRow = DISTS.findIndex((d) => d.id === 'dominant');
  zonesEl.appendChild(zoneDiv(MODELS.shard.cat, 0, dominantRow * ROW_PCT, 100, ROW_PCT));
  ['few-big', 'similar'].forEach((distId) => {
    const r = DISTS.findIndex((d) => d.id === distId);
    const model = distId === 'similar' ? 'payload' : 'tiered';
    zonesEl.appendChild(zoneDiv(MODELS.collection.cat, 0, r * ROW_PCT, COL_PCT, ROW_PCT));
    zonesEl.appendChild(zoneDiv(MODELS[model].cat, COL_PCT, r * ROW_PCT, 100 - COL_PCT, ROW_PCT));
  });

  for (let i = 1; i < COUNTS.length; i++) {
    const l = document.createElement('div');
    l.className = 'qi-mp__gridline qi-mp__gridline--v';
    l.style.left = `${i * COL_PCT}%`;
    gridEl.appendChild(l);
  }
  for (let i = 1; i < DISTS.length; i++) {
    const l = document.createElement('div');
    l.className = 'qi-mp__gridline qi-mp__gridline--h';
    l.style.top = `${i * ROW_PCT}%`;
    gridEl.appendChild(l);
  }

  let count = '10';
  let dist = 'similar';
  let configsNeeded = false;

  function render() {
    countChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.count === count)));
    distChips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dist === dist)));
    configsChip.setAttribute('aria-pressed', String(configsNeeded));

    const ci = COUNTS.findIndex((c) => c.id === count);
    const ri = DISTS.findIndex((d) => d.id === dist);
    const mx = ci * COL_PCT + COL_PCT / 2;
    const my = ri * ROW_PCT + ROW_PCT / 2;
    const key = pickModel(count, dist, configsNeeded);

    overrideEl.classList.toggle('is-active', configsNeeded);
    zonesEl.classList.toggle('is-muted', configsNeeded);
    marker.style.display = configsNeeded ? 'none' : '';
    crosshairH.style.display = configsNeeded ? 'none' : '';
    crosshairV.style.display = configsNeeded ? 'none' : '';

    if (!configsNeeded) {
      marker.style.left = `${mx}%`;
      marker.style.top = `${my}%`;
      marker.style.setProperty('--marker-color', `var(${MODELS[key].cat})`);
      crosshairH.style.top = `${my}%`;
      crosshairH.style.width = `${mx}%`;
      crosshairV.style.left = `${mx}%`;
      crosshairV.style.top = `${my}%`;
      crosshairV.style.height = `${100 - my}%`;
    }

    statusEl.innerHTML = `<b>${MODELS[key].name}</b>. ${reason(count, dist, configsNeeded)}`;
  }

  countChips.forEach((b) => b.addEventListener('click', () => ((count = b.dataset.count), render())));
  distChips.forEach((b) => b.addEventListener('click', () => ((dist = b.dataset.dist), render())));
  configsChip.addEventListener('click', () => ((configsNeeded = !configsNeeded), render()));

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
