/*
 * cross-encoder inference island for blog/oxidizing-cross-encoders.
 *
 * Follows one query-document pair through cross-encoder inference, split by who
 * does the work: cross-encode-rs tokenizes and batches, `ort` runs the model
 * graph (embedding, encoder, pooling, classifier), and cross-encode-rs turns
 * the logit into a score.
 *
 * Two controls:
 *   - Document picks which pair of a two-document batch to follow. Both pairs
 *     are padded to the longer one, so one of them carries [PAD] tokens.
 *   - Stage highlights one step and explains it in the status line. The encoder
 *     stage draws the cross-attention between query and document tokens.
 *
 * Every number is real: tokens and IDs come from the model's tokenizer.json,
 * logits from running Xenova/ms-marco-MiniLM-L-6-v2 (6 layers, hidden size 384)
 * on this exact batch with onnxruntime. Pure SVG + CSS on the shared island
 * design system (islands.scss).
 */

let instanceId = 0;
const NS = 'http://www.w3.org/2000/svg';

const QUERY = 'rust programming';
const HIDDEN = 384;
const LAYERS = 6;

// One batch, so both pairs share seq_len 11. Token kind: s = special, q = query,
// d = document, p = padding.
const PAIRS = [
  {
    id: 'cargo',
    doc: 'cargo builds rust code',
    tokens: [
      ['[CLS]', 101, 's'], ['rust', 18399, 'q'], ['programming', 4730, 'q'], ['[SEP]', 102, 's'],
      ['cargo', 6636, 'd'], ['builds', 16473, 'd'], ['rust', 18399, 'd'], ['code', 3642, 'd'],
      ['[SEP]', 102, 's'], ['[PAD]', 0, 'p'], ['[PAD]', 0, 'p'],
    ],
    types: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
    logit: 2.032,
  },
  {
    id: 'iron',
    doc: 'iron rusts in wet air',
    tokens: [
      ['[CLS]', 101, 's'], ['rust', 18399, 'q'], ['programming', 4730, 'q'], ['[SEP]', 102, 's'],
      ['iron', 3707, 'd'], ['rust', 18399, 'd'], ['##s', 2015, 'd'], ['in', 1999, 'd'],
      ['wet', 4954, 'd'], ['air', 2250, 'd'], ['[SEP]', 102, 's'],
    ],
    types: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    logit: -5.661,
  },
];
const SEQ = PAIRS[0].tokens.length;

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const fmt = (x, d) => x.toFixed(d);

// Geometry (viewBox 760 x 432). Three frames, top to bottom: tokenize (Rust),
// model graph (ort), post-process (Rust). The flow snakes: left to right
// through the model, then back to the score.
const W = 760;
const H = 432;
const GRID = { x0: 124, cw: 54, gap: 3, tokY: 70, tokH: 28, rowH: 22 };
const ROWS = [
  { key: 'ids', label: 'input_ids', y: 106 },
  { key: 'types', label: 'token_type_ids', y: 132 },
  { key: 'mask', label: 'attention_mask', y: 158 },
];
const FRAME_A = { x: 2, y: 2, w: 756, h: 190 };
const FRAME_B = { x: 2, y: 222, w: 756, h: 110 };
const FRAME_C = { x: 2, y: 362, w: 756, h: 66 };
const BOX = { w: 150, h: 58, y: 256 };
const BOX_X = [16, 208, 400, 592];
const SIG = { x: 592, y: 376, w: 150, h: 38 };

const cellX = (i) => GRID.x0 + i * (GRID.cw + GRID.gap);
const cellCx = (i) => cellX(i) + GRID.cw / 2;

const MODEL = [
  { stage: 'emb', title: 'Embedding', sub: `[${SEQ} × ${HIDDEN}]` },
  { stage: 'enc', title: `Encoder × ${LAYERS}`, sub: `[${SEQ} × ${HIDDEN}]` },
  { stage: 'pool', title: 'Pooling', sub: `[CLS] → [${HIDDEN}]` },
  { stage: 'cls', title: 'Classifier', sub: `${HIDDEN} → 1 logit` },
];

const STAGES = [
  { id: 'tok', label: 'Tokenize' },
  { id: 'emb', label: 'Embed' },
  { id: 'enc', label: 'Attend' },
  { id: 'pool', label: 'Pool' },
  { id: 'cls', label: 'Classify' },
  { id: 'score', label: 'Score' },
];

const STATUS = {
  none: () =>
    'cross-encode-rs prepares the inputs and reads the output; <code>ort</code> runs the model in between. Pick a stage to follow the pair, or switch documents to see the score change.',
  tok: (p) =>
    '<code>encode_batch</code> joins query and document into one sequence: <code>[CLS]</code> query <code>[SEP]</code> document <code>[SEP]</code>. ' +
    (p.id === 'cargo'
      ? 'The batch is padded to its longest pair, so this shorter one gets two <code>[PAD]</code> tokens with attention mask 0.'
      : 'This is the longest pair in the batch, so it needs no padding. <code>rusts</code> splits into the word pieces <code>rust</code> and <code>##s</code>.'),
  emb: () =>
    `Each position sums a token, a position, and a token type embedding (0 for the query side, 1 for the document), then LayerNorm. Both <code>rust</code> tokens start from the same vector, ID 18399. Out comes a <code>[${SEQ} × ${HIDDEN}]</code> matrix.`,
  enc: (p) =>
    `${LAYERS} self-attention layers let every token attend to every other one, so each query token is compared with each document token directly. ` +
    (p.id === 'cargo' ? 'The <code>[PAD]</code> positions are masked out.' : 'This is what tells the two meanings of <code>rust</code> apart.'),
  pool: () =>
    `Pooling keeps only the vector at the <code>[CLS]</code> position. Attention let it see the whole pair, so one <code>[${HIDDEN}]</code> vector stands for query and document together.`,
  cls: (p) =>
    `A linear layer maps ${HIDDEN} dimensions to <code>num_labels = 1</code>: one raw logit, <b>${fmt(p.logit, 3)}</b> for this pair. This is the last step inside <code>ort</code>.`,
  score: (p) =>
    `cross-encode-rs applies sigmoid: σ(${fmt(p.logit, 3)}) = <b>${fmt(sigmoid(p.logit), 4)}</b>. A model with <code>num_labels = 2</code> gets softmax instead, and the score is the probability of the relevant class.`,
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text !== undefined) node.textContent = text;
  return node;
}

// Arrow along a straight or elbowed path, drawn with the shared marker.
const wire = (d, stage) => el('path', { class: 'qi-ce__wire', d, 'marker-end': 'url(#qi-ce-arrow)', 'data-stage': stage });

// Cross-attention arc from one token's top edge to another's, higher for
// tokens that are further apart, capped under the frame label.
function arcPath(i, j) {
  const x1 = cellCx(i);
  const x2 = cellCx(j);
  const y = GRID.tokY - 2;
  const lift = Math.min(38, 10 + Math.abs(x2 - x1) * 0.075);
  return `M ${x1} ${y} C ${x1} ${y - lift} ${x2} ${y - lift} ${x2} ${y}`;
}

export function mount(node) {
  node.classList.add('qi-ce');
  const arrowId = `qi-ce-arrow-${++instanceId}`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    `      <span class="qi-hint">Query: <b class="qi-ce__query">${QUERY}</b></span>`,
    '    </div>',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Document:</span>',
    PAIRS.map((p) => `<button type="button" class="qi-chip" data-pair="${p.id}" aria-pressed="false">${p.doc}</button>`).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-ce__svg" viewBox="0 0 ${W} ${H}" role="img"`,
    '    aria-label="Cross-encoder inference in three steps. cross-encode-rs tokenizes a query and a document into one sequence with input IDs, token type IDs, and an attention mask. ort runs embedding, a six-layer encoder, pooling, and a classifier that returns one logit. cross-encode-rs applies sigmoid to turn the logit into a relevance score.">',
    '    <defs>',
    '      <marker id="qi-ce-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">',
    '        <path class="qi-ce__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    '    <g class="qi-ce__layer"></g>',
    '  </svg>',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Stage:</span>',
    STAGES.map(
      (s, i) => `<button type="button" class="qi-chip" data-stage-btn="${s.id}" aria-pressed="false"><span class="qi-ce__num">${i + 1}</span>${s.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    '  <p class="qi-status qi-status--2 qi-ce__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const layer = node.querySelector('.qi-ce__layer');
  const statusEl = node.querySelector('.qi-ce__status');
  const pairBtns = [...node.querySelectorAll('[data-pair]')];
  const stageBtns = [...node.querySelectorAll('[data-stage-btn]')];

  // ── Static structure: frames, row labels, model boxes, wires. ──
  const frame = (f, label, stage) => {
    const g = el('g', { 'data-stage': stage });
    g.appendChild(el('rect', { class: 'qi-frame', x: f.x, y: f.y, width: f.w, height: f.h, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-frame-label', x: f.x + 14, y: f.y + 22 }, label));
    return g;
  };
  layer.appendChild(frame(FRAME_A, 'cross-encode-rs: tokenize and batch', 'tok'));
  layer.appendChild(frame(FRAME_B, 'ort: the model graph', 'emb enc pool cls'));
  layer.appendChild(frame(FRAME_C, 'cross-encode-rs: post-process', 'score'));

  const labels = el('g', { 'data-stage': 'tok emb' });
  labels.appendChild(el('text', { class: 'qi-label', x: GRID.x0 - 10, y: GRID.tokY + 18, 'text-anchor': 'end' }, 'tokens'));
  ROWS.forEach((r) => labels.appendChild(el('text', { class: 'qi-label', x: GRID.x0 - 10, y: r.y + 15, 'text-anchor': 'end' }, r.label)));
  layer.appendChild(labels);

  // Tokens and the three input rows, rebuilt when the document changes.
  const arcsG = el('g', { class: 'qi-ce__arcs', 'data-stage': 'enc' });
  const gridG = el('g', { class: 'qi-ce__grid' });
  layer.appendChild(arcsG);
  layer.appendChild(gridG);

  // Tokenize → embedding: the three tensors leave the Rust side.
  const embCx = BOX_X[0] + BOX.w / 2;
  layer.appendChild(wire(`M ${embCx} ${FRAME_A.y + FRAME_A.h + 2} V ${FRAME_B.y - 4}`, 'tok emb'));
  layer.appendChild(
    el('text', { class: 'qi-label', x: embCx + 12, y: (FRAME_A.y + FRAME_A.h + FRAME_B.y) / 2 + 12, 'data-stage': 'tok emb' },
      `3 tensors, shape [2 × ${SEQ}]: batch × seq_len`),
  );

  MODEL.forEach((m, i) => {
    const g = el('g', { class: 'qi-ce__box', 'data-stage': m.stage });
    const x = BOX_X[i];
    g.appendChild(el('rect', { class: 'qi-ce__box-rect', x, y: BOX.y, width: BOX.w, height: BOX.h, rx: 6 }));
    g.appendChild(el('text', { class: 'qi-title', x: x + BOX.w / 2, y: BOX.y + 24, 'text-anchor': 'middle' }, m.title));
    g.appendChild(el('text', { class: 'qi-label', x: x + BOX.w / 2, y: BOX.y + 44, 'text-anchor': 'middle' }, m.sub));
    layer.appendChild(g);
    if (i > 0) {
      const y = BOX.y + BOX.h / 2;
      layer.appendChild(wire(`M ${BOX_X[i - 1] + BOX.w + 4} ${y} H ${x - 4}`, m.stage));
    }
  });

  // Classifier → sigmoid → score: the flow turns back toward the reader.
  const clsCx = BOX_X[3] + BOX.w / 2;
  layer.appendChild(wire(`M ${clsCx} ${BOX.y + BOX.h + 4} V ${SIG.y - 4}`, 'cls score'));
  const logitText = el('text', { class: 'qi-label qi-label--strong', x: clsCx - 14, y: 350, 'text-anchor': 'end', 'data-stage': 'cls score' });
  layer.appendChild(logitText);

  const sigG = el('g', { class: 'qi-ce__box', 'data-stage': 'score' });
  sigG.appendChild(el('rect', { class: 'qi-ce__box-rect', x: SIG.x, y: SIG.y, width: SIG.w, height: SIG.h, rx: 6 }));
  sigG.appendChild(el('text', { class: 'qi-title', x: SIG.x + SIG.w / 2, y: SIG.y + 24, 'text-anchor': 'middle' }, 'sigmoid'));
  layer.appendChild(sigG);
  layer.appendChild(wire(`M ${SIG.x - 4} ${SIG.y + SIG.h / 2} H ${SIG.x - 48}`, 'score'));
  const scoreG = el('g', { 'data-stage': 'score' });
  scoreG.appendChild(el('text', { class: 'qi-label', x: SIG.x - 150, y: SIG.y + 24, 'text-anchor': 'end' }, 'relevance score'));
  const scoreText = el('text', { class: 'qi-ce__score', x: SIG.x - 58, y: SIG.y + 26, 'text-anchor': 'end' });
  scoreG.appendChild(scoreText);
  layer.appendChild(scoreG);

  // ── State ──
  let pair = PAIRS[0];
  let stage = null;

  function renderGrid() {
    gridG.replaceChildren();
    arcsG.replaceChildren();
    pair.tokens.forEach(([text, id, kind], i) => {
      const x = cellX(i);
      const tok = el('g', { class: `qi-ce__tok qi-ce__tok--${kind}`, 'data-stage': i === 0 ? 'tok emb pool' : 'tok emb' });
      tok.appendChild(el('rect', { x, y: GRID.tokY, width: GRID.cw, height: GRID.tokH, rx: 4 }));
      // "programming" is the one token wider than its cell at 12px.
      const label = el('text', { x: x + GRID.cw / 2, y: GRID.tokY + 18, 'text-anchor': 'middle' });
      if (text.length > 8) {
        label.appendChild(el('tspan', {x: x + GRID.cw / 2, y: GRID.tokY + 12}, text.slice(0, 6)));
        label.appendChild(el('tspan', {x: x + GRID.cw / 2, y: GRID.tokY + 25}, text.slice(6)));
      } else label.textContent = text;
      tok.appendChild(label);
      gridG.appendChild(tok);

      const vals = { ids: id, types: pair.types[i], mask: kind === 'p' ? 0 : 1 };
      ROWS.forEach((r) => {
        const v = vals[r.key];
        const cls = r.key === 'types' ? `qi-ce__num-cell qi-ce__type--${v}` : `qi-ce__num-cell${v === 0 && r.key === 'mask' ? ' is-off' : ''}`;
        const g = el('g', { class: cls, 'data-stage': 'tok' });
        g.appendChild(el('rect', { x, y: r.y, width: GRID.cw, height: GRID.rowH, rx: 3 }));
        g.appendChild(el('text', { x: x + GRID.cw / 2, y: r.y + 15, 'text-anchor': 'middle' }, String(v)));
        gridG.appendChild(g);
      });
    });

    // Every query token against every real document token.
    pair.tokens.forEach(([, , ki], i) => {
      if (ki !== 'q') return;
      pair.tokens.forEach(([, , kj], j) => {
        if (kj === 'd') arcsG.appendChild(el('path', { class: 'qi-ce__arc', d: arcPath(i, j) }));
      });
    });

    logitText.textContent = `logit ${fmt(pair.logit, 3)}`;
    scoreText.textContent = fmt(sigmoid(pair.logit), 4);
  }

  function render() {
    pairBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pair === pair.id)));
    stageBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stageBtn === stage)));
    node.classList.toggle('has-stage', stage !== null);
    node.classList.toggle('show-arcs', stage === 'enc');
    layer.querySelectorAll('[data-stage]').forEach((n) => {
      const on = stage !== null && n.getAttribute('data-stage').split(' ').includes(stage);
      n.classList.toggle('is-on', on);
    });
    const result = `Document ${pair.doc}; relevance score ${fmt(sigmoid(pair.logit), 4)}.`;
    statusEl.innerHTML = `${result} ${STATUS[stage || 'none'](pair)}`;
    node.querySelector('svg').setAttribute('aria-label', `${result} Cross-encoder inference: tokenize and batch, embedding, six encoder layers, CLS pooling, classification, then sigmoid.`);
  }

  pairBtns.forEach((b) =>
    b.addEventListener('click', () => {
      pair = PAIRS.find((p) => p.id === b.dataset.pair);
      renderGrid();
      render();
    }),
  );
  stageBtns.forEach((b) =>
    b.addEventListener('click', () => {
      // Pressing the active stage again returns to the overview.
      stage = stage === b.dataset.stageBtn ? null : b.dataset.stageBtn;
      render();
    }),
  );

  node.querySelector('marker').id = arrowId;
  node.querySelectorAll('[marker-end]').forEach(w=>w.setAttribute('marker-end', `url(#${arrowId})`));
  renderGrid();
  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
