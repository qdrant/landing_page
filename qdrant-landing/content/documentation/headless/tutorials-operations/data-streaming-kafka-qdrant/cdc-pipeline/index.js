/*
 * cdc-pipeline island — interactive replacement for the Figure 1 image of the
 * Kafka streaming tutorial.
 *
 * Shows the change-data-capture path: source systems -> source connectors ->
 * Kafka on the Confluent Platform -> Qdrant sink connector -> Qdrant. The
 * chips choose which source system feeds the pipeline; everything from Kafka
 * onward is identical. The tutorial itself only configures MongoDB.
 */

const NS = 'http://www.w3.org/2000/svg';

const SOURCES = {
  mongo: {
    label: 'MongoDB',
    lines: ['MongoDB'],
    y: 48,
    status:
      'The MongoDB source connector publishes every change to the <code>docs</code> collection to a Kafka topic. This tutorial uses this path.',
  },
  blob: {
    label: 'Azure Blob Storage',
    lines: ['Azure Blob', 'Storage'],
    y: 164,
    status:
      'An Azure Blob Storage source connector feeds the same Kafka topics, so the rest of the path is identical. This tutorial configures only MongoDB.',
  },
};

// Geometry (viewBox 680 x 300).
const SRC = { x: 2, y: 8, w: 148, h: 284 };
const HUB = { x: 260, y: 8, w: 190, h: 284 };
const QDR = { x: 560, y: 8, w: 118, h: 284 };
const MID_Y = 156;

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

function box(x, y, w, h, cls) {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
}

function lines(cls, cx, y, strs) {
  return strs
    .map((s, i) => `<text class="${cls}" x="${cx}" y="${y + i * 18}" text-anchor="middle">${s}</text>`)
    .join('');
}

export function mount(node) {
  node.classList.add('qi-kc');
  const arrow = (id, d) => `<path class="kc-arrow" id="${id}" d="${d}" marker-end="url(#qi-kc-arrow)"/>`;

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group">',
    '      <span class="qi-hint">Source system:</span>',
    Object.entries(SOURCES)
      .map(
        ([id, s]) =>
          `<button type="button" class="qi-chip" data-source="${id}" aria-pressed="false">${s.label}</button>`,
      )
      .join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 680 300" role="img"',
    '    aria-label="Change data capture pipeline: source connectors move data from MongoDB or Azure Blob Storage into Kafka on the Confluent Platform, and the Qdrant sink connector writes it into Qdrant.">',
    '    <defs>',
    '      <marker id="qi-kc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '        <path class="kc-arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    // Frames
    box(SRC.x, SRC.y, SRC.w, SRC.h, 'qi-frame'),
    `<text class="kc-frame-label" x="${SRC.x + 14}" y="${SRC.y + 28}">Source systems</text>`,
    box(HUB.x, HUB.y, HUB.w, HUB.h, 'qi-frame'),
    `<text class="kc-frame-label" x="${HUB.x + 14}" y="${HUB.y + 28}">Confluent Platform</text>`,
    box(QDR.x, QDR.y, QDR.w, QDR.h, 'qi-frame'),
    `<text class="kc-frame-label" x="${QDR.x + 14}" y="${QDR.y + 28}">Vector search</text>`,
    // Source nodes
    Object.entries(SOURCES)
      .map(
        ([id, s]) =>
          `<g class="kc-source" data-node="${id}">${box(SRC.x + 14, s.y + 8, SRC.w - 28, 84, 'kc-node kc-node--src')}` +
          lines('kc-node-text', SRC.x + SRC.w / 2, s.y + 54 - (s.lines.length - 1) * 9, s.lines) +
          '</g>',
      )
      .join(''),
    // Kafka node
    box(HUB.x + 16, 104, HUB.w - 32, 104, 'kc-node kc-node--hub'),
    lines('kc-node-text', HUB.x + HUB.w / 2, 152, ['Kafka topics']),
    // Qdrant node
    box(QDR.x + 14, 104, QDR.w - 28, 104, 'kc-node kc-node--qdrant'),
    lines('kc-node-text', QDR.x + QDR.w / 2, 152, ['Qdrant']),
    // Connectors
    `<g class="kc-edge" data-edge="mongo">${arrow('kc-a-mongo', `M ${SRC.x + SRC.w} ${SOURCES.mongo.y + 50} L ${HUB.x - 2} ${SOURCES.mongo.y + 50}`)}</g>`,
    `<g class="kc-edge" data-edge="blob">${arrow('kc-a-blob', `M ${SRC.x + SRC.w} ${SOURCES.blob.y + 50} L ${HUB.x - 2} ${SOURCES.blob.y + 50}`)}</g>`,
    lines('kc-conn-text', (SRC.x + SRC.w + HUB.x) / 2, MID_Y - 4, ['source', 'connectors']),
    arrow('kc-a-sink', `M ${HUB.x + HUB.w} ${MID_Y} L ${QDR.x - 2} ${MID_Y}`),
    lines('kc-conn-text', (HUB.x + HUB.w + QDR.x) / 2, MID_Y - 40, ['Qdrant sink', 'connector']),
    '  </svg>',
    '  <p class="qi-status qi-status--2 kc-status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const statusEl = node.querySelector('.kc-status');
  const btns = [...node.querySelectorAll('[data-source]')];

  function select(id) {
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.source === id)));
    node.querySelectorAll('[data-node]').forEach((g) => g.classList.toggle('is-dim', g.dataset.node !== id));
    node.querySelectorAll('[data-edge]').forEach((g) => g.classList.toggle('is-dim', g.dataset.edge !== id));
    statusEl.innerHTML = SOURCES[id].status;
  }

  btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.source)));
  select('mongo');

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
