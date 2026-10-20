/*
 * model-picker island: a theme-aware decision figure for the multitenant
 * search guide (content/documentation/production-operations/multitenant-search.md).
 *
 * A decision guide, not measured data. Tenant count runs along x, how unevenly
 * tenants are sized along y, and each model owns a band of that plane: inside a
 * shared collection the size skew decides the model at any tenant count, while
 * the count changes the limits named in the status line. The reader picks a
 * cell and the marker moves there; "different configs needed" overrides both
 * axes, since it forces a collection per tenant.
 *
 * Two compositions: desktop, and a stacked one below 640px of figure width.
 * The zones are labeled in place so the map reads without the colors.
 */

const LABEL =
  'Decision guide, not measured. At any tenant count: one dominant tenant gets its own shard while the rest share one, a few big tenants among many small ones call for tiered multitenancy, and similar sizes fit a payload field with a tenant index. Different embedding models or collection settings per tenant: a collection per tenant, and Qdrant Cloud allows 1,000 collections per cluster by default.';

const COUNTS = [
  { id: '10', label: '~10' },
  { id: '1k', label: '~1,000' },
  { id: '10k', label: '~10,000' },
  { id: '100k', label: '~100,000+' },
];
// Rows, top to bottom (top = most skewed).
const DISTS = [
  { id: 'dominant', label: 'One dominant', rows: ['One dominant', 'tenant'] },
  { id: 'few-big', label: 'A few big', rows: ['A few big,', 'many small'] },
  { id: 'similar', label: 'Similar sizes', rows: ['Similar', 'sizes'] },
];
const MODELS = {
  payload: { name: 'Payload field with a tenant index', tone: 'blue' },
  tiered: { name: 'Tiered multitenancy', tone: 'purple' },
  shard: { name: 'Its own shard, the rest shared', tone: 'cyan' },
  collection: { name: 'Collection per tenant', tone: 'orange' },
};

function pickModel(count, dist, configsNeeded) {
  if (configsNeeded) return 'collection';
  if (dist === 'dominant') return 'shard';
  return dist === 'similar' ? 'payload' : 'tiered';
}

function reason(count, dist, configsNeeded) {
  const n = COUNTS.find((c) => c.id === count).label;
  if (configsNeeded) {
    const base = 'Different embedding models or collection settings per tenant force separate collections, whatever the tenant count.';
    return ['10k', '100k'].includes(count) ? `${base} At ${n} tenants, that passes Qdrant Cloud's default of 1,000 collections per cluster.` : base;
  }
  if (dist === 'dominant') return `${n} tenants, but one dominates the load: give it a shard of its own and keep the rest together in a shared one.`;
  if (dist === 'similar') return `${n} similarly sized tenants fit in one collection, partitioned by a tenant payload index.`;
  return `${n} tenants with a few big ones: every tenant starts in a shared fallback shard, and the big ones are promoted to shards of their own.`;
}

// Plot geometry: column widths, row height, origin.
const GEO = {
  d: { w: 960, h: 540, x0: 270, cols: [162, 162, 162, 164], y0: 128, rowH: 100, rowLabelX: 40 },
  m: { w: 480, h: 640, x0: 24, cols: [108, 108, 108, 108], y0: 150, rowH: 120, rowLabelX: null },
};

function colX(g, i) {
  return g.x0 + g.cols.slice(0, i).reduce((a, b) => a + b, 0);
}
// One band per row; a collection per tenant is reached only through the override.
const ZONES = ['shard', 'tiered', 'payload'];
function zones(g) {
  const w = colX(g, 4) - g.x0;
  return ZONES.map((key, i) => [key, g.x0, g.y0 + i * g.rowH, w, g.rowH]);
}

function zoneLabel(v, key, x, y, w, h) {
  const name = MODELS[key].name;
  const ink = `var(--mts-${MODELS[key].tone}-ink)`;
  const cx = x + w / 2;
  let lines = [name];
  if (key === 'payload' && v === 'm') lines = ['Payload field with', 'a tenant index'];
  const top = y + h / 2 - ((lines.length - 1) * 26) / 2 + 7 + (v === 'm' ? 12 : 0);
  return lines
    .map((l, i) => `<text class="mts-small" x="${cx}" y="${top + i * 26}" text-anchor="middle" style="fill:${ink};font-weight:600">${l}</text>`)
    .join('');
}

function plot(v) {
  const g = GEO[v];
  let out = '';
  zones(g).forEach(([key, x, y, w, h]) => {
    out += `<rect data-k="${v}-zone-${key}" x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="8" style="fill:var(--mts-${MODELS[key].tone}-t)"/>`;
  });
  // The selected cell: a soft fill under the zone labels, so it never covers text.
  out += `<rect data-k="${v}-marker" x="${g.x0}" y="${g.y0}" width="${g.cols[0]}" height="${g.rowH}" rx="8" style="fill:var(--qi-fg);opacity:0.16"/>`;
  zones(g).forEach(([key, x, y, w, h]) => {
    out += `<g data-k="${v}-zl-${key}">${zoneLabel(v, key, x, y, w, h)}</g>`;
  });
  // Row labels: beside the plot on desktop, inside each row on narrow screens.
  DISTS.forEach((d, i) => {
    const y = g.y0 + i * g.rowH;
    if (g.rowLabelX != null) {
      d.rows.forEach((l, j) => {
        out += `<text class="mts-small" x="${g.rowLabelX}" y="${y + g.rowH / 2 - 6 + j * 24}">${l}</text>`;
      });
    } else {
      out += `<text class="mts-note" x="${colX(g, 4) - 12}" y="${y + 26}" text-anchor="end" style="fill:var(--qi-fg)">${d.rows.join(' ')}</text>`;
    }
  });
  const bottom = g.y0 + 3 * g.rowH;
  COUNTS.forEach((c, i) => {
    out += `<text class="mts-note" x="${colX(g, i) + g.cols[i] / 2}" y="${bottom + 30}" text-anchor="middle">${c.label}</text>`;
  });
  out += `<text class="mts-note" x="${(g.x0 + colX(g, 4)) / 2}" y="${bottom + 62}" text-anchor="middle">tenant count →</text>`;
  const mid = (g.x0 + colX(g, 4)) / 2;
  const cy = g.y0 + 1.5 * g.rowH;
  const pill = 'Different configs: collection per tenant';
  const pw = v === 'd' ? pill.length * 12 + 32 : 300;
  out += `<g data-k="${v}-override"><rect x="${mid - pw / 2}" y="${cy - 26}" width="${pw}" height="52" rx="26" style="fill:var(--mts-orange)"/>`;
  if (v === 'd') {
    out += `<text class="mts-small" x="${mid}" y="${cy + 7}" text-anchor="middle" style="fill:#fff;font-weight:600">${pill}</text></g>`;
  } else {
    out += `<text class="mts-note" x="${mid}" y="${cy - 5}" text-anchor="middle" style="fill:#fff;font-weight:600">Different configs:</text>`;
    out += `<text class="mts-note" x="${mid}" y="${cy + 21}" text-anchor="middle" style="fill:#fff;font-weight:600">collection per tenant</text></g>`;
  }
  return out;
}

function head(v) {
  if (v === 'd') {
    return (
      `<text class="mts-head" x="40" y="56">Pick a model by tenant count and size skew</text>` +
      `<text class="mts-note" x="40" y="84">a decision guide, not measured</text>`
    );
  }
  return (
    `<text class="mts-head" x="24" y="44">Pick a model by tenant</text>` +
    `<text class="mts-head" x="24" y="70">count and size skew</text>` +
    `<text class="mts-note" x="24" y="98">a decision guide, not measured</text>`
  );
}

function update(node, s) {
  const key = pickModel(s.count, s.dist, s.configs);
  for (const v of ['d', 'm']) {
    const g = GEO[v];
    const ci = COUNTS.findIndex((c) => c.id === s.count);
    const ri = DISTS.findIndex((d) => d.id === s.dist);
    const marker = node.querySelector(`[data-k="${v}-marker"]`);
    marker.setAttribute('x', colX(g, ci) + 2);
    marker.setAttribute('y', g.y0 + ri * g.rowH + 2);
    marker.setAttribute('width', g.cols[ci] - 4);
    marker.setAttribute('height', g.rowH - 4);
    marker.classList.toggle('is-off', s.configs);
    ZONES.forEach((k) => {
      const zone = node.querySelector(`[data-k="${v}-zone-${k}"]`);
      const label = node.querySelector(`[data-k="${v}-zl-${k}"]`);
      const on = s.configs ? false : k === key;
      zone.classList.toggle('is-faint', s.configs || !on);
      label.classList.toggle('is-off', s.configs);
    });
    node.querySelector(`[data-k="${v}-override"]`).classList.toggle('is-off', !s.configs);
  }
  node.querySelectorAll('[data-count]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.count === s.count)));
  node.querySelectorAll('[data-dist]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dist === s.dist)));
  node.querySelector('[data-configs]').setAttribute('aria-pressed', String(s.configs));
  const status = node.querySelector('.qi-status');
  status.textContent = '';
  const b = document.createElement('b');
  b.textContent = MODELS[key].name;
  status.append(b, `. ${reason(s.count, s.dist, s.configs)}`);
}

function svg(v) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${head(v)}${plot(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls">' +
    '<div class="qi-group" role="group" aria-label="About how many tenants do you have?"><span class="qi-hint">Tenants:</span>' +
    COUNTS.map((c) => `<button type="button" class="qi-chip" data-count="${c.id}" aria-pressed="false">${c.label}</button>`).join('') +
    '</div>' +
    '<div class="qi-group" role="group" aria-label="How are tenant sizes distributed?"><span class="qi-hint">Sizes:</span>' +
    DISTS.slice()
      .reverse()
      .map((d) => `<button type="button" class="qi-chip" data-dist="${d.id}" aria-pressed="false">${d.label}</button>`)
      .join('') +
    '<button type="button" class="qi-chip" data-configs aria-pressed="false">Different configs needed</button>' +
    '</div></div>' +
    svg('d') +
    svg('m') +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  const state = { count: '10k', dist: 'similar', configs: false };
  node.querySelectorAll('[data-count]').forEach((b) => b.addEventListener('click', () => ((state.count = b.dataset.count), update(node, state))));
  node.querySelectorAll('[data-dist]').forEach((b) => b.addEventListener('click', () => ((state.dist = b.dataset.dist), update(node, state))));
  node.querySelector('[data-configs]').addEventListener('click', () => ((state.configs = !state.configs), update(node, state)));
  update(node, state);
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
