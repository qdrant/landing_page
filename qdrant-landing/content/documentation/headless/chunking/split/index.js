/*
 * chunk-split island — replaces good-and-bad-split.svg.
 *
 * One short document about elephants, split two ways, for the question
 * "What color is an elephant?". Between sentences, the returned chunk holds
 * the whole answer. Inside a sentence, the boundary cuts the answer: search
 * returns the chunk that says something is gray, and "Elephants" stays in the
 * chunk before it. Illustrative, not measured.
 *
 * Static, in the style of the filter-order island: a wide drawing for the
 * article column and a compact one for phones, switched by a container query.
 * Chunk text is monospace, so answer highlights are placed by character index.
 */

const FONT = 14;
const CW = FONT * 0.6; // advance width of one monospace character

// Each chunk is a list of [text, isAnswer] segments.
const PANELS = [
  {
    caption: 'Split between sentences',
    chunks: [
      [['Elephants live in herds.', false]],
      [['Elephants are usually gray.', true]],
      [['Their skin is thick.', false]],
    ],
    returned: 1,
    cut: null,
    result: 'Returned: the whole answer',
    lost: false,
  },
  {
    caption: 'Split inside a sentence',
    chunks: [
      [['Elephants live in herds. ', false], ['Elephants', true]],
      [['are usually gray.', true], [' Their skin is', false]],
      [['thick.', false]],
    ],
    returned: 1,
    cut: 0, // the boundary after this chunk cuts the answer
    result: 'Returned: gray, but not what is gray',
    lost: true,
  },
];

const LEGEND = [
  ['answer', 'answer passage'],
  ['returned', 'returned chunk'],
  ['vector', 'chunk vector'],
  ['cut', 'cut answer'],
];

const LAYOUTS = {
  wide: { w: 700, h: 284, panels: [[0, 0], [360, 0]], legendY: 268, legendCols: 4 },
  narrow: { w: 340, h: 504, panels: [[0, 0], [0, 212]], legendY: 472, legendCols: 2 },
};

const CHUNK_Y = 66;
const CHUNK_H = 36;
const CHUNK_GAP = 10;
const BOX_X = 18;
const BOX_W = 320;

function chunk(segments, x, y, returned) {
  const tx = x + BOX_X + 10;
  const ty = y + CHUNK_H / 2 + 5;
  const parts = [
    `<circle class="qi-cs__vector" cx="${x + 6}" cy="${y + CHUNK_H / 2}" r="4"/>`,
    `<rect class="qi-cs__chunk" x="${x + BOX_X}" y="${y}" width="${BOX_W}" height="${CHUNK_H}" rx="4"/>`,
  ];
  let i = 0;
  for (const [text, answer] of segments) {
    const sx = tx + i * CW;
    if (answer) {
      parts.push(`<rect class="qi-cs__answer" x="${sx - 2}" y="${y + 7}" width="${text.length * CW + 4}" height="${CHUNK_H - 14}" rx="2"/>`);
    }
    parts.push(`<text class="qi-cs__text${answer ? ' qi-cs__text--answer' : ''}" x="${sx}" y="${ty}" xml:space="preserve">${text}</text>`);
    i += text.length;
  }
  if (returned) {
    parts.push(`<rect class="qi-cs__returned" x="${x + BOX_X - 3}" y="${y - 3}" width="${BOX_W + 6}" height="${CHUNK_H + 6}" rx="6"/>`);
  }
  return parts.join('');
}

function panel(p, x, y) {
  const parts = [`<text class="qi-label qi-label--strong qi-cs__caption" x="${x}" y="${y + 50}">${p.caption}</text>`];
  p.chunks.forEach((c, i) => {
    parts.push(chunk(c, x, y + CHUNK_Y + i * (CHUNK_H + CHUNK_GAP), i === p.returned));
  });
  if (p.cut != null) {
    const gy = y + CHUNK_Y + (p.cut + 1) * (CHUNK_H + CHUNK_GAP) - CHUNK_GAP / 2;
    parts.push(`<line class="qi-cs__cut" x1="${x + BOX_X}" y1="${gy}" x2="${x + BOX_X + BOX_W}" y2="${gy}"/>`);
  }
  const ry = y + CHUNK_Y + 3 * (CHUNK_H + CHUNK_GAP) + 18;
  parts.push(`<text class="qi-label qi-cs__result${p.lost ? ' qi-cs__result--lost' : ' qi-label--strong'}" x="${x}" y="${ry}">${p.result}</text>`);
  return parts.join('');
}

function legendSwatch(kind, x, y) {
  if (kind === 'answer') return `<rect class="qi-cs__answer" x="${x}" y="${y - 11}" width="22" height="14" rx="2"/>`;
  if (kind === 'returned') return `<rect class="qi-cs__returned" x="${x + 1}" y="${y - 11}" width="20" height="14" rx="3"/>`;
  if (kind === 'vector') return `<circle class="qi-cs__vector" cx="${x + 11}" cy="${y - 4}" r="4"/>`;
  return `<line class="qi-cs__cut" x1="${x}" y1="${y - 4}" x2="${x + 22}" y2="${y - 4}"/>`;
}

function drawing(name) {
  const L = LAYOUTS[name];
  // Legend items flow left to right, each as wide as its label.
  let x = 0;
  const legend = LEGEND.map(([kind, label], i) => {
    if (i % L.legendCols === 0) x = 0;
    const y = L.legendY + Math.floor(i / L.legendCols) * 24;
    const item = `${legendSwatch(kind, x, y)}<text class="qi-label" x="${x + 30}" y="${y}">${label}</text>`;
    x += 30 + label.length * CW + 28;
    return item;
  }).join('');
  return `
  <svg class="qi-svg qi-cs__svg qi-cs__svg--${name}" viewBox="0 0 ${L.w} ${L.h}" role="img"
    aria-label="The question: what color is an elephant? Split between sentences, the returned chunk is the whole answer, Elephants are usually gray. Split inside the sentence, the boundary falls after Elephants, so the returned chunk says are usually gray without saying what is gray.">
    <text class="qi-label qi-label--strong qi-cs__caption" x="0" y="18">Question: "What color is an elephant?"</text>
    ${PANELS.map((p, i) => panel(p, ...L.panels[i])).join('')}
    ${legend}
  </svg>`;
}

export function mount(node) {
  node.classList.add('qi-cs');
  node.innerHTML = `<div class="qi-fig">${drawing('wide')}${drawing('narrow')}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
