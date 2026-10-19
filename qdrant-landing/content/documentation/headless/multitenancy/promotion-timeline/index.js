/*
 * promotion-timeline island: a theme-aware figure for the multitenant search
 * guide (content/documentation/production-operations/multitenant-search.md).
 *
 * The three steps of promoting a tenant out of the fallback shard. The stage
 * is schematic (bar counts are illustrative); the step costs are measured in
 * one run (results/experiment_t2: 98,619 points; other tenants' p95 0.67 ms at
 * idle, 31.8 ms while copying; delete call 0.3 s; 125 s of cleanup with p95
 * 0.96 ms and one 25.4 ms spike). Write safety comes from a separate run
 * (results/experiment_t3, a 49,309-point tenant): 100 writes before the copy
 * and 100 during it, all 200 visible after cleanup.
 *
 * The step chips walk the stage through the promotion: the dashed Partial
 * shard turns solid when Active, the tenant's points fill in, its queries
 * switch shards, and its old copies leave the fallback. Opens on the finished
 * promotion. Two compositions: desktop, and a stacked one below 640px of
 * figure width.
 */

const LABEL =
  "Promoting a tenant out of the fallback shard in three steps. One: create the tenant's shard in Partial state; its queries stay on the fallback. Two: copy its 98,619 points with replicate_points in 10 seconds; the shard turns Active and the tenant's queries switch to it; other tenants' p95 latency rose from 0.67 to 32 ms. Three: delete the copies from the fallback; the call took 0.3 seconds, cleanup about 2 minutes, with one 25 ms latency spike. In a separate run, 200 of 200 writes made before and during the copy were visible afterward.";

const STEPS = [
  {
    n: 1,
    chip: '1 Create shard',
    title: 'Create shard',
    code: 'create_shard_key',
    body: ['Starts empty, in', 'Partial state, so', 'requests still use', 'the fallback.'],
    bodyM: ['Starts empty, in Partial state.'],
    status: "Step 1: the tenant's shard exists but is Partial and empty, so the tenant's queries still go to the fallback shard.",
  },
  {
    n: 2,
    chip: '2 Copy points',
    title: 'Copy points',
    code: 'replicate_points',
    body: ['98,619 points', 'copied in 10 s'],
    bodyM: ['98,619 points copied in 10 s'],
    pill: { text: "others' p95: 32 ms", tone: 'red' },
    status: "Step 2: replicate_points copied 98,619 points in 10 s. The shard turned Active and the tenant's queries switched to it; other tenants' p95 rose to 32 ms meanwhile.",
  },
  {
    n: 3,
    chip: '3 Clean fallback',
    title: 'Clean fallback',
    code: 'delete(filter)',
    body: ['delete call: 0.3 s', 'cleanup: about 2 min'],
    bodyM: ['delete 0.3 s, cleanup about 2 min'],
    pill: { text: 'one 25 ms spike', tone: 'orange' },
    status: 'Step 3: deleting the old copies from the fallback took 0.3 s, then about 2 minutes of cleanup with one 25 ms spike. Until then, the fallback keeps a stale copy.',
  },
];

// Fallback shard contents: every third point belongs to the promoted tenant.
const FALLBACK = Array.from({ length: 24 }, (_, i) => (i % 3 === 2 ? 'o' : ['b', 'p', 'c'][Math.floor(i / 3) % 3]));
const FILL = { o: 'var(--mts-orange)', b: 'var(--mts-blue)', p: 'var(--mts-purple)', c: 'var(--mts-cyan)' };

const GEO = {
  d: {
    w: 960, h: 740,
    pill: { cx: 540, y: 108 },
    fb: { x: 40, y: 164, w: 460, h: 180, label: 'fallback shard', bx: 60, bw: 420, slot: 17.5, bar: 9 },
    ts: { x: 580, y: 164, w: 340, h: 180, label: "tenant's shard", bx: 610, slot: 34, bar: 12 },
    bars: { y: 208, h: 92 },
    stateY: 332,
    copy: true,
    cards: { tops: null, xs: [40, 350, 660], y: 372, w: 260, h: 240 },
    band: { x: 40, y: 636, w: 880 },
  },
  m: {
    w: 480, h: 1356,
    pill: { cx: 240, y: 142 },
    fb: { x: 24, y: 198, w: 268, h: 170, label: 'fallback', bx: 40, bw: 236, slot: 9.8, bar: 6 },
    ts: { x: 308, y: 198, w: 148, h: 170, label: 'own shard', bx: 318, slot: 16, bar: 9 },
    bars: { y: 238, h: 88 },
    stateY: 356,
    copy: false,
    cards: { tops: [400, 660, 920], x: 24, w: 432, h: 216 },
    band: { x: 24, y: 1180, w: 432 },
  },
};

function pill(x, y, { text, tone }) {
  const w = text.length * 11.4 + 24;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="32" rx="16" style="fill:var(--mts-${tone}-t)"/>` +
    `<text class="mts-note" x="${x + 12}" y="${y + 22}" style="fill:var(--mts-${tone}-ink)">${text}</text>`
  );
}

function stage(v) {
  const g = GEO[v];
  const { fb, ts, bars } = g;
  let out = '';
  // Routing: a "tenant's queries" pill with one arrow per possible target.
  const pw = 206;
  const px = g.pill.cx - pw / 2;
  const py = g.pill.y;
  out += `<rect x="${px}" y="${py}" width="${pw}" height="32" rx="16" style="fill:var(--mts-orange-t)"/>`;
  out += `<text class="mts-note" x="${g.pill.cx}" y="${py + 22}" text-anchor="middle" style="fill:var(--mts-orange-ink)">tenant's queries</text>`;
  // From the pill's side when the target is beside it, straight down when the
  // target sits under it (the narrow composition).
  const arrow = (k, x1, x2, yTop) => {
    const under = x2 > px && x2 < px + pw;
    const d = under ? `M${x2} ${py + 32} V${yTop - 10}` : `M${x1} ${py + 16} H${x2} V${yTop - 10}`;
    return (
      `<g data-k="${v}-route-${k}"><path d="${d}" stroke-width="2.5" fill="none" style="stroke:var(--mts-orange)"/>` +
      `<path d="M${x2 - 6} ${yTop - 12} L${x2} ${yTop - 2} L${x2 + 6} ${yTop - 12} Z" style="fill:var(--mts-orange)"/></g>`
    );
  };
  out += arrow('fb', px, fb.x + fb.w / 2, fb.y);
  out += arrow('ts', px + pw, ts.x + ts.w / 2, ts.y);
  // Shards.
  out += `<rect x="${fb.x}" y="${fb.y}" width="${fb.w}" height="${fb.h}" rx="10" stroke-width="2" style="fill:var(--mts-card);stroke:var(--qi-line)"/>`;
  out += `<text class="mts-head" x="${fb.x + 16}" y="${fb.y + 30}">${fb.label}</text>`;
  out += `<rect data-k="${v}-ts-frame" x="${ts.x}" y="${ts.y}" width="${ts.w}" height="${ts.h}" rx="10" stroke-width="2" style="fill:var(--mts-card);stroke:var(--mts-orange)"/>`;
  out += `<text class="mts-head" x="${ts.x + 16}" y="${ts.y + 30}">${ts.label}</text>`;
  FALLBACK.forEach((t, i) => {
    out += `<rect data-k="${v}-fb-${i}" x="${fb.bx + i * fb.slot}" y="${bars.y}" width="${fb.bar}" height="${bars.h}" rx="2" style="fill:${FILL[t]}"/>`;
  });
  for (let i = 0; i < 8; i++) {
    out += `<rect data-k="${v}-ts-${i}" x="${ts.bx + i * ts.slot}" y="${bars.y}" width="${ts.bar}" height="${bars.h}" rx="2" style="fill:${FILL.o}"/>`;
  }
  out += `<text class="mts-note" data-k="${v}-fb-state" x="${fb.x + 16}" y="${g.stateY}"></text>`;
  out += `<text class="mts-note" data-k="${v}-ts-state" x="${ts.x + 16}" y="${g.stateY}"></text>`;
  if (g.copy) {
    const y = fb.y + fb.h / 2;
    out += `<g data-k="${v}-copy"><path d="M${fb.x + fb.w + 6} ${y} H${ts.x - 12}" stroke-width="2.5" style="stroke:var(--mts-orange)"/>`;
    out += `<path d="M${ts.x - 14} ${y - 6} L${ts.x - 4} ${y} L${ts.x - 14} ${y + 6} Z" style="fill:var(--mts-orange)"/>`;
    out += `<text class="mts-note" x="${(fb.x + fb.w + ts.x) / 2}" y="${y - 14}" text-anchor="middle" style="fill:var(--mts-orange-ink)">copy</text></g>`;
  }
  return out;
}

function stepHead(x, y, step) {
  return (
    `<circle cx="${x + 34}" cy="${y + 38}" r="16" style="fill:var(--qi-fg)"/>` +
    `<text class="mts-small" x="${x + 34}" y="${y + 45}" text-anchor="middle" style="fill:var(--mts-inset);font-weight:600">${step.n}</text>` +
    `<text class="mts-head" x="${x + 62}" y="${y + 45}">${step.title}</text>` +
    `<rect x="${x + 20}" y="${y + 66}" width="220" height="34" rx="6" style="fill:var(--mts-inset);stroke:var(--qi-border)"/>` +
    `<text class="mts-note" x="${x + 32}" y="${y + 89}" style="fill:var(--qi-fg)">${step.code}</text>`
  );
}

function cards(v) {
  const c = GEO[v].cards;
  let out = '';
  STEPS.forEach((s, i) => {
    const x = v === 'd' ? c.xs[i] : c.x;
    const y = v === 'd' ? c.y : c.tops[i];
    out += `<rect data-k="${v}-card-${i}" x="${x}" y="${y}" width="${c.w}" height="${c.h}" rx="12" style="fill:var(--mts-card);stroke:var(--qi-border)"/>`;
    out += stepHead(x, y, s);
    const body = v === 'd' ? s.body : s.bodyM;
    body.forEach((line, j) => {
      out += `<text class="mts-note" x="${x + 20}" y="${y + 138 + j * 24}" style="fill:var(--qi-fg)">${line}</text>`;
    });
    if (s.pill) out += pill(x + 20, v === 'd' ? y + 190 : y + 162, s.pill);
    if (v === 'd' && i < 2) {
      const ax = x + c.w + 4;
      const ay = y + c.h / 2;
      out += `<line x1="${ax}" x2="${c.xs[i + 1] - 12}" y1="${ay}" y2="${ay}" stroke-width="2" style="stroke:var(--qi-line)"/>`;
      out += `<path d="M${c.xs[i + 1] - 14} ${ay - 6} L${c.xs[i + 1] - 4} ${ay} L${c.xs[i + 1] - 14} ${ay + 6} Z" style="fill:var(--qi-line)"/>`;
    }
    if (v === 'm' && i < 2) {
      const ay1 = y + c.h + 6;
      const ay2 = c.tops[i + 1] - 4;
      out += `<line x1="240" x2="240" y1="${ay1}" y2="${ay2 - 8}" stroke-width="2" style="stroke:var(--qi-line)"/>`;
      out += `<path d="M234 ${ay2 - 10} L240 ${ay2} L246 ${ay2 - 10} Z" style="fill:var(--qi-line)"/>`;
    }
  });
  return out;
}

function writeBand(v) {
  const { x, y, w } = GEO[v].band;
  const lines =
    v === 'd'
      ? [
          ['mts-small', 'Writes made during promotion: 200 of 200 visible afterward'],
          ['mts-note', '100 before the copy and 100 during it; separate run, 49,309 points'],
        ]
      : [
          ['mts-small', 'Writes made during'],
          ['mts-small', 'promotion: 200 of 200'],
          ['mts-small', 'visible afterward'],
          ['mts-note', '100 before the copy, 100'],
          ['mts-note', 'during it; separate run'],
        ];
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${24 + lines.length * 26}" rx="12" style="fill:var(--mts-card);stroke:var(--qi-border)"/>`;
  out += `<circle cx="${x + 30}" cy="${y + 30}" r="12" style="fill:var(--mts-cyan)"/>`;
  out += `<path d="M${x + 24} ${y + 30} l4 4 l8 -9" stroke-width="2.5" fill="none" style="stroke:var(--mts-inset)"/>`;
  lines.forEach(([cls, text], i) => {
    out += `<text class="${cls}" x="${x + 56}" y="${y + 37 + i * 26}">${text}</text>`;
  });
  return out;
}

function head(v) {
  if (v === 'd') {
    return (
      `<text class="mts-head" x="40" y="56">Promoting a tenant out of the fallback shard</text>` +
      `<text class="mts-note" x="40" y="84">one run, 98,619 points; other tenants' p95 at idle: 0.67 ms</text>`
    );
  }
  return (
    `<text class="mts-head" x="24" y="44">Promoting a tenant out of</text>` +
    `<text class="mts-head" x="24" y="70">the fallback shard</text>` +
    `<text class="mts-note" x="24" y="98">one run, 98,619 points; other</text>` +
    `<text class="mts-note" x="24" y="122">tenants' p95 at idle: 0.67 ms</text>`
  );
}

function update(node, n) {
  for (const v of ['d', 'm']) {
    const g = GEO[v];
    const q = (k) => node.querySelector(`[data-k="${v}-${k}"]`);
    q('route-fb').classList.toggle('is-off', n !== 1);
    q('route-ts').classList.toggle('is-off', n === 1);
    if (g.copy) q('copy').classList.toggle('is-off', n !== 2);
    const frame = q('ts-frame');
    frame.setAttribute('stroke-dasharray', n === 1 ? '7 6' : 'none');
    // Fallback: the promoted tenant's copies leave in step 3 and the rest close up.
    let pos = 0;
    FALLBACK.forEach((t, i) => {
      const bar = q(`fb-${i}`);
      const gone = n === 3 && t === 'o';
      bar.classList.toggle('is-off', gone);
      if (!gone) {
        bar.setAttribute('x', g.fb.bx + (n === 3 ? pos : i) * (n === 3 ? g.fb.bw / 16 : g.fb.slot));
        pos++;
      }
    });
    for (let i = 0; i < 8; i++) {
      const bar = q(`ts-${i}`);
      bar.style.transitionDelay = n === 1 ? '0s' : `${0.1 + i * 0.06}s`;
      bar.classList.toggle('is-off', n === 1);
    }
    q('fb-state').textContent = ["tenant's points here", 'still holds a copy', 'old copies deleted'][n - 1];
    q('ts-state').textContent = n === 1 ? (v === 'd' ? 'Partial, empty' : 'Partial') : 'Active';
    STEPS.forEach((s, i) => {
      const card = q(`card-${i}`);
      card.style.stroke = i === n - 1 ? 'var(--qi-fg)' : 'var(--qi-border)';
      card.setAttribute('stroke-width', i === n - 1 ? 2 : 1);
    });
  }
  node.querySelectorAll('[data-step]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === n)));
  node.querySelector('.qi-status').textContent = STEPS[n - 1].status;
}

function svg(v) {
  const { w, h } = GEO[v];
  return `<svg class="qi-svg qi-mts__${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${head(v)}${stage(v)}${cards(v)}${writeBand(v)}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Promotion step"><span class="qi-hint">Step:</span>' +
    STEPS.map((s) => `<button type="button" class="qi-chip" data-step="${s.n}" aria-pressed="false">${s.chip}</button>`).join('') +
    '</div></div>' +
    svg('d') +
    svg('m') +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => update(node, Number(b.dataset.step))));
  update(node, 3);
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
