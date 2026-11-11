/*
 * setup island: the experimental setup of the vector quantization guide.
 *
 * Shows the four BEIR corpora (size, text length, what a query and a relevant
 * document look like), how much space their float32 originals take with each
 * embedding model, and what the benchmark builds in Qdrant and records.
 *
 * Every number comes from the guide's own data:
 *   documents, test queries     BEIR paper, Table 1 (Thakur et al., 2021)
 *   words per document, per     BEIR paper, Table 1; SciFact and NFCorpus were
 *   query, relevant per query   recomputed from the staged corpora and match
 *   originals (MB)              arithmetic: documents x dimensions x 4 bytes
 *                               (Quora: 2,142 MB and 803 MB, as in memory.csv)
 *
 * render() is pure and exported so the static fallback image can be generated
 * from the same code. mount() only wires the controls.
 */

export const MODELS = [
  { id: 'cohere', label: 'Cohere 1,024-d', lines: ['Cohere', 'embed-english-v3.0', '1,024 dimensions', 'vectors supplied'], dims: 1024 },
  { id: 'bge', label: 'BGE-small 384-d', lines: ['BGE-small-en-v1.5', '384 dimensions', 'run locally'], dims: 384 },
];

export const CORPORA = [
  {
    id: 'scifact', name: 'SciFact', flow: 'claim → abstract', docs: 5183, words: 214,
    about: 'SciFact, claim verification. A query is a one-sentence claim; the relevant document is a research abstract that supports or refutes it. 1.1 relevant documents per query.',
  },
  {
    id: 'nfcorpus', name: 'NFCorpus', flow: 'topic → PubMed paper', docs: 3633, words: 232,
    about: 'NFCorpus, medical retrieval. A query is a short topic from NutritionFacts.org (3.3 words on average); the relevant documents are PubMed papers. 38.2 per query, the most of the four.',
  },
  {
    id: 'fiqa', name: 'FiQA', flow: 'question → forum post', docs: 57638, words: 132,
    about: 'FiQA, financial question answering. A query is a question; the relevant document is a StackExchange investment post that answers it. 2.6 relevant documents per query.',
  },
  {
    id: 'quora', name: 'Quora', flow: 'question → question', docs: 522931, words: 11,
    about: 'Quora, duplicate question retrieval. A query is a question; the relevant document is another question that asks the same thing. 1.6 per query, and the only symmetric task of the four.',
  },
];

const METHODS = ['float32 HNSW', 'scalar int8 · 4×', 'TurboQuant 4-bit · 8×', 'product x8 · 8×', 'binary 1-bit · 32×'];
const RECORDED = ['recall@10 vs exact float32', 'nDCG@10 vs BEIR judgments', 'server p95 and QPS', 'heap after indexing'];

const VB_W = 760;
const VB_H = 396;
const ROW_Y0 = 40;
const ROW_PITCH = 46;
const BAR_X = 372;
const BAR_MAX = 262; // width of the longest bar: Quora with Cohere, 2,142 MB
const MAX_MB = (522931 * 1024 * 4) / 1e6;
const BAND_Y = 248;
const BOX_H = 142;

const fmt = (n) => n.toLocaleString('en-US');
const mbOf = (docs, dims) => (docs * dims * 4) / 1e6;
const fmtMb = (mb) => `${fmt(Math.round(mb))} MB`;

export function statusText(modelId, corpusId) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const corpus = CORPORA.find((c) => c.id === corpusId);
  if (corpus) return `${corpus.about} Originals with ${model.label.split(' ')[0]} vectors: ${fmtMb(mbOf(corpus.docs, model.dims))}.`;
  return `A float32 vector takes ${fmt(model.dims * 4)} bytes at ${fmt(model.dims)} dimensions. Select a corpus to see what its queries and documents are.`;
}

// Returns the inner markup of the SVG (no <svg> wrapper).
export function render(modelId, corpusId) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const out = [];

  // Column headers
  out.push(
    '<text class="qset-h" x="0" y="20">Corpus</text>',
    '<text class="qset-h" x="246" y="20" text-anchor="end">documents</text>',
    '<text class="qset-h" x="330" y="20" text-anchor="end">words/doc</text>',
    `<text class="qset-h" x="${BAR_X}" y="20">float32 originals, ${fmt(model.dims)}-d</text>`,
    `<line class="qi-axis" x1="0" y1="28" x2="${VB_W}" y2="28"/>`,
  );

  CORPORA.forEach((c, i) => {
    const y = ROW_Y0 + i * ROW_PITCH;
    const mb = mbOf(c.docs, model.dims);
    const w = Math.max(2, (mb / MAX_MB) * BAR_MAX);
    const on = c.id === corpusId;
    out.push(
      `<g class="qset-row${on ? ' is-on' : ''}" data-corpus="${c.id}">`,
      `<rect class="qset-hit" x="-6" y="${y - 6}" width="${VB_W + 12}" height="${ROW_PITCH - 4}" rx="6"/>`,
      `<text class="qset-name" x="0" y="${y + 10}">${c.name}</text>`,
      `<text class="qset-sub" x="0" y="${y + 28}">${c.flow}</text>`,
      `<text class="qset-num" x="246" y="${y + 10}" text-anchor="end">${fmt(c.docs)}</text>`,
      `<text class="qset-num" x="330" y="${y + 10}" text-anchor="end">${c.words}</text>`,
      `<rect class="qset-bar" x="${BAR_X}" y="${y}" width="${w.toFixed(1)}" height="14" rx="2"/>`,
      `<text class="qset-num" x="${(BAR_X + w + 8).toFixed(1)}" y="${y + 12}">${fmtMb(mb)}</text>`,
      '</g>',
    );
  });

  // Pipeline band: embed -> Qdrant -> record
  const boxes = [
    { x: 0, w: 190, title: 'Embed', lines: model.lines },
    { x: 230, w: 206, title: 'Qdrant v1.19.2', lines: METHODS },
    { x: 476, w: 284, title: 'Record', lines: RECORDED },
  ];
  boxes.forEach((b) => {
    out.push(`<rect class="qi-frame" x="${b.x}" y="${BAND_Y}" width="${b.w}" height="${BOX_H}" rx="6"/>`);
    out.push(`<text class="qset-box-title" x="${b.x + 14}" y="${BAND_Y + 26}">${b.title}</text>`);
    b.lines.forEach((l, k) => {
      out.push(`<text class="qset-line${b.title === 'Embed' && k === 0 ? ' qset-line--strong' : ''}" x="${b.x + 14}" y="${BAND_Y + 50 + k * 19}">${l}</text>`);
    });
  });
  [[190, 230], [436, 476]].forEach(([x1, x2]) => {
    const cy = BAND_Y + BOX_H / 2;
    out.push(
      `<line class="qset-arrow" x1="${x1 + 6}" y1="${cy}" x2="${x2 - 10}" y2="${cy}"/>`,
      `<polygon class="qset-arrowhead" points="${x2 - 4},${cy} ${x2 - 12},${cy - 5} ${x2 - 12},${cy + 5}"/>`,
    );
  });
  return out.join('');
}

export function mount(node) {
  node.classList.add('qset');
  let model = 'cohere';
  let corpus = null;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Embedding model">',
    MODELS.map((m) => `<button type="button" class="qi-chip" data-model="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Corpus">',
    CORPORA.map((c) => `<button type="button" class="qi-chip" data-corpus="${c.id}" aria-pressed="false">${c.name}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qset__svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"`,
    '    aria-label="Experimental setup: four BEIR corpora with their size, text length and float32 storage, embedded with one of two models, indexed in Qdrant under five configurations, and scored on recall, nDCG, latency, throughput and memory."></svg>',
    '  <p class="qi-status qset__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qset__svg');
  const status = node.querySelector('.qset__status');
  const modelBtns = [...node.querySelectorAll('[data-model]')];
  const corpusBtns = [...node.querySelectorAll('.qi-chip[data-corpus]')];

  function draw() {
    svg.innerHTML = render(model, corpus);
    status.textContent = statusText(model, corpus);
    modelBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.model === model)));
    corpusBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.corpus === corpus)));
  }

  modelBtns.forEach((b) => b.addEventListener('click', () => { model = b.dataset.model; draw(); }));
  corpusBtns.forEach((b) => b.addEventListener('click', () => { corpus = corpus === b.dataset.corpus ? null : b.dataset.corpus; draw(); }));
  svg.addEventListener('click', (e) => {
    const row = e.target.closest ? e.target.closest('[data-corpus]') : null;
    if (!row) return;
    corpus = corpus === row.getAttribute('data-corpus') ? null : row.getAttribute('data-corpus');
    draw();
  });

  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
