/*
 * per-tenant-graphs island: a theme-aware figure for the multitenant search
 * guide (content/documentation/production-operations/multitenant-search.md).
 *
 * Illustrative, not measured: node positions, edges, and highlighted paths are
 * hand-placed to show the structure, not captured from a real index. Left,
 * one global HNSW graph whose edges cross tenants. Right, `m=0` with
 * `payload_m=16`: a separate graph per tenant and no edges between them. The
 * recall lines under the panels are measured (the guide's per-setup table,
 * 10,000-point tenant run): unfiltered 0.996 against 0.24, tenant-filtered
 * 1.00 against 0.998. The figure does not claim how Qdrant runs an unfiltered
 * query without a global graph, only that no edges link the tenants.
 *
 * The query chips pick an unfiltered query or one tenant's filtered query and
 * highlight what each structure has to traverse. Two compositions: desktop,
 * and a stacked one below 640px of figure width.
 */

const LABEL =
  "Illustrative. Left: one global HNSW graph with edges between tenants. Right: m=0 with payload_m=16, a separate graph per tenant and no edges between them. Measured unfiltered recall 0.996 against 0.24. A tenant-filtered query passes through other tenants' points in the global graph but searches only its own per-tenant graph; measured recall for a 10,000-point tenant 1.00 against 0.998, and at 40,000 points 0.84 against 0.996.";

const COLOR = { a: 'var(--mts-blue)', b: 'var(--mts-purple)', c: 'var(--mts-cyan)' };
const NAME = { a: 'A', b: 'B', c: 'C' };

// Local coordinates inside a 400 x 220 box.
const GLOBAL_NODES = [
  ['a', 30, 35], ['b', 140, 20], ['c', 250, 40], ['a', 360, 25],
  ['c', 60, 115], ['a', 170, 110], ['b', 275, 125], ['c', 370, 110],
  ['b', 25, 195], ['c', 130, 205], ['a', 240, 190], ['b', 355, 205],
];
const GLOBAL_EDGES = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7],
  [4, 8], [5, 9], [6, 10], [7, 11], [8, 9], [9, 10], [10, 11], [2, 5], [6, 11],
];
// Hand-picked traversals: an unfiltered walk, and per tenant the edges a
// filtered walk needs to reach that tenant's points through everyone else's.
const PATHS = {
  all: [[0, 1], [1, 5], [5, 6], [6, 7], [7, 11]],
  a: [[0, 1], [1, 5], [5, 6], [6, 10], [2, 5], [2, 3]],
  b: [[1, 5], [5, 6], [6, 11], [5, 9], [8, 9]],
  c: [[2, 6], [6, 7], [2, 5], [4, 5], [5, 9]],
};
const CLUSTERS = {
  a: [[35, 40], [110, 30], [120, 100], [45, 110]],
  b: [[285, 35], [360, 45], [355, 110], [290, 105]],
  c: [[160, 140], [235, 135], [245, 205], [165, 210]],
};
const CLUSTER_EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];

const QUERIES = [
  { id: 'all', label: 'Unfiltered' },
  { id: 'a', label: 'Tenant A', swatch: COLOR.a },
  { id: 'b', label: 'Tenant B', swatch: COLOR.b },
  { id: 'c', label: 'Tenant C', swatch: COLOR.c },
];

const TEXT = {
  all: {
    left: ['An unfiltered query walks', 'one connected graph.'],
    right: ['No edges link the tenant', 'graphs, so an unfiltered query', 'misses most true neighbors.'],
    leftRecall: ['measured unfiltered recall: 0.996', 'cyan'],
    rightRecall: ['measured unfiltered recall: 0.24', 'red'],
    status: 'Unfiltered: the global graph links every tenant, while the per-tenant graphs have no edges between them. Measured unfiltered recall: 0.996 against 0.24.',
  },
  tenant: (t) => ({
    left: ['A filtered query passes', "through other tenants' points", `to reach tenant ${NAME[t]}'s.`],
    right: ['A filtered query searches', `only tenant ${NAME[t]}'s graph.`, ''],
    leftRecall: ['measured filtered recall: 1.00', 'cyan'],
    rightRecall: ['measured filtered recall: 0.998', 'cyan'],
    status: `Tenant ${NAME[t]}'s filtered query: the global graph steps through other tenants' points, while the per-tenant graph searches only ${NAME[t]}'s. Recall for a 10,000-point tenant: 1.00 against 0.998; at 40,000 points, 0.84 against 0.996.`,
  }),
};

const key = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);

function globalGraph(v, ox, oy) {
  let out = '';
  GLOBAL_EDGES.forEach(([i, j]) => {
    const [, x1, y1] = GLOBAL_NODES[i];
    const [, x2, y2] = GLOBAL_NODES[j];
    out += `<line data-k="${v}-ge-${key(i, j)}" x1="${ox + x1}" y1="${oy + y1}" x2="${ox + x2}" y2="${oy + y2}" stroke-width="2" style="stroke:var(--qi-line)"/>`;
  });
  GLOBAL_NODES.forEach(([t, x, y], i) => {
    out += `<circle data-k="${v}-gn-${i}" cx="${ox + x}" cy="${oy + y}" r="10" stroke-width="3" style="fill:${COLOR[t]};stroke:var(--mts-inset)"/>`;
  });
  return out;
}

function tenantGraphs(v, ox, oy) {
  let out = '';
  Object.entries(CLUSTERS).forEach(([t, nodes]) => {
    out += `<g data-k="${v}-tc-${t}">`;
    CLUSTER_EDGES.forEach(([i, j]) => {
      const [x1, y1] = nodes[i];
      const [x2, y2] = nodes[j];
      out += `<line x1="${ox + x1}" y1="${oy + y1}" x2="${ox + x2}" y2="${oy + y2}" stroke-width="2" style="stroke:${COLOR[t]};opacity:0.7"/>`;
    });
    nodes.forEach(([x, y]) => {
      out += `<circle cx="${ox + x}" cy="${oy + y}" r="10" stroke-width="3" style="fill:${COLOR[t]};stroke:var(--mts-inset)"/>`;
    });
    out += '</g>';
  });
  return out;
}

function textLines(v, side, x, y, cls) {
  return [0, 1, 2]
    .map((i) => `<text class="${cls}" data-k="${v}-${side}-${i}" x="${x}" y="${y + i * 26}"></text>`)
    .join('');
}

function legend(x, y) {
  let out = '';
  ['a', 'b', 'c'].forEach((t, i) => {
    const lx = x + i * 136;
    out += `<rect x="${lx}" y="${y - 15}" width="16" height="16" rx="8" style="fill:${COLOR[t]}"/>`;
    out += `<text class="mts-note" x="${lx + 26}" y="${y}" style="fill:var(--qi-fg)">tenant ${NAME[t]}</text>`;
  });
  return out;
}

function desktop() {
  let out = `<line x1="480" x2="480" y1="32" y2="490" class="mts-rule"/>`;
  out += `<text class="mts-head" x="40" y="56">One global graph</text>`;
  out += `<text class="mts-note" x="40" y="84">default HNSW, m=16</text>`;
  out += globalGraph('d', 40, 120);
  out += textLines('d', 'left', 40, 392, 'mts-small mts-muted');
  out += `<text class="mts-note" data-k="d-lrec" x="40" y="476"></text>`;
  out += `<text class="mts-head" x="520" y="56">A graph per tenant</text>`;
  out += `<text class="mts-note" x="520" y="84">m=0, payload_m=16</text>`;
  out += tenantGraphs('d', 520, 120);
  out += textLines('d', 'right', 520, 392, 'mts-small mts-muted');
  out += `<text class="mts-note" data-k="d-rrec" x="520" y="476"></text>`;
  out += legend(40, 540);
  out += `<text class="mts-note" x="920" y="540" text-anchor="end">graphs illustrative, not to scale</text>`;
  return out;
}

function mobile() {
  let out = '';
  out += `<text class="mts-head" x="40" y="44">One global graph</text>`;
  out += `<text class="mts-note" x="40" y="70">default HNSW, m=16</text>`;
  out += globalGraph('m', 40, 100);
  out += textLines('m', 'left', 40, 364, 'mts-small mts-muted');
  out += `<text class="mts-note" data-k="m-lrec" x="40" y="450"></text>`;
  out += `<line x1="24" x2="456" y1="478" y2="478" class="mts-rule"/>`;
  out += `<text class="mts-head" x="40" y="522">A graph per tenant</text>`;
  out += `<text class="mts-note" x="40" y="548">m=0, payload_m=16</text>`;
  out += tenantGraphs('m', 40, 578);
  out += textLines('m', 'right', 40, 868, 'mts-small mts-muted');
  out += `<text class="mts-note" data-k="m-rrec" x="40" y="954"></text>`;
  out += legend(40, 1004);
  out += `<text class="mts-note" x="40" y="1034">graphs illustrative, not to scale</text>`;
  return out;
}

function update(node, query) {
  const text = query === 'all' ? TEXT.all : TEXT.tenant(query);
  const pathEdges = new Set(PATHS[query].map(([i, j]) => key(i, j)));
  const pathNodes = new Set(PATHS[query].flat());
  for (const v of ['d', 'm']) {
    const q = (k) => node.querySelector(`[data-k="${v}-${k}"]`);
    GLOBAL_EDGES.forEach(([i, j]) => {
      const e = q(`ge-${key(i, j)}`);
      const on = pathEdges.has(key(i, j));
      e.style.stroke = on ? 'var(--qi-fg)' : 'var(--qi-line)';
      e.setAttribute('stroke-width', on ? 3.5 : 2);
      e.classList.toggle('is-faint', !on);
    });
    GLOBAL_NODES.forEach(([t], i) => {
      const n = q(`gn-${i}`);
      const target = query === 'all' ? pathNodes.has(i) : t === query;
      const passing = query !== 'all' && pathNodes.has(i) && t !== query;
      n.classList.toggle('is-faint', passing);
      n.classList.toggle('is-dim', !target && !passing);
    });
    ['a', 'b', 'c'].forEach((t) => {
      q(`tc-${t}`).classList.toggle('is-dim', query !== 'all' && query !== t);
    });
    ['left', 'right'].forEach((side) => {
      text[side].forEach((line, i) => {
        q(`${side}-${i}`).textContent = line;
      });
      [0, 1, 2].slice(text[side].length).forEach((i) => {
        q(`${side}-${i}`).textContent = '';
      });
    });
    [['lrec', text.leftRecall], ['rrec', text.rightRecall]].forEach(([k, [line, tone]]) => {
      const el = q(k);
      el.textContent = line;
      el.style.fill = `var(--mts-${tone}-ink)`;
    });
  }
  node.querySelectorAll('[data-query]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.query === query)));
  node.querySelector('.qi-status').textContent = text.status;
}

function svg(variant, [w, h], body) {
  return `<svg class="qi-svg qi-mts__${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${LABEL}">${body}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-mts', 'is-init');
  node.innerHTML =
    '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="Query"><span class="qi-hint">Query:</span>' +
    QUERIES.map(
      (qy) =>
        `<button type="button" class="qi-chip" data-query="${qy.id}" aria-pressed="false">` +
        (qy.swatch ? `<span class="qi-chip__swatch" style="--swatch:${qy.swatch}"></span>` : '') +
        `${qy.label}</button>`,
    ).join('') +
    '</div></div>' +
    svg('d', [960, 564], desktop()) +
    svg('m', [480, 1058], mobile()) +
    '<p class="qi-status qi-status--2" role="status" aria-live="polite"></p>' +
    '</div>';
  node.querySelectorAll('[data-query]').forEach((b) => b.addEventListener('click', () => update(node, b.dataset.query)));
  update(node, 'all');
  node.getBoundingClientRect();
  node.classList.remove('is-init');
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
