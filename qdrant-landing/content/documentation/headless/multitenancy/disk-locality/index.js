/*
 * disk-locality island: a theme-aware figure for the multitenant search guide
 * (content/documentation/production-operations/multitenant-search.md).
 *
 * Measured, one run (164,365 points, vectors on disk, Qdrant Cloud, 2 vCPU,
 * 6.9 GB RAM): p50 filtered-search latency for six tenant sizes with a plain
 * keyword index against the is_tenant tenant index, and each setup's
 * one-time load and indexing time (results/experiment_a, keyword_on_disk and
 * is_tenant_on_disk). A static table.
 *
 * The size chips label one pair and move the highlight. Opens on 5,000
 * points, the size the guide's text cites. Two compositions: desktop, and a
 * stacked one below 640px of figure width.
 */

const LABEL =
  'On disk, p50 filtered-search latency by tenant size, keyword index against tenant index: 500 points 0.95 against 0.71 ms; 2,000: 1.80 against 1.13; 5,000: 3.25 against 1.79; 10,000: 2.04 against 1.78; 20,000: 2.11 against 1.96; 40,000: 1.47 against 1.36. One-time setup: keyword index 250 s (197 s load, 53 s indexing), tenant index 203 s (167 s load, 36 s indexing).';

const SIZES = [500, 2000, 5000, 10000, 20000, 40000];
const SIZE_LABEL = ['500', '2k', '5k', '10k', '20k', '40k'];
const KEYWORD = [0.95, 1.8, 3.25, 2.04, 2.11, 1.47];
const TENANT = [0.71, 1.13, 1.79, 1.78, 1.96, 1.36];
const SETUP = [
  { label: 'keyword index', load: 197, index: 53, color: 'blue' },
  { label: 'tenant index', load: 167, index: 36, color: 'cyan' },
];
const MAX_MS = 3.5;
const MAX_S = 250;

const GEO = {
  d: {
    w: 960, h: 548,
    lat: { x0: 100, x1: 590, top: 236, bottom: 440, titleX: 40, titleY: 170, bar: 26, gap: 6 },
    setup: { x0: 660, x1: 920, titleY: 170, rows: [246, 340], barH: 34 },
    legend: [[40, 124], [260, 124]],
    caption: 500,
  },
  m: {
    w: 480, h: 930,
    lat: { x0: 74, x1: 456, top: 290, bottom: 500, titleX: 24, titleY: 222, bar: 20, gap: 4 },
    setup: { x0: 24, x1: 456, titleY: 640, rows: [700, 810], barH: 34 },
    legend: [[24, 150], [24, 180]],
    caption: 560,
  },
};

const pretty = (n) => n.toLocaleString('en-US');

function ratioText(i) {
  const r = KEYWORD[i] / TENANT[i];
  return r >= 1.15 ? `about ${r.toFixed(1)} times as fast` : 'slightly faster';
}

function latency(v) {
  const g = GEO[v].lat;
  const sy = (ms) => g.bottom - (ms / MAX_MS) * (g.bottom - g.top);
  const step = (g.x1 - g.x0) / SIZES.length;
  let out = `<text class="mts-head" x="${g.titleX}" y="${g.titleY}">p50 latency, ms</text>`;
  out += `<rect data-k="${v}-band" x="${g.x0}" y="${g.top - 58}" width="${step}" height="${g.bottom - g.top + 58}" rx="8" style="fill:var(--mts-card)"/>`;
  [0, 1, 2, 3].forEach((t) => {
    const y = sy(t);
    out += `<line x1="${g.x0}" x2="${g.x1}" y1="${y}" y2="${y}" class="mts-grid"/>`;
    out += `<text class="mts-note" x="${g.x0 - 14}" y="${y + 6}" text-anchor="end">${t}</text>`;
  });
  SIZES.forEach((_, i) => {
    const cx = g.x0 + step * (i + 0.5);
    const kx = cx - g.gap / 2 - g.bar;
    const tx = cx + g.gap / 2;
    out += `<rect x="${kx}" y="${sy(KEYWORD[i])}" width="${g.bar}" height="${sy(0) - sy(KEYWORD[i])}" rx="3" style="fill:var(--mts-blue)"/>`;
    out += `<rect x="${tx}" y="${sy(TENANT[i])}" width="${g.bar}" height="${sy(0) - sy(TENANT[i])}" rx="3" style="fill:var(--mts-cyan)"/>`;
    out += `<text class="mts-note" x="${cx}" y="${g.bottom + 28}" text-anchor="middle">${SIZE_LABEL[i]}</text>`;
    out += `<g data-k="${v}-vals-${i}">`;
    // Values sit in a reserved row above the plot, so they never cross a bar.
    out += `<text class="mts-note" x="${cx}" y="${g.top - 34}" text-anchor="middle" style="fill:var(--mts-blue-ink);font-weight:600">${KEYWORD[i].toFixed(2)}</text>`;
    out += `<text class="mts-note" x="${cx}" y="${g.top - 10}" text-anchor="middle" style="fill:var(--mts-cyan-ink);font-weight:600">${TENANT[i].toFixed(2)}</text>`;
    out += '</g>';
  });
  out += `<path d="M${g.x0} ${g.top} V${g.bottom} H${g.x1}" class="mts-axis"/>`;
  out += `<text class="mts-note" x="${(g.x0 + g.x1) / 2}" y="${GEO[v].caption}" text-anchor="middle">tenant size, points</text>`;
  return out;
}

function setup(v) {
  const g = GEO[v].setup;
  const sx = (s) => (s * (g.x1 - g.x0)) / MAX_S;
  let out = `<text class="mts-head" x="${g.x0}" y="${g.titleY}">One-time setup, s</text>`;
  SETUP.forEach((s, i) => {
    const y = g.rows[i];
    const wl = sx(s.load);
    const wi = sx(s.index);
    out += `<text class="mts-small" x="${g.x0}" y="${y - 12}">${s.label}: ${s.load + s.index} s</text>`;
    out += `<rect x="${g.x0}" y="${y}" width="${wl}" height="${g.barH}" rx="4" style="fill:var(--mts-${s.color})"/>`;
    out += `<rect x="${g.x0 + wl + 2}" y="${y}" width="${wi - 2}" height="${g.barH}" rx="4" style="fill:var(--mts-${s.color}-t)"/>`;
    out += `<text class="mts-note" x="${g.x0 + 10}" y="${y + 24}" style="fill:#fff">${s.load} s</text>`;
    const fits = wi > 52;
    out += `<text class="mts-note" x="${fits ? g.x0 + wl + 10 : g.x0 + wl + wi + 8}" y="${y + 24}" style="fill:var(--mts-${s.color}-ink)">${s.index} s</text>`;
  });
  const ly = g.rows[1] + g.barH + 40;
  out += `<text class="mts-note" x="${g.x0}" y="${ly}">solid: loading</text>`;
  out += `<text class="mts-note" x="${g.x0}" y="${ly + 24}">light: indexing</text>`;
  return out;
}

function legend(v) {
  const [[x1, y1], [x2, y2]] = GEO[v].legend;
  return (
    `<rect x="${x1}" y="${y1 - 15}" width="16" height="16" rx="2" style="fill:var(--mts-blue)"/>` +
    `<text class="mts-note" x="${x1 + 26}" y="${y1}" style="fill:var(--qi-fg)">keyword index</text>` +
    `<rect x="${x2}" y="${y2 - 15}" width="16" height="16" rx="2" style="fill:var(--mts-cyan)"/>` +
    `<text class="mts-note" x="${x2 + 26}" y="${y2}" style="fill:var(--qi-fg)">tenant index (is_tenant)</text>`
  );
}

function head(v) {
  if (v === 'd') {
    return (
      `<text class="mts-head" x="40" y="56">On disk: a plain keyword index against the tenant index</text>` +
      `<text class="mts-note" x="40" y="84">164,365 points with vectors on disk; filtered-search latency and setup time</text>`
    );
  }
  return (
    `<text class="mts-head" x="24" y="44">On disk: a keyword index</text>` +
    `<text class="mts-head" x="24" y="70">against the tenant index</text>` +
    `<text class="mts-note" x="24" y="98">164,365 points, vectors on disk</text>`
  );
}

function update(node, i) {
  for (const v of ['d', 'm']) {
    const g = GEO[v].lat;
    const step = (g.x1 - g.x0) / SIZES.length;
    node.querySelector(`[data-k="${v}-band"]`).setAttribute('x', g.x0 + step * i);
    SIZES.forEach((_, j) => node.querySelector(`[data-k="${v}-vals-${j}"]`).classList.toggle('is-off', j !== i));
  }
  node.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === SIZES[i])));
  node.querySelector('.qi-status').textContent =
    `At ${pretty(SIZES[i])} points, the tenant index answered in ${TENANT[i].toFixed(2)} ms against ${KEYWORD[i].toFixed(2)} ms, ${ratioText(i)}. It also loaded and indexed faster, 203 s against 250 s.`;
}

function svg(v) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${head(v)}${legend(v)}${latency(v)}${setup(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Tenant size, in points"><span class="qi-hint">Tenant size:</span>' +
    SIZES.map((n) => `<button type="button" class="qi-chip" data-size="${n}" aria-pressed="false">${pretty(n)}</button>`).join('') +
    '</div></div>' +
    svg('d') +
    svg('m') +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => update(node, SIZES.indexOf(Number(b.dataset.size)))));
  update(node, 2);
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
