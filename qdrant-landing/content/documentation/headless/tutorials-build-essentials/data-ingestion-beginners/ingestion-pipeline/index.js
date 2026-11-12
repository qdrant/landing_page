/*
 * ingestion-pipeline island: S3 -> Python -> FastEmbed -> Qdrant.
 *
 * A static flow of four stages. Each stage is drawn twice, as a tall card
 * (used when the four stages sit in a row) and as a wide strip (used when the
 * stages stack vertically on a narrow column). CSS shows one set or the other
 * from the island's own width (index.css), so the text never shrinks below the
 * readable floor. Entity colors are constant: review text is one hue, product
 * image another, in every stage and in the legend.
 */

const doc = (x, y) =>
  `<rect class="di-shape di-shape--text" x="${x}" y="${y}" width="18" height="24" rx="2"/>` +
  `<path class="di-stroke di-stroke--text" d="M${x + 4} ${y + 8}h10M${x + 4} ${y + 13}h10M${x + 4} ${y + 18}h6"/>`;

const img = (x, y) =>
  `<rect class="di-shape di-shape--image" x="${x}" y="${y}" width="24" height="24" rx="2"/>` +
  `<path class="di-fill--image" d="M${x + 2} ${y + 21}l6-9 5 6 3-4 6 7z"/>`;

const chip = (x, y, w, h, kind, lines) =>
  `<rect class="di-shape di-shape--${kind}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` +
  (lines.length === 1
    ? `<text class="di-txt" x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${lines[0]}</text>`
    : `<text class="di-txt di-txt--strong" x="${x + w / 2}" y="${y + 24}" text-anchor="middle">${lines[0]}</text>` +
      `<text class="di-txt di-txt--muted" x="${x + w / 2}" y="${y + 44}" text-anchor="middle">${lines[1]}</text>`);

const bars = (x, y, n, kind) =>
  Array.from({ length: n }, (_, i) => `<rect class="di-fill--${kind}" x="${x + 7 * i}" y="${y}" width="4" height="24"/>`).join('');

const label = (str) => `<text class="di-label" x="14" y="28">${str}</text>`;
const caption = (x, str, anchor) =>
  `<text class="di-txt di-txt--muted" x="${x}" y="${anchor ? 28 : 58}"${anchor ? ' text-anchor="end"' : ''}>${str}</text>`;
const frame = (w, h) => `<rect class="qi-frame di-frame" x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10"/>`;

const STAGES = [
  {
    name: 'Step 1, S3 bucket: folders p_1, p_2, and more, each holding a review text and a product image.',
    tall: () =>
      label('1. S3 bucket') +
      [84, 132].map((y, i) => `<text class="di-txt" x="14" y="${y}">p_${i + 1}/</text>${doc(78, y - 18)}${img(108, y - 18)}`).join('') +
      `<text class="di-txt di-txt--muted" x="14" y="180">...</text>`,
    wide: () =>
      label('1. S3 bucket') +
      [14, 122].map((x, i) => `<text class="di-txt" x="${x}" y="70">p_${i + 1}/</text>${doc(x + 44, 52)}${img(x + 70, 52)}`).join('') +
      `<text class="di-txt di-txt--muted" x="230" y="70">...</text>`,
    wideH: 92,
  },
  {
    name: 'Step 2, Python script: boto3 and Pillow read each review as a string and each image as a PIL image.',
    tall: () => label('2. Python') + caption(14, 'boto3 + Pillow') + chip(12, 76, 136, 56, 'text', ['review: str']) + chip(12, 148, 136, 56, 'image', ['image: PIL']),
    wide: () => label('2. Python') + caption(326, 'boto3 + Pillow', true) + chip(14, 44, 150, 40, 'text', ['review: str']) + chip(176, 44, 150, 40, 'image', ['image: PIL']),
    wideH: 100,
  },
  {
    name: 'Step 3, FastEmbed: MiniLM embeds the review into 384 dimensions and CLIP embeds the image into 512 dimensions, locally.',
    tall: () => label('3. FastEmbed') + caption(14, 'runs locally') + chip(12, 76, 136, 56, 'text', ['MiniLM', '384 dims']) + chip(12, 148, 136, 56, 'image', ['CLIP', '512 dims']),
    wide: () => label('3. FastEmbed') + caption(326, 'runs locally', true) + chip(14, 44, 150, 56, 'text', ['MiniLM', '384 dims']) + chip(176, 44, 150, 56, 'image', ['CLIP', '512 dims']),
    wideH: 112,
  },
  {
    name: 'Step 4, Qdrant: each product becomes one point in the products-data collection, with a text vector, an image vector, and a payload.',
    tall: () =>
      label('4. Qdrant') + caption(14, 'products-data') +
      `<rect class="di-card" x="8" y="72" width="144" height="132" rx="6"/>` +
      [['text', 100, 6], ['image', 138, 8]].map(([k, cy, n]) => `<text class="di-txt" x="18" y="${cy + 5}">${k}</text>${bars(90, cy - 12, n, k)}`).join('') +
      `<text class="di-txt" x="18" y="181">payload</text>` +
      `<rect class="di-fill--payload" x="90" y="164" width="22" height="24" rx="2"/><rect class="di-fill--payload" x="116" y="164" width="22" height="24" rx="2"/>`,
    wide: () =>
      label('4. Qdrant') + caption(326, 'products-data', true) +
      [['text', 14, 6], ['image', 122, 8]].map(([k, x, n]) => `<text class="di-txt" x="${x}" y="64">${k}</text>${bars(x, 74, n, k)}`).join('') +
      `<text class="di-txt" x="230" y="64">payload</text>` +
      `<rect class="di-fill--payload" x="230" y="74" width="22" height="24" rx="2"/><rect class="di-fill--payload" x="256" y="74" width="22" height="24" rx="2"/>`,
    wideH: 112,
  },
];

const TALL_W = 160;
const TALL_H = 220;
const WIDE_W = 340;

const svg = (cls, w, h, name, body) =>
  `<svg class="qi-svg di-stage ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name}">${frame(w, h)}${body}</svg>`;

const arrows =
  `<svg class="di-arrow di-arrow--h" viewBox="0 0 24 24" aria-hidden="true"><path class="di-arrow__line" d="M1 12h16"/><path class="di-arrow__head" d="M15 6l8 6-8 6z"/></svg>` +
  `<svg class="di-arrow di-arrow--v" viewBox="0 0 24 28" aria-hidden="true"><path class="di-arrow__line" d="M12 1v15"/><path class="di-arrow__head" d="M6 14l6 9 6-9z"/></svg>`;

export function mount(node) {
  node.classList.add('qi-di');

  const flow = STAGES.map(
    (s, i) =>
      (i ? arrows : '') +
      svg('di-stage--tall', TALL_W, TALL_H, s.name, s.tall()) +
      svg('di-stage--wide', WIDE_W, s.wideH, s.name, s.wide())
  ).join('');

  node.innerHTML =
    `<div class="qi-fig"><div class="di-flow">${flow}</div>` +
    `<ul class="di-legend">` +
    `<li><span class="di-swatch di-fill--text"></span>review text</li>` +
    `<li><span class="di-swatch di-fill--image"></span>product image</li>` +
    `<li><span class="di-swatch di-fill--payload"></span>payload</li>` +
    `</ul></div>`;

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
