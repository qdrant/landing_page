/*
 * membership-visibility island: a theme-aware figure for the multitenant
 * search guide (content/documentation/production-operations/multitenant-search.md).
 *
 * One co-authored article for tenants A and B, stored either once with a
 * list-valued tenant field [A, B] or once per tenant, in each model: where the
 * copies live and whether each co-author's query reaches one. The drawings
 * are schematic; the results are measured. Payload field: recall 1.00 either
 * way, 161,413 points shared against 257,726 duplicated
 * (results/experiment_a2). Shard per tenant: 245 of 482 memberships visible
 * shared, 482 of 482 duplicated (results/experiment_s4). Tiered after cleanup:
 * 3 of 240 un-promoted co-authors shared, 240 of 240 duplicated; promoted
 * 242 of 242 either way (results/experiment_t1).
 *
 * The storage chips swap each panel between the two layouts. Two
 * compositions: desktop, and a stacked one below 640px of figure width.
 */

const LABEL =
  "One co-authored article for tenants A and B. Stored once as [A, B]: in the payload field both queries find it, recall 1.00; with a shard per tenant B's query misses it, 245 of 482 memberships visible; tiered with A promoted, B's query misses it after cleanup, 3 of 240 for un-promoted co-authors. Stored once per tenant: every query finds its copy, 482 of 482 and 240 of 240, at the cost of 257,726 points instead of 161,413 in the payload model.";

const LAYOUTS = [
  { id: 'once', label: 'Once, as [A, B]' },
  { id: 'dup', label: 'Once per tenant' },
];
const STATUS = {
  once: 'Stored once with a list-valued tenant field, the article lives in one place. A co-author whose queries are routed elsewhere can no longer see it.',
  dup: "Stored once per tenant, each co-author's copy sits where their own queries go, so nothing is lost. The price: 60% more points in the payload model, and a site-wide search that returns the article once per co-author.",
};

const A_INK = 'var(--mts-blue-ink)';
const B_INK = 'var(--mts-purple-ink)';
const SPAN = {
  ab: `[<tspan style="fill:${A_INK}">A</tspan>, <tspan style="fill:${B_INK}">B</tspan>]`,
  a: `[<tspan style="fill:${A_INK}">A</tspan>]`,
  b: `[<tspan style="fill:${B_INK}">B</tspan>]`,
};

function chip(cx, y, content, w = 100) {
  if (content === 'ghost') {
    return (
      `<rect x="${cx - 50}" y="${y}" width="100" height="44" rx="22" stroke-width="2" stroke-dasharray="6 5" style="fill:none;stroke:var(--qi-line)"/>` +
      `<text class="mts-note" x="${cx}" y="${y + 29}" text-anchor="middle">deleted</text>`
    );
  }
  return (
    `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="44" rx="22" style="fill:var(--mts-inset);stroke:var(--qi-border)"/>` +
    `<text class="mts-small" x="${cx}" y="${y + 29}" text-anchor="middle">${SPAN[content]}</text>`
  );
}

function box(x, y, w, label, color, ink) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="120" rx="10" stroke-width="2" style="fill:var(--mts-card);stroke:${color}"/>` +
    `<text class="mts-note" x="${x + 12}" y="${y + 26}" style="fill:${ink}">${label}</text>`
  );
}

function query(x, y, who, ok) {
  const ink = who === 'A' ? A_INK : B_INK;
  const result = ok
    ? `<tspan style="fill:var(--qi-fg)">→ finds it</tspan>`
    : `<tspan style="fill:var(--mts-red-ink)">→ misses it</tspan>`;
  return `<text class="mts-note" x="${x}" y="${y}"><tspan style="fill:${ink}">${who}'s query</tspan> ${result}</text>`;
}

function result(x, y, big, notes, tone) {
  let out = `<text class="mts-title" x="${x}" y="${y}" style="fill:var(--mts-${tone}-ink)">${big}</text>`;
  notes.forEach((n, i) => {
    out += `<text class="mts-note" x="${x}" y="${y + 26 + i * 24}">${n}</text>`;
  });
  return out;
}

// Per model: the fixed boxes, then one group per storage layout.
const MODELS = {
  payload: {
    head: 'Payload field',
    boxes: (x, top, w) => box(x, top, w, 'collection', 'var(--qi-line)', 'var(--qi-muted)'),
    once: (x, top, w) => [chip(x + w / 2, top + 50, 'ab'), [true, true], 'both filters match', ['recall 1.00', ['two tenants, one point', '161,413 points stored'], 'cyan']],
    dup: (x, top, w) => [chip(x + w / 2 - 50, top + 50, 'a', 76) + chip(x + w / 2 + 50, top + 50, 'b', 76), [true, true], 'one copy per filter', ['recall 1.00', ['one point per tenant', '257,726 points stored'], 'cyan']],
  },
  shard: {
    head: 'Shard per tenant',
    boxes: (x, top, w, half) =>
      box(x, top, half, 'shard A', 'var(--mts-blue)', A_INK) + box(x + half + 12, top, half, 'shard B', 'var(--mts-purple)', B_INK),
    once: (x, top, w, half) => [chip(x + half / 2, top + 50, 'ab'), [true, false], 'B is routed to shard B', ['245 of 482', ['memberships visible'], 'red']],
    dup: (x, top, w, half) => [chip(x + half / 2, top + 50, 'a', 76) + chip(x + half + 12 + half / 2, top + 50, 'b', 76), [true, true], "B's copy is in shard B", ['482 of 482', ['memberships visible'], 'cyan']],
  },
  tiered: {
    head: 'Tiered: A promoted',
    boxes: (x, top, w, half) =>
      box(x, top, half, 'shard A', 'var(--mts-blue)', A_INK) + box(x + half + 12, top, half, 'fallback', 'var(--qi-line)', 'var(--qi-muted)'),
    once: (x, top, w, half) => [chip(x + half / 2, top + 50, 'ab') + chip(x + half + 12 + half / 2, top + 50, 'ghost'), [true, false], 'B goes to the fallback', ['3 of 240', ['un-promoted co-authors', 'promoted: 242 of 242'], 'red']],
    dup: (x, top, w, half) => [chip(x + half / 2, top + 50, 'a', 76) + chip(x + half + 12 + half / 2, top + 50, 'b', 76), [true, true], "B's copy stays put", ['240 of 240', ['un-promoted co-authors', 'promoted: 242 of 242'], 'cyan']],
  },
};

function panel(v, kind, x, y, w) {
  const m = MODELS[kind];
  const top = y + 24;
  const half = (w - 12) / 2;
  let out = `<text class="mts-head" x="${x}" y="${y}">${m.head}</text>` + m.boxes(x, top, w, half);
  ['once', 'dup'].forEach((layout) => {
    const [chips, [aOk, bOk], note, [big, notes, tone]] = m[layout](x, top, w, half);
    out += `<g data-k="${v}-${layout}-${kind}">`;
    out += chips + query(x, y + 176, 'A', aOk) + query(x, y + 208, 'B', bOk);
    out += `<text class="mts-note" x="${x}" y="${y + 240}">${note}</text>`;
    out += result(x, y + 292, big, notes, tone);
    out += '</g>';
  });
  return out;
}

function band(v, layout, x, y, w, icon, lines) {
  const color = icon === 'fix' ? 'var(--mts-blue)' : 'var(--mts-orange)';
  let out = `<g data-k="${v}-band-${layout}">`;
  out += `<rect x="${x}" y="${y}" width="${w}" height="${24 + lines.length * 26}" rx="12" style="fill:var(--mts-card);stroke:var(--qi-border)"/>`;
  out += `<circle cx="${x + 30}" cy="${y + 30}" r="12" style="fill:${color}"/>`;
  out += `<text class="mts-note" x="${x + 30}" y="${y + 37}" text-anchor="middle" style="fill:var(--mts-inset);font-weight:700">${icon === 'fix' ? '→' : '!'}</text>`;
  lines.forEach(([cls, text], i) => {
    out += `<text class="${cls}" x="${x + 56}" y="${y + 37 + i * 26}">${text}</text>`;
  });
  return out + '</g>';
}

function desktop() {
  let out = '';
  out += `<text class="mts-head" x="40" y="56" data-k="d-title"></text>`;
  out += `<text class="mts-note" x="40" y="84">which co-authors' queries can still reach a copy</text>`;
  out += `<line x1="330" x2="330" y1="118" y2="490" class="mts-rule"/>`;
  out += `<line x1="640" x2="640" y1="118" y2="490" class="mts-rule"/>`;
  out += panel('d', 'payload', 40, 140, 260);
  out += panel('d', 'shard', 350, 140, 260);
  out += panel('d', 'tiered', 660, 140, 260);
  out += band('d', 'once', 40, 516, 880, 'fix', [
    ['mts-small', 'The fix: one copy per tenant keeps every membership'],
    ['mts-note', 'measured: 482 of 482 sharded, 240 of 240 after promotion'],
  ]);
  out += band('d', 'dup', 40, 516, 880, 'cost', [
    ['mts-small', 'The price is storage: 257,726 points instead of 161,413'],
    ['mts-note', 'for the same articles in the payload model, about 60% more'],
  ]);
  return out;
}

function mobile() {
  let out = '';
  out += `<text class="mts-head" x="24" y="44">One co-authored article,</text>`;
  out += `<text class="mts-head" x="24" y="70" data-k="m-title"></text>`;
  out += `<text class="mts-note" x="24" y="98">which co-authors' queries can</text>`;
  out += `<text class="mts-note" x="24" y="122">still reach a copy</text>`;
  const tops = [170, 560, 950];
  ['payload', 'shard', 'tiered'].forEach((k, i) => {
    out += panel('m', k, 24, tops[i], 432);
    if (i < 2) out += `<line x1="24" x2="456" y1="${tops[i] + 356}" y2="${tops[i] + 356}" class="mts-rule"/>`;
  });
  out += band('m', 'once', 24, 1320, 432, 'fix', [
    ['mts-small', 'The fix: one copy per'],
    ['mts-small', 'tenant keeps them all'],
    ['mts-note', 'measured: 482 of 482'],
    ['mts-note', 'sharded, 240 of 240 tiered'],
  ]);
  out += band('m', 'dup', 24, 1320, 432, 'cost', [
    ['mts-small', 'The price is storage:'],
    ['mts-small', '257,726 points'],
    ['mts-note', 'instead of 161,413 in the'],
    ['mts-note', 'payload model, about 60% more'],
  ]);
  return out;
}

function update(node, layout) {
  const titles = {
    once: ['One co-authored article, stored once as [A, B]', 'stored once as [A, B]'],
    dup: ['One co-authored article, stored once per tenant', 'stored once per tenant'],
  };
  node.querySelector('[data-k="d-title"]').textContent = titles[layout][0];
  node.querySelector('[data-k="m-title"]').textContent = titles[layout][1];
  for (const v of ['d', 'm']) {
    ['payload', 'shard', 'tiered'].forEach((k) => {
      node.querySelector(`[data-k="${v}-once-${k}"]`).classList.toggle('is-off', layout !== 'once');
      node.querySelector(`[data-k="${v}-dup-${k}"]`).classList.toggle('is-off', layout !== 'dup');
    });
    node.querySelector(`[data-k="${v}-band-once"]`).classList.toggle('is-off', layout !== 'once');
    node.querySelector(`[data-k="${v}-band-dup"]`).classList.toggle('is-off', layout !== 'dup');
  }
  node.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === layout)));
  node.querySelector('.qi-status').textContent = STATUS[layout];
}

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mts__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="How the article is stored"><span class="qi-hint">Store the article:</span>' +
    LAYOUTS.map((l) => `<button type="button" class="qi-chip" data-layout="${l.id}" aria-pressed="false">${l.label}</button>`).join('') +
    '</div></div>' +
    svg('d', [960, 616], desktop()) +
    svg('m', [480, 1464], mobile()) +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.layout)));
  update(node, 'once');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
