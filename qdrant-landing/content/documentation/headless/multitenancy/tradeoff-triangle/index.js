/*
 * tradeoff-triangle island: a theme-aware figure for the multitenant search
 * guide (content/documentation/production-operations/multitenant-search.md).
 * The folder keeps its original name so the embed path stays stable; the
 * figure is now a slope chart, not a triangle.
 *
 * Qualitative, not measured: the levels restate the guide's architecture
 * table (Silo, Bridge, Pool against isolation, infrastructure cost, and
 * ongoing enforcement in code). Along the Silo to Pool gradient, isolation
 * and cost fall together while the enforcement your code carries jumps at
 * Pool, so no design wins on all three.
 *
 * The architecture chips move the highlight. Opens on Pool, the case the rest
 * of the guide covers. Two compositions: desktop, and a stacked one below
 * 640px of figure width.
 */

const LABEL =
  'Qualitative. Silo, a cluster per tenant: high isolation, high infrastructure cost, low enforcement in your code. Bridge, a collection per tenant: medium isolation, medium cost, low enforcement through collection-scoped keys. Pool, a shared collection: low isolation, low cost, high enforcement in your code. No design wins on all three.';

const ARCHS = [
  { id: 'silo', name: 'Silo', sub: ['cluster', 'per tenant'], status: 'Silo, a cluster per tenant: the most isolated design, at the highest infrastructure cost, with little left for your code to enforce.' },
  { id: 'bridge', name: 'Bridge', sub: ['collection', 'per tenant'], status: 'Bridge, a collection per tenant: Qdrant enforces the boundary through collection-scoped keys, at moderate cost.' },
  { id: 'pool', name: 'Pool', sub: ['shared', 'collection'], status: 'Pool, a shared collection: the cheapest to run, but your code enforces every tenant boundary. The rest of this guide covers this case.' },
];
// Levels 2 = high, 1 = medium, 0 = low, per architecture; offset keeps
// coinciding lines visible side by side.
const AXES = [
  { label: 'isolation', color: 'var(--mts-cyan)', ink: 'var(--mts-cyan-ink)', levels: [2, 1, 0], offset: -9 },
  { label: 'infrastructure cost', color: 'var(--mts-blue)', ink: 'var(--mts-blue-ink)', levels: [2, 1, 0], offset: 9 },
  { label: 'enforcement in your code', color: 'var(--mts-red)', ink: 'var(--mts-red-ink)', levels: [0, 0, 2], offset: 0 },
];
const LEVEL_NAME = ['low', 'medium', 'high'];

const GEO = {
  d: { w: 960, h: 540, xs: [330, 590, 850], ys: [392, 292, 192], levelX: 250, legend: [40, 124], subY: 470, band: 200 },
  m: { w: 480, h: 640, xs: [160, 290, 410], ys: [470, 380, 290], levelX: 110, legend: [24, 150], subY: 520, band: 116 },
};

function legend(v) {
  const [x, y] = GEO[v].legend;
  let out = '';
  let lx = x;
  let ly = y;
  AXES.forEach((a) => {
    const w = 34 + a.label.length * 11.4 + 30;
    if (lx + w > (v === 'd' ? 940 : 470)) {
      lx = x;
      ly += 30;
    }
    out += `<line x1="${lx}" x2="${lx + 24}" y1="${ly - 6}" y2="${ly - 6}" stroke-width="4" stroke-linecap="round" style="stroke:${a.color}"/>`;
    out += `<text class="mts-note" x="${lx + 34}" y="${ly}" style="fill:var(--qi-fg)">${a.label}</text>`;
    lx += w;
  });
  return out;
}

function chart(v) {
  const g = GEO[v];
  let out = `<rect data-k="${v}-band" x="${g.xs[2] - g.band / 2}" y="${g.ys[2] - 46}" width="${g.band}" height="${g.ys[0] - g.ys[2] + 92 + (g.subY - g.ys[0])}" rx="12" style="fill:var(--mts-card)"/>`;
  g.ys.forEach((y, lvl) => {
    out += `<line x1="${g.levelX + 16}" x2="${g.xs[2] + g.band / 2}" y1="${y}" y2="${y}" class="mts-grid"/>`;
    out += `<text class="mts-note" x="${g.levelX}" y="${y + 6}" text-anchor="end">${LEVEL_NAME[lvl]}</text>`;
  });
  AXES.forEach((a) => {
    const pts = a.levels.map((l, i) => `${g.xs[i]},${g.ys[l] + a.offset}`).join(' ');
    out += `<polyline points="${pts}" fill="none" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" style="stroke:${a.color}"/>`;
    a.levels.forEach((l, i) => {
      out += `<circle data-k="${v}-pt-${i}" cx="${g.xs[i]}" cy="${g.ys[l] + a.offset}" r="8" stroke-width="3" style="fill:${a.color};stroke:var(--mts-inset)"/>`;
    });
  });
  ARCHS.forEach((arch, i) => {
    out += `<text class="mts-head" x="${g.xs[i]}" y="${g.subY - 26}" text-anchor="middle">${arch.name}</text>`;
    const sub = v === 'd' ? [arch.sub.join(' ')] : arch.sub;
    sub.forEach((s, j) => {
      out += `<text class="mts-note" x="${g.xs[i]}" y="${g.subY + j * 24}" text-anchor="middle">${s}</text>`;
    });
  });
  return out;
}

function head(v) {
  if (v === 'd') {
    return (
      `<text class="mts-head" x="40" y="56">Isolation, cost, and enforcement across three architectures</text>` +
      `<text class="mts-note" x="40" y="84">qualitative, not measured; no design wins on all three</text>`
    );
  }
  return (
    `<text class="mts-head" x="24" y="44">Isolation, cost, and</text>` +
    `<text class="mts-head" x="24" y="70">enforcement by architecture</text>` +
    `<text class="mts-note" x="24" y="98">qualitative, not measured</text>`
  );
}

function update(node, id) {
  const i = ARCHS.findIndex((a) => a.id === id);
  for (const v of ['d', 'm']) {
    const g = GEO[v];
    node.querySelector(`[data-k="${v}-band"]`).setAttribute('x', g.xs[i] - g.band / 2);
    ARCHS.forEach((_, j) => node.querySelectorAll(`[data-k="${v}-pt-${j}"]`).forEach((c) => c.setAttribute('r', j === i ? 11 : 7)));
  }
  node.querySelectorAll('[data-arch]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.arch === id)));
  node.querySelector('.qi-status').textContent = ARCHS[i].status;
}

function svg(v) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${head(v)}${legend(v)}${chart(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Architecture"><span class="qi-hint">Architecture:</span>' +
    ARCHS.map((a) => `<button type="button" class="qi-chip" data-arch="${a.id}" aria-pressed="false">${a.name}</button>`).join('') +
    '</div></div>' +
    svg('d') +
    svg('m') +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-arch]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.arch)));
  update(node, 'pool');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
