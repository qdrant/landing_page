/*
 * setup island: the four BEIR datasets used in the guide's experiment.
 *
 * One table: what each dataset is for, how many documents and words it has, how many documents count as relevant per query, and how much
 * space its float32 originals take. The embedding model toggle changes the
 * dimensions, so the originals shrink from 4,096 to 1,536 bytes per vector.
 *
 * Every number comes from the guide's own data:
 *   documents, words per document,    BEIR paper, Table 1 (Thakur et al., 2021);
 *   relevant documents per query      SciFact and NFCorpus were recomputed from
 *                                     the staged corpora and match
 *   originals (MB)                    arithmetic: documents x dimensions x 4 bytes
 *                                     (Quora: 2,142 MB and 803 MB, as in memory.csv)
 *
 * render() and statusText() are pure and exported so the static fallback image
 * can be generated from the same code. mount() only wires the controls.
 */

export const MODELS = [
  { id: 'cohere', label: 'Cohere 1,024-d', dims: 1024 },
  { id: 'bge', label: 'BGE-small 384-d', dims: 384 },
];

export const CORPORA = [
  { id: 'scifact', name: 'SciFact', task: 'Scientific claim verification', docs: 5183, words: 214, rel: '1.1' },
  { id: 'nfcorpus', name: 'NFCorpus', task: 'Medical information retrieval', docs: 3633, words: 232, rel: '38.2' },
  { id: 'fiqa', name: 'FiQA', task: 'Financial question answering', docs: 57638, words: 132, rel: '2.6' },
  { id: 'quora', name: 'Quora', task: 'Duplicate question retrieval', docs: 522931, words: 11, rel: '1.6' },
];

const VB_W = 760;
const VB_H = 212;
const ROW_Y0 = 46;
const ROW_PITCH = 40;
const TASK_X = 96;
const DOCS_X = 426;
const WORDS_X = 516;
const REL_X = 600;
const BAR_X = 618;
const BAR_MAX = 66; // the longest bar: Quora with Cohere, 2,142 MB
const MAX_MB = (522931 * 1024 * 4) / 1e6;

const fmt = (n) => n.toLocaleString('en-US');
const mbOf = (docs, dims) => (docs * dims * 4) / 1e6;
const fmtMb = (mb) => `${fmt(Math.round(mb))} MB`;
const modelOf = (id) => MODELS.find((m) => m.id === id) || MODELS[0];

export function statusText(modelId) {
  const m = modelOf(modelId);
  const quora = CORPORA[CORPORA.length - 1];
  return `At ${fmt(m.dims)} dimensions a float32 vector takes ${fmt(m.dims * 4)} bytes, so the Quora originals take ${fmtMb(mbOf(quora.docs, m.dims))}.`;
}

// Returns the inner markup of the SVG (no <svg> wrapper).
export function render(modelId) {
  const m = modelOf(modelId);
  const out = [
    '<text class="qset-h" x="0" y="18">Dataset</text>',
    `<text class="qset-h" x="${TASK_X}" y="18">Task</text>`,
    `<text class="qset-h" x="${DOCS_X}" y="18" text-anchor="end">documents</text>`,
    `<text class="qset-h" x="${WORDS_X}" y="18" text-anchor="end">words/doc</text>`,
    `<text class="qset-h" x="${REL_X}" y="18" text-anchor="end">rel/query</text>`,
    `<text class="qset-h" x="${BAR_X}" y="18">float32, ${fmt(m.dims)}-d</text>`,
    `<line class="qi-axis" x1="0" y1="28" x2="${VB_W}" y2="28"/>`,
  ];
  CORPORA.forEach((c, i) => {
    const y = ROW_Y0 + i * ROW_PITCH;
    const mb = mbOf(c.docs, m.dims);
    const w = Math.max(2, (mb / MAX_MB) * BAR_MAX);
    out.push(
      `<text class="qset-name" x="0" y="${y + 12}">${c.name}</text>`,
      `<text class="qset-task" x="${TASK_X}" y="${y + 12}">${c.task}</text>`,
      `<text class="qset-num" x="${DOCS_X}" y="${y + 12}" text-anchor="end">${fmt(c.docs)}</text>`,
      `<text class="qset-num" x="${WORDS_X}" y="${y + 12}" text-anchor="end">${c.words}</text>`,
      `<text class="qset-num" x="${REL_X}" y="${y + 12}" text-anchor="end">${c.rel}</text>`,
      `<rect class="qset-bar" x="${BAR_X}" y="${y}" width="${w.toFixed(1)}" height="14" rx="2"/>`,
      `<text class="qset-num" x="${(BAR_X + w + 8).toFixed(1)}" y="${y + 12}">${fmtMb(mb)}</text>`,
    );
    if (i < CORPORA.length - 1) out.push(`<line class="qset-sep" x1="0" y1="${y + 28}" x2="${VB_W}" y2="${y + 28}"/>`);
  });
  return out.join('');
}

export function mount(node) {
  node.classList.add('qset');
  let model = 'cohere';
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls"><div class="qi-group" role="group" aria-label="Embedding model">',
    MODELS.map((m) => `<button type="button" class="qi-chip" data-model="${m.id}" aria-pressed="false">${m.label}</button>`).join(''),
    '  </div></div>',
    `  <svg class="qi-svg" viewBox="-6 0 ${VB_W + 12} ${VB_H}" role="img"></svg>`,
    '  <p class="qi-status qset__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');
  const svg = node.querySelector('svg');
  const status = node.querySelector('.qset__status');
  function draw() {
    svg.innerHTML = render(model);
    const text = statusText(model);
    status.textContent = text;
    svg.setAttribute('aria-label', `The four BEIR datasets with their task, document counts, words per document, relevant documents per query, and float32 storage. ${text}`);
    node.querySelectorAll('[data-model]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.model === model)));
  }
  node.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-model]') : null;
    if (b) { model = b.dataset.model; draw(); }
  });
  draw();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
