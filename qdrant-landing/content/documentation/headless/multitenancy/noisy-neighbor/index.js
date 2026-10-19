/*
 * noisy-neighbor island: a theme-aware figure for the multitenant search guide
 * (content/documentation/production-operations/multitenant-search.md).
 *
 * Measured, one cluster (Qdrant Cloud, 2 vCPU, 6.9 GB RAM): p95 latency of the
 * existing tenants' queries before, during, and after a new 100,000-point
 * tenant loads. Two runs of the same shared-collection setup
 * (results/experiment_c) and one with the new tenant on its own shard
 * (results/experiment_s2). Load durations are each run's loading phase. All
 * values are a static table.
 *
 * The phase chips move each setup's marker; the hollow marker stays at idle.
 * Opens on "during the load", the state the guide's text describes. Two
 * compositions: desktop, and a stacked one below 640px of figure width.
 */

const LABEL =
  "P95 latency of other tenants' queries before, during, and after a new 100,000-point tenant loads. Shared collection, run 1: 0.78, 0.95, then 0.88 ms over a 15-minute load. Shared collection, run 2: 0.74, 6.84, then 0.71 ms over a 2-minute load. Own shard: 0.69, 0.73, then 0.72 ms over a 4-minute load.";

const ROWS = [
  { head: 'Shared collection', note: 'run 1, load took 15 min', idle: 0.78, load: 0.95, after: 0.88 },
  { head: 'Shared collection', note: 'run 2, load took 2 min', idle: 0.74, load: 6.84, after: 0.71 },
  { head: 'Own shard', note: 'load took 4 min', idle: 0.69, load: 0.73, after: 0.72 },
];
const PHASES = [
  { id: 'idle', label: 'Idle', legend: 'idle' },
  { id: 'load', label: 'During the load', legend: 'while the new tenant loads' },
  { id: 'after', label: 'After the load', legend: 'after loading finished' },
];
const STATUS = {
  idle: "Idle: all three setups answer the other tenants' queries in under 0.8 ms at p95.",
  load: 'During the load: the shared collection rose to 0.95 ms on one run and 6.84 ms on the other, from the same setup; the own shard stayed at 0.73 ms.',
  after: 'After the load: every setup is back near idle, 0.71 to 0.88 ms. The cost is paid only while the new tenant loads.',
};
const MAX_MS = 7;
const f2 = (v) => v.toFixed(2);

const GEO = {
  d: { w: 960, h: 480, x0: 340, x1: 900, lines: [204, 284, 364], heads: (i) => [40, [204, 284, 364][i] - 4], axisY: 404, axisTop: 164, legend: [[40, 128], [170, 128]] },
  m: { w: 480, h: 676, x0: 24, x1: 456, lines: [296, 402, 560], heads: (i) => [24, [244, 350, 508][i]], axisY: 596, axisTop: 220, legend: [[24, 162], [24, 192]] },
};

function tone(row, phase) {
  return phase === 'load' && row.load - row.idle > 1 ? 'var(--mts-red)' : 'var(--qi-muted)';
}

function staticLayer(v) {
  const g = GEO[v];
  const sx = (ms) => g.x0 + (ms * (g.x1 - g.x0)) / MAX_MS;
  let out = '';
  if (v === 'd') {
    out += `<text class="mts-head" x="40" y="56">Other tenants' p95 latency while a new tenant loads</text>`;
    out += `<text class="mts-note" x="40" y="84">idle, during, and after the load of a 100,000-point tenant</text>`;
  } else {
    out += `<text class="mts-head" x="24" y="44">Other tenants' p95 latency</text>`;
    out += `<text class="mts-head" x="24" y="70">while a new tenant loads</text>`;
    out += `<text class="mts-note" x="24" y="98">idle, during, and after the load</text>`;
    out += `<text class="mts-note" x="24" y="122">of a 100,000-point tenant</text>`;
  }
  const [[lx1, ly1], [lx2, ly2]] = g.legend;
  out += `<circle cx="${lx1 + 8}" cy="${ly1 - 6}" r="7" stroke-width="3" style="fill:var(--mts-inset);stroke:var(--qi-fg)"/>`;
  out += `<text class="mts-note" x="${lx1 + 26}" y="${ly1}" style="fill:var(--qi-fg)">idle</text>`;
  out += `<circle cx="${lx2 + 8}" cy="${ly2 - 6}" r="8" style="fill:var(--qi-fg)"/>`;
  out += `<text class="mts-note" x="${lx2 + 26}" y="${ly2}" style="fill:var(--qi-fg)" data-k="${v}-legend"></text>`;
  for (let ms = 0; ms <= MAX_MS; ms++) {
    const x = sx(ms);
    if (ms > 0) out += `<line x1="${x}" x2="${x}" y1="${g.axisTop}" y2="${g.axisY}" class="mts-grid"/>`;
    out += `<text class="mts-note" x="${x}" y="${g.axisY + 26}" text-anchor="middle">${ms}</text>`;
  }
  out += `<path d="M${g.x0} ${g.axisTop} V${g.axisY} H${g.x1}" class="mts-axis"/>`;
  out += `<text class="mts-note" x="${(g.x0 + g.x1) / 2}" y="${g.axisY + 58}" text-anchor="middle">p95 latency, ms</text>`;
  ROWS.forEach((r, i) => {
    const [hx, hy] = g.heads(i);
    const y = g.lines[i];
    out += `<text class="mts-head" x="${hx}" y="${hy}">${r.head}</text>`;
    out += `<text class="mts-note" x="${hx}" y="${hy + (v === 'd' ? 26 : 24)}">${r.note}</text>`;
    out += `<rect data-k="${v}-trail-${i}" x="${sx(r.idle)}" y="${y - 3}" width="0" height="6" rx="3"/>`;
    out += `<circle cx="${sx(r.idle)}" cy="${y}" r="8" stroke-width="3" style="fill:var(--mts-inset);stroke:var(--qi-muted)"/>`;
    out += `<circle data-k="${v}-dot-${i}" cx="${sx(r.idle)}" cy="${y}" r="9"/>`;
    out += `<text class="mts-small" data-k="${v}-label-${i}" y="${y}"></text>`;
    out += `<text class="mts-note" data-k="${v}-note-${i}" y="${y}" text-anchor="end" style="fill:var(--mts-red-ink)"></text>`;
  });
  return out;
}

function update(node, phase) {
  for (const v of ['d', 'm']) {
    const g = GEO[v];
    const sx = (ms) => g.x0 + (ms * (g.x1 - g.x0)) / MAX_MS;
    const q = (k) => node.querySelector(`[data-k="${v}-${k}"]`);
    q('legend').textContent = PHASES.find((p) => p.id === phase).legend;
    ROWS.forEach((r, i) => {
      const y = g.lines[i];
      const cur = r[phase];
      const xa = sx(r.idle);
      const xb = sx(cur);
      const color = tone(r, phase);
      const trail = q(`trail-${i}`);
      trail.setAttribute('x', Math.min(xa, xb));
      trail.setAttribute('width', Math.abs(xb - xa));
      trail.style.fill = color;
      const dot = q(`dot-${i}`);
      dot.setAttribute('cx', xb);
      dot.style.fill = color;
      const label = q(`label-${i}`);
      const note = q(`note-${i}`);
      label.textContent = phase === 'idle' ? `${f2(r.idle)} ms` : `${f2(r.idle)} → ${f2(cur)} ms`;
      const long = xb - xa > 120;
      if (long && v === 'd') {
        label.setAttribute('x', (xa + xb) / 2);
        label.setAttribute('y', y - 18);
        label.setAttribute('text-anchor', 'middle');
      } else if (long) {
        label.setAttribute('x', g.x1);
        label.setAttribute('y', y + 36);
        label.setAttribute('text-anchor', 'end');
      } else {
        label.setAttribute('x', Math.max(xa, xb) + 22);
        label.setAttribute('y', y + 7);
        label.setAttribute('text-anchor', 'start');
      }
      note.textContent = long ? '9× its idle p95' : '';
      note.setAttribute('x', v === 'd' ? xb : g.x1);
      note.setAttribute('y', v === 'd' ? y + 34 : y + 62);
    });
  }
  node.querySelectorAll('[data-phase]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.phase === phase)));
  node.querySelector('.qi-status').textContent = STATUS[phase];
}

function svg(v) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${staticLayer(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Load phase"><span class="qi-hint">Phase:</span>' +
    PHASES.map((p) => `<button type="button" class="qi-chip" data-phase="${p.id}" aria-pressed="false">${p.label}</button>`).join('') +
    '</div></div>' +
    svg('d') +
    svg('m') +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.phase)));
  update(node, 'load');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
