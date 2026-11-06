/*
 * isolation-tradeoff island: a theme-aware figure for the multitenant search
 * guide (content/documentation/production-operations/multitenant-search.md).
 *
 * Measured on one node (Qdrant Cloud, 2 vCPU, 6.9 GB RAM). Shared: one
 * collection where the whale holds 90% of the points (results/experiment_b,
 * variant "payload"). Own shard: the whale on its own shard, everyone else
 * still shared (results/experiment_s1, variant "whale_shard"). Approximate
 * search, mean recall@10 and p50 latency per tenant. A static table.
 *
 * The whale chips move every tenant's marker between the two states; the
 * hollow marker stays at the shared value. Opens on "own shard", the state the
 * guide's text describes. Two compositions: desktop, and a stacked one below
 * 640px of figure width.
 */

const LABEL =
  'Moving the dominant tenant onto its own shard, on one node. Whale, 90% of points: recall 0.985 to 0.997, p50 latency 1.96 to 1.81 ms. Mid tenant, 5% of points: recall 0.999 to 0.981, latency 1.71 to 1.18 ms. Tiny tenant: recall 1.00 to 1.00, latency 0.52 to 0.55 ms.';

const TENANTS = [
  { head: 'Whale', note: '90% of points' },
  { head: 'Mid', note: '5% of points' },
  { head: 'Tiny', note: 'one real author' },
];
// [shared, own shard, tone]; recall higher is better, latency lower is better.
const RECALL = [
  [0.985, 0.997, 'better'],
  [0.999, 0.981, 'worse'],
  [1.0, 1.0, 'flat'],
];
const LATENCY = [
  [1.96, 1.81, 'better'],
  [1.71, 1.18, 'better'],
  [0.52, 0.55, 'flat'],
];
const STATES = [
  { id: 'shared', label: 'In the shared collection' },
  { id: 'own', label: 'On its own shard' },
];
const STATUS = {
  shared: 'All three tenants share one collection, and the whale holds 90% of it. Its own recall is the lowest of the three, 0.985.',
  own: 'With the whale on its own shard, its recall rose to 0.997. The mid tenant got faster but its recall fell to 0.981, and the tiny tenant barely moved.',
};
const TONE = { better: 'var(--mts-cyan)', worse: 'var(--mts-red)', flat: 'var(--qi-muted)' };
const fmtRecall = (v, tick) => v.toFixed(tick ? 2 : 3);
const fmtMs = (v, tick) => v.toFixed(tick ? 1 : 2);

const RECALL_AXIS = { lo: 0.97, hi: 1.0, ticks: [0.97, 0.98, 0.99, 1.0], fmt: fmtRecall };
const LAT_AXIS_D = { lo: 0, hi: 2.0, ticks: [0, 0.5, 1, 1.5, 2], fmt: fmtMs };
const LAT_AXIS_M = { lo: 0, hi: 2.0, ticks: [0, 1, 2], fmt: fmtMs };

// Panels per composition: [key, title, values, axis, x0, x1, title y, rows y, axis y].
const PANELS = {
  d: [
    ['r', 'Recall', RECALL, RECALL_AXIS, 250, 560, 206, [268, 352, 436], 476],
    ['l', 'p50 latency, ms', LATENCY, LAT_AXIS_D, 630, 920, 206, [268, 352, 436], 476],
  ],
  m: [
    ['r', 'Recall', RECALL, RECALL_AXIS, 200, 456, 268, [360, 436, 512], 552],
    ['l', 'p50 latency, ms', LATENCY, LAT_AXIS_M, 200, 456, 640, [732, 808, 884], 924],
  ],
};

function legend(x, y, mobile) {
  let out =
    `<circle cx="${x + 8}" cy="${y - 6}" r="7" stroke-width="3" style="fill:var(--mts-inset);stroke:var(--qi-fg)"/>` +
    `<text class="mts-note" x="${x + 26}" y="${y}" style="fill:var(--qi-fg)">whale in the shared collection</text>`;
  const fx = mobile ? x : x + 420;
  const fy = mobile ? y + 30 : y;
  out +=
    `<circle cx="${fx + 8}" cy="${fy - 6}" r="8" style="fill:var(--qi-fg)"/>` +
    `<text class="mts-note" x="${fx + 26}" y="${fy}" style="fill:var(--qi-fg)">selected state</text>`;
  const ty = mobile ? y + 60 : y + 32;
  let tx = x;
  [['better', 'better'], ['worse', 'worse'], ['flat', 'no real change']].forEach(([k, label]) => {
    out += `<line x1="${tx}" x2="${tx + 22}" y1="${ty - 6}" y2="${ty - 6}" stroke-width="4" stroke-linecap="round" style="stroke:${TONE[k]}"/>`;
    out += `<text class="mts-note" x="${tx + 32}" y="${ty}" style="fill:var(--qi-fg)">${label}</text>`;
    tx += 32 + label.length * 11.4 + 30;
  });
  return out;
}

function staticLayer(v) {
  let out = '';
  if (v === 'd') {
    out += `<text class="mts-head" x="40" y="56">Moving the dominant tenant onto its own shard</text>`;
    out += `<text class="mts-note" x="40" y="84">one node; approximate search, mean recall@10 and p50 latency</text>`;
    out += legend(40, 126, false);
    [268, 352, 436].forEach((y, i) => {
      out += `<text class="mts-head" x="40" y="${y - 2}">${TENANTS[i].head}</text>`;
      out += `<text class="mts-note" x="40" y="${y + 24}">${TENANTS[i].note}</text>`;
    });
    out += `<g data-k="d-foot"><text class="mts-note" x="40" y="548">The tiny tenant barely moved: on one node, a dedicated shard</text>`;
    out += `<text class="mts-note" x="40" y="572">still shares the node's CPU, RAM, and disk.</text></g>`;
  } else {
    out += `<text class="mts-head" x="24" y="44">Moving the dominant tenant</text>`;
    out += `<text class="mts-head" x="24" y="70">onto its own shard</text>`;
    out += `<text class="mts-note" x="24" y="98">one node; approximate search,</text>`;
    out += `<text class="mts-note" x="24" y="122">mean recall@10 and p50 latency</text>`;
    out += legend(24, 162, true);
    [[360, 436, 512], [732, 808, 884]].forEach((rows) => {
      rows.forEach((y, i) => {
        out += `<text class="mts-head" x="24" y="${y - 2}">${TENANTS[i].head}</text>`;
        out += `<text class="mts-note" x="24" y="${y + 24}">${TENANTS[i].note}</text>`;
      });
    });
    out += `<g data-k="m-foot"><text class="mts-note" x="24" y="1000">The tiny tenant barely moved:</text>`;
    out += `<text class="mts-note" x="24" y="1024">on one node, a dedicated shard</text>`;
    out += `<text class="mts-note" x="24" y="1048">still shares CPU, RAM, and disk.</text></g>`;
  }
  PANELS[v].forEach(([key, title, values, axis, x0, x1, ty, rows, ay]) => {
    const sx = (val) => x0 + ((val - axis.lo) * (x1 - x0)) / (axis.hi - axis.lo);
    out += `<text class="mts-head" x="${x0}" y="${ty}">${title}</text>`;
    axis.ticks.forEach((t) => {
      const x = sx(t);
      out += `<line x1="${x}" x2="${x}" y1="${rows[0] - 40}" y2="${ay}" class="mts-grid"/>`;
      out += `<text class="mts-note" x="${x}" y="${ay + 26}" text-anchor="middle">${axis.fmt(t, true)}</text>`;
    });
    out += `<line x1="${x0}" x2="${x1}" y1="${ay}" y2="${ay}" class="mts-axis"/>`;
    values.forEach(([a], i) => {
      const y = rows[i];
      out += `<rect data-k="${v}-${key}-trail-${i}" x="${sx(a)}" y="${y - 3}" width="0" height="6" rx="3"/>`;
      out += `<circle cx="${sx(a)}" cy="${y}" r="8" stroke-width="3" style="fill:var(--mts-inset);stroke:var(--qi-muted)"/>`;
      out += `<circle data-k="${v}-${key}-dot-${i}" cx="${sx(a)}" cy="${y}" r="9"/>`;
      out += `<text class="mts-small" data-k="${v}-${key}-label-${i}" y="${y - 20}"></text>`;
    });
  });
  return out;
}

function update(node, state) {
  for (const v of ['d', 'm']) {
    PANELS[v].forEach(([key, , values, axis, x0, x1]) => {
      const sx = (val) => x0 + ((val - axis.lo) * (x1 - x0)) / (axis.hi - axis.lo);
      values.forEach(([a, b, tone], i) => {
        const cur = state === 'own' ? b : a;
        const xa = sx(a);
        const xb = sx(cur);
        const color = state === 'own' ? TONE[tone] : 'var(--qi-muted)';
        const q = (k) => node.querySelector(`[data-k="${v}-${key}-${k}-${i}"]`);
        const trail = q('trail');
        trail.setAttribute('x', Math.min(xa, xb));
        trail.setAttribute('width', Math.abs(xb - xa));
        trail.style.fill = color;
        const dot = q('dot');
        dot.setAttribute('cx', xb);
        dot.style.fill = color;
        const label = q('label');
        label.textContent = state === 'own' ? `${axis.fmt(a)} → ${axis.fmt(b)}` : axis.fmt(a);
        const w = label.textContent.length * 12;
        const center = state === 'own' ? (xa + sx(b)) / 2 : xa;
        let lx = center;
        let anchor = 'middle';
        if (center + w / 2 > x1) {
          lx = x1;
          anchor = 'end';
        } else if (center - w / 2 < x0) {
          lx = x0;
          anchor = 'start';
        }
        label.setAttribute('x', lx);
        label.setAttribute('text-anchor', anchor);
      });
    });
  }
  ['d', 'm'].forEach((v) => node.querySelector(`[data-k="${v}-foot"]`).classList.toggle('is-off', state !== 'own'));
  node.querySelectorAll('[data-state]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));
  node.querySelector('.qi-status').textContent = STATUS[state];
}

function svg(v, w, h) {
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${staticLayer(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Where the whale lives"><span class="qi-hint">Whale:</span>' +
    STATES.map((s) => `<button type="button" class="qi-chip" data-state="${s.id}" aria-pressed="false">${s.label}</button>`).join('') +
    '</div></div>' +
    svg('d', 960, 596) +
    svg('m', 480, 1072) +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-state]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.state)));
  update(node, 'own');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
