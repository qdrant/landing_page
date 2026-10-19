/*
 * index-timing island: a theme-aware figure for the multitenant search guide
 * (content/documentation/production-operations/multitenant-search.md).
 *
 * Measured, one run (164,365 points, Qdrant Cloud, 2 vCPU, 6.9 GB RAM):
 * p50 approximate-search latency and mean recall@10 for six tenant sizes,
 * depending on when the tenant payload index was created
 * (results/experiment_a). A static table; nothing is interpolated.
 *
 * The dashed line marks where Qdrant stops scanning a filter's matches
 * exactly: full_scan_threshold, 10,000 KB by default, about 6,500 vectors of
 * 384 dimensions. The chips emphasize one setup and label its points. Two
 * compositions: desktop, and a stacked one below 640px of figure width.
 */

const LABEL =
  'Filtered search by tenant size, depending on when the tenant index was created. Index from the start: 0.68 to 1.98 ms, recall 1.00 up to 20,000 points and 0.84 at 40,000. No index: 80 to 83 ms up to 5,000 points with recall 1.00, then about 4 ms with recall 0.05 at 10,000, 0.50 at 20,000, and 0.85 at 40,000. Index added after loading: 0.83 to 3.03 ms, with the same recall collapse as no index. Below about 6,500 points Qdrant scans exactly; above it, it searches the graph.';

const SIZES = [500, 2000, 5000, 10000, 20000, 40000];
const SIZE_LABEL = ['500', '2k', '5k', '10k', '20k', '40k'];
const SERIES = [
  { id: 'start', label: 'index from the start', chip: 'From the start', color: 'var(--mts-cyan)', ink: 'var(--mts-cyan-ink)',
    lat: [0.68, 1.04, 1.7, 1.81, 1.98, 1.39], rec: [1, 1, 1, 1, 1, 0.84] },
  { id: 'none', label: 'no index', chip: 'No index', color: 'var(--mts-red)', ink: 'var(--mts-red-ink)',
    lat: [80.17, 82.29, 83.11, 3.88, 3.98, 4.17], rec: [1, 1, 1, 0.05, 0.5, 0.85] },
  { id: 'after', label: 'index added after loading', chip: 'Added after loading', color: 'var(--mts-orange)', ink: 'var(--mts-orange-ink)',
    lat: [0.91, 1.72, 3.03, 0.83, 1.37, 1.36], rec: [1, 1, 1, 0.05, 0.5, 0.85] },
];
const STATUS = {
  all: 'Below about 6,500 points every setup scans exactly, so recall is 1.00. Above it, only the index created before loading kept full recall at 10,000 and 20,000 points.',
  start: 'Index from the start: 0.68 to 1.98 ms throughout, with recall 1.00 up to 20,000 points and 0.84 at 40,000.',
  none: 'No index: small tenants are exact but take 80 to 83 ms. From 10,000 points queries are fast, but recall falls to 0.05, then 0.50 at 20,000.',
  after: 'Index added after loading: fast at every size, yet recall still falls to 0.05 at 10,000 points, the same as no index. The graph was built without it.',
};

const LOG_LO = Math.log10(0.5);
const LOG_HI = Math.log10(100);

// Panels per composition: key, title, x0, x1, top, bottom.
const GEO = {
  d: { w: 960, h: 576, panels: { lat: [100, 450, 196, 420], rec: [570, 920, 196, 420] }, titleY: 176, legend: [40, 124], foot: 528 },
  m: { w: 480, h: 1000, panels: { lat: [96, 456, 270, 480], rec: [96, 456, 612, 832] }, titleY: { lat: 248, rec: 590 }, legend: [24, 150], foot: 980 },
};

const fmtLat = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2));
const fmtRec = (v) => v.toFixed(2);

function scales(kind, [x0, x1, top, bottom]) {
  // Points are inset from the axes so their labels can stay centered.
  const sx = (i) => x0 + 24 + (i * (x1 - x0 - 48)) / (SIZES.length - 1);
  const sy =
    kind === 'lat'
      ? (v) => bottom - ((Math.log10(v) - LOG_LO) / (LOG_HI - LOG_LO)) * (bottom - top)
      : (v) => bottom - v * (bottom - top);
  return { sx, sy };
}

function panel(v, kind) {
  const g = GEO[v];
  const box = g.panels[kind];
  const [x0, x1, top, bottom] = box;
  const { sx, sy } = scales(kind, box);
  const titleY = typeof g.titleY === 'number' ? g.titleY : g.titleY[kind];
  let out = `<text class="mts-head" x="${v === 'd' ? x0 - 60 : 24}" y="${titleY}">${kind === 'lat' ? 'p50 latency, ms (log scale)' : 'Recall@10'}</text>`;
  const ticks = kind === 'lat' ? [[0.5, false], [1, true], [2, false], [5, false], [10, true], [20, false], [50, false], [100, true]] : [[0, true], [0.25, false], [0.5, true], [0.75, false], [1, true]];
  ticks.forEach(([t, labeled]) => {
    const y = sy(t);
    out += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" class="mts-grid"/>`;
    if (labeled) out += `<text class="mts-note" x="${x0 - 14}" y="${y + 6}" text-anchor="end">${kind === 'lat' ? t : t.toFixed(t % 1 ? 1 : 0)}</text>`;
  });
  SIZE_LABEL.forEach((s, i) => {
    out += `<text class="mts-note" x="${sx(i)}" y="${bottom + 28}" text-anchor="middle">${s}</text>`;
  });
  out += `<path d="M${x0} ${top} V${bottom} H${x1}" class="mts-axis"/>`;
  // full_scan_threshold, about 6,500 points: between the 5k and 10k columns.
  const tx = sx(2) + (sx(3) - sx(2)) * 0.3;
  out += `<line x1="${tx}" x2="${tx}" y1="${top - 6}" y2="${bottom + 62}" stroke-width="2" stroke-dasharray="6 5" style="stroke:var(--qi-muted)"/>`;
  out += `<text class="mts-note" x="${tx - 10}" y="${bottom + 58}" text-anchor="end">← exact scan</text>`;
  out += `<text class="mts-note" x="${tx + 10}" y="${bottom + 58}">graph →</text>`;
  SERIES.forEach((s) => {
    const vals = kind === 'lat' ? s.lat : s.rec;
    const pts = vals.map((val, i) => `${sx(i)},${sy(val)}`).join(' ');
    out += `<g data-k="${v}-${kind}-${s.id}">`;
    out += `<polyline points="${pts}" fill="none" stroke-width="3" stroke-linejoin="round" style="stroke:${s.color}"/>`;
    vals.forEach((val, i) => {
      out += `<circle cx="${sx(i)}" cy="${sy(val)}" r="6" stroke-width="2" style="fill:${s.color};stroke:var(--mts-inset)"/>`;
    });
    out += '</g>';
    out += `<g data-k="${v}-${kind}-${s.id}-labels">`;
    vals.forEach((val, i) => {
      const y = sy(val);
      // Below the point when it sits near the panel top.
      const above = y > top + 30;
      out += `<text class="mts-note" x="${sx(i)}" y="${above ? y - 14 : y + 30}" text-anchor="middle" style="fill:${s.ink}">${kind === 'lat' ? fmtLat(val) : fmtRec(val)}</text>`;
    });
    out += '</g>';
  });
  if (kind === 'rec') {
    const x = sx(3);
    const y = sy(0.05);
    out += `<g data-k="${v}-callout"><text class="mts-note" x="${x + 16}" y="${y + 6}" style="fill:var(--mts-red-ink)">0.05, both</text></g>`;
  }
  return out;
}

function legend(v) {
  const [x, y] = GEO[v].legend;
  let out = '';
  let lx = x;
  let ly = y;
  SERIES.forEach((s) => {
    const w = 34 + s.label.length * 11.4 + 30;
    if (v === 'm' && lx + w > 470) {
      lx = x;
      ly += 30;
    }
    out += `<line x1="${lx}" x2="${lx + 24}" y1="${ly - 6}" y2="${ly - 6}" stroke-width="4" stroke-linecap="round" style="stroke:${s.color}"/>`;
    out += `<text class="mts-note" x="${lx + 34}" y="${ly}" style="fill:var(--qi-fg)">${s.label}</text>`;
    lx += w;
  });
  return out;
}

function desktop() {
  let out = '';
  out += `<text class="mts-head" x="40" y="56">Filtered search by tenant size, by when the index was created</text>`;
  out += `<text class="mts-note" x="40" y="84">164,365 points; p50 approximate-search latency and mean recall@10</text>`;
  out += legend('d');
  out += panel('d', 'lat') + panel('d', 'rec');
  out += `<text class="mts-note" x="40" y="${GEO.d.foot}">x axis: tenant size, in points</text>`;
  out += `<text class="mts-note" x="40" y="${GEO.d.foot + 26}">Dashed line: full_scan_threshold, about 6,500 points at 384 dimensions</text>`;
  return out;
}

function mobile() {
  let out = '';
  out += `<text class="mts-head" x="24" y="44">Filtered search by tenant</text>`;
  out += `<text class="mts-head" x="24" y="70">size, by when the index</text>`;
  out += `<text class="mts-head" x="24" y="96">was created</text>`;
  out += `<text class="mts-note" x="24" y="122">164,365 points, one run</text>`;
  out += legend('m');
  out += panel('m', 'lat') + panel('m', 'rec');
  out += `<text class="mts-note" x="24" y="${GEO.m.foot - 24}">Dashed line: full_scan_threshold,</text>`;
  out += `<text class="mts-note" x="24" y="${GEO.m.foot}">about 6,500 points at 384 dimensions.</text>`;
  return out;
}

function update(node, sel) {
  for (const v of ['d', 'm']) {
    ['lat', 'rec'].forEach((kind) => {
      SERIES.forEach((s) => {
        node.querySelector(`[data-k="${v}-${kind}-${s.id}"]`).classList.toggle('is-dim', sel !== 'all' && sel !== s.id);
        node.querySelector(`[data-k="${v}-${kind}-${s.id}-labels"]`).classList.toggle('is-off', sel !== s.id);
      });
    });
    node.querySelector(`[data-k="${v}-callout"]`).classList.toggle('is-off', sel !== 'all');
  }
  node.querySelectorAll('[data-series]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.series === sel)));
  node.querySelector('.qi-status').textContent = STATUS[sel];
}

function svg(v, body) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  const chips = [{ id: 'all', chip: 'All three' }, ...SERIES];
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="When the tenant index was created"><span class="qi-hint">Index:</span>' +
    chips
      .map(
        (s) =>
          `<button type="button" class="qi-chip" data-series="${s.id}" aria-pressed="false">` +
          (s.color ? `<span class="qi-chip__swatch" style="--swatch:${s.color}"></span>` : '') +
          `${s.chip}</button>`,
      )
      .join('') +
    '</div></div>' +
    svg('d', desktop()) +
    svg('m', mobile()) +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-series]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.series)));
  update(node, 'all');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
