/*
 * rerank-pipeline island.
 *
 * The two-stage pipeline every reranker in the guide runs in: a first stage
 * retrieves a pool of N candidates, a reranker reorders only that pool, and
 * the top 10 return. The method chips switch between late interaction
 * rescoring, MUVERA, and a cross-encoder. Each switch changes what the first
 * stage searches, where the reranker runs (inside Qdrant or in your
 * application), and the three facts below the drawing: what Qdrant stores,
 * what each query is encoded with, and what grows with depth.
 *
 * The drawing carries only short stage names and one detail line, so it stays
 * legible when scaled. The per-method facts are ordinary HTML below it, where
 * there is no viewBox to shrink them.
 */

const VB_W = 1200;
const VB_H = 215;

const METHODS = {
  'late-interaction': {
    chip: 'Late interaction',
    first: { name: 'Dense or BM25 prefetch', detail: 'HNSW or full-text index' },
    rerank: { name: 'MaxSim rescoring', detail: 'stored multivectors' },
    inApp: false,
    status: 'Late interaction: both stages run inside Qdrant, and the reranker reads the multivectors Qdrant already stores.',
    stored: 'Dense vectors, plus one multivector per document with one vector per token (m=0, no graph).',
    encoded: 'Two models: the dense model for the prefetch and the late interaction model for rescoring.',
    grows: 'MaxSim over N candidates, inside Qdrant.',
  },
  muvera: {
    chip: 'MUVERA',
    first: { name: 'FDE prefetch', detail: 'HNSW on 10,240 dims' },
    rerank: { name: 'MaxSim rescoring', detail: 'stored multivectors' },
    inApp: false,
    status: 'MUVERA: the first stage is built from the late interaction model itself, so no dense model is needed.',
    stored: 'One FDE per document (10,240 dimensions, indexed with HNSW), plus the multivectors for rescoring.',
    encoded: 'One model: the late interaction model. The query FDE is built from its token vectors.',
    grows: 'MaxSim over N candidates, and the search over large FDEs, both inside Qdrant.',
  },
  'cross-encoder': {
    chip: 'Cross-encoder',
    first: { name: 'Dense or BM25 prefetch', detail: 'HNSW or full-text index' },
    rerank: { name: 'Cross-encoder', detail: 'one pass per candidate' },
    inApp: true,
    status: 'Cross-encoder: Qdrant returns the candidates with their text, and your application scores and sorts them.',
    stored: 'Dense vectors and the document text in the payload. Nothing reranker-specific.',
    encoded: 'The dense model for the prefetch. The cross-encoder then reads each query and candidate text together.',
    grows: 'One full model pass per candidate, in your application.',
  },
};
const ORDER = ['late-interaction', 'muvera', 'cross-encoder'];

const BOX_Y = 40;
const BOX_H = 92;
const BOXES = {
  query: { x: 10, w: 120 },
  first: { x: 170, w: 290 },
  pool: { x: 500, w: 170 },
  rerank: { x: 710, w: 290 },
  top: { x: 1040, w: 150 },
};
const BRACKET_Y = 168;

function box(id, role, name, detail, short) {
  const b = BOXES[id];
  const cx = b.x + b.w / 2;
  return [
    `<g class="qi-rr__stage" data-box="${id}">`,
    `  <rect class="qi-rr__box qi-rr__box--${role}" x="${b.x}" y="${BOX_Y}" width="${b.w}" height="${BOX_H}" rx="10"/>`,
    detail
      ? `  <text class="qi-rr__name qi-rr__ink--${role}" x="${cx}" y="${BOX_Y + 38}" text-anchor="middle">${name}</text>`
      : `  <text class="qi-rr__name qi-rr__ink--${role}" x="${cx}" y="${BOX_Y + BOX_H / 2}" text-anchor="middle" dominant-baseline="middle">${name}</text>`,
    detail ? `  <text class="qi-rr__detail qi-rr__ink--${role}" x="${cx}" y="${BOX_Y + 70}" text-anchor="middle">${detail}</text>` : '',
    `  <text class="qi-rr__short qi-rr__ink--${role}" x="${cx}" y="${BOX_Y + BOX_H / 2}" text-anchor="middle" dominant-baseline="middle">${short}</text>`,
    `</g>`,
  ].join('');
}

function wire(from, to, id) {
  const x1 = BOXES[from].x + BOXES[from].w;
  const x2 = BOXES[to].x;
  const y = BOX_Y + BOX_H / 2;
  return `<path class="qi-rr__wire" d="M${x1} ${y} H${x2 - 2}" marker-end="url(#rr-arrow-${id})"/>`;
}

function bracket(cls, x1, x2, label) {
  const y = BRACKET_Y;
  return [
    `<g class="qi-rr__bracket qi-rr__bracket--${cls}">`,
    `  <path d="M${x1} ${y - 10} V${y} H${x2} V${y - 10}"/>`,
    `  <text x="${(x1 + x2) / 2}" y="${y + 34}" text-anchor="middle">${label}</text>`,
    `</g>`,
  ].join('');
}

let instances = 0;

function svgFor(m, id) {
  const rerankRole = m.inApp ? 'app' : 'qdrant';
  const qdrantEnd = m.inApp ? BOXES.pool.x + BOXES.pool.w : BOXES.rerank.x + BOXES.rerank.w;
  return [
    '<defs>',
    `  <marker id="rr-arrow-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`,
    '    <path d="M0 0 L10 5 L0 10 z" class="qi-rr__arrowhead"/>',
    '  </marker>',
    '</defs>',
    box('query', 'plain', 'Query', '', 'Query'),
    box('first', 'first', m.first.name, m.first.detail, 'First stage'),
    box('pool', 'pool', 'N candidates', 'depth', 'Pool'),
    box('rerank', rerankRole, m.rerank.name, m.rerank.detail, 'Rerank'),
    box('top', 'plain', 'Top 10', '', 'Top 10'),
    wire('query', 'first', id),
    wire('first', 'pool', id),
    wire('pool', 'rerank', id),
    wire('rerank', 'top', id),
    bracket('qdrant', BOXES.first.x, qdrantEnd, 'Inside Qdrant'),
    m.inApp ? bracket('app', BOXES.rerank.x, BOXES.rerank.x + BOXES.rerank.w, 'In your application') : '',
  ].join('');
}

export function mount(node) {
  instances += 1;
  const id = instances;
  node.classList.add('qi-rr');

  node.innerHTML = [
    '<div class="qi-fig qi-rr__fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Reranking method">',
    ORDER.map((k) => `<button type="button" class="qi-chip" data-method="${k}" aria-pressed="false">${METHODS[k].chip}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-rr__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qi-rr__status" role="status" aria-live="polite"></p>',
    '  <dl class="qi-rr__facts">',
    '    <div><dt>Stored in Qdrant</dt><dd data-fact="stored"></dd></div>',
    '    <div><dt>Encoded per query</dt><dd data-fact="encoded"></dd></div>',
    '    <div><dt>Grows with depth</dt><dd data-fact="grows"></dd></div>',
    '  </dl>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-rr__svg');
  const statusEl = node.querySelector('.qi-rr__status');
  const chips = [...node.querySelectorAll('.qi-chip')];
  const facts = Object.fromEntries([...node.querySelectorAll('[data-fact]')].map((el) => [el.dataset.fact, el]));

  function show(key) {
    const m = METHODS[key];
    svg.innerHTML = svgFor(m, id);
    svg.setAttribute(
      'aria-label',
      `Reranking pipeline with ${m.chip}: query, then ${m.first.name}, then a pool of N candidates, then ${m.rerank.name} ${m.inApp ? 'in your application' : 'inside Qdrant'}, then the top 10 results.`,
    );
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.method === key)));
    statusEl.textContent = m.status;
    facts.stored.textContent = m.stored;
    facts.encoded.textContent = m.encoded;
    facts.grows.textContent = m.grows;
  }

  chips.forEach((c) => c.addEventListener('click', () => show(c.dataset.method)));
  show(ORDER[0]);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
