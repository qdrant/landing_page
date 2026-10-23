/*
 * context-sent island — replaces context-embedded-vs-sent.svg.
 *
 * Two 1,000-token prompts. In both, search used each chunk with its added
 * context. When the context goes into the embedding only, the prompt gets
 * the original chunks and four fit. When the context is also sent, each chunk
 * carries its context into the prompt and only three fit. Illustrative sizes:
 * chunks of 230 tokens, context of 70.
 *
 * Static, in the same language as the budget island; a wide drawing for the
 * article column and a compact one for phones, switched by a container query.
 */

const BUDGET = 1000;
const CHUNK = 230;
const CONTEXT = 70;

const ROWS = [
  {
    title: 'Context in the embedding only · the prompt gets the original chunks',
    short: 'Context in the embedding only',
    context: false,
  },
  {
    title: 'Context also sent · each chunk carries its context into the prompt',
    short: 'Context also sent',
    context: true,
  },
];

const LAYOUTS = {
  wide: { w: 700, h: 244, x0: 20, plotW: 660, detail: true },
  narrow: { w: 340, h: 244, x0: 10, plotW: 320, detail: false },
};

const BAR_Y = 30;
const BAR_H = 40;
const ROW_H = 112;

let uid = 0;

function row(r, L, y, hatch) {
  const s = L.plotW / BUDGET;
  const per = CHUNK + (r.context ? CONTEXT : 0);
  const n = Math.floor(BUDGET / per);
  const parts = [
    `<text class="qi-label qi-label--strong" x="${L.x0}" y="${y + 18}">${L.detail ? r.title : r.short}</text>`,
    `<rect class="qi-cx__frame" x="${L.x0}" y="${y + BAR_Y}" width="${L.plotW}" height="${BAR_H}" rx="3"/>`,
    `<rect fill="url(#${hatch})" x="${L.x0 + n * per * s}" y="${y + BAR_Y + 1}" width="${(BUDGET - n * per) * s}" height="${BAR_H - 2}"/>`,
  ];
  let x = L.x0;
  for (let i = 0; i < n; i++) {
    if (r.context) {
      parts.push(`<rect class="qi-cx__part qi-cx__part--context" x="${x}" y="${y + BAR_Y}" width="${CONTEXT * s}" height="${BAR_H}" rx="3"/>`);
      x += CONTEXT * s;
    }
    parts.push(`<rect class="qi-cx__part" x="${x}" y="${y + BAR_Y}" width="${CHUNK * s}" height="${BAR_H}" rx="3"/>`);
    x += CHUNK * s;
  }
  const what = r.context ? 'chunks with context' : 'original chunks';
  const lead = L.detail ? 'search used context + chunk · ' : '';
  parts.push(`<text class="qi-label qi-cx__sub" x="${L.x0}" y="${y + BAR_Y + BAR_H + 22}">${lead}${n} ${what} fit in 1,000 tokens</text>`);
  return parts.join('');
}

function drawing(name) {
  const L = LAYOUTS[name];
  const hatch = `qi-cx-hatch-${uid}-${name}`;
  const ly = L.h - 8;
  return `
  <svg class="qi-svg qi-cx__svg qi-cx__svg--${name}" viewBox="0 0 ${L.w} ${L.h}" role="img"
    aria-label="Two 1,000-token prompts. In both, search used each chunk with its added context. When the context goes into the embedding only, the prompt receives the original chunks and four fit. When the context is also sent, each chunk carries its context into the prompt and only three fit.">
    <defs><pattern id="${hatch}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="qi-cx__hatch" x1="0" y1="0" x2="0" y2="8"/></pattern></defs>
    ${ROWS.map((r, i) => row(r, L, i * ROW_H, hatch)).join('')}
    <rect class="qi-cx__part qi-cx__part--context" x="${L.x0}" y="${ly - 12}" width="22" height="14" rx="2"/>
    <text class="qi-label" x="${L.x0 + 30}" y="${ly}">added context</text>
    <rect class="qi-cx__part" x="${L.x0 + 170}" y="${ly - 12}" width="22" height="14" rx="2"/>
    <text class="qi-label" x="${L.x0 + 200}" y="${ly}">chunk text</text>
  </svg>`;
}

export function mount(node) {
  uid += 1;
  node.classList.add('qi-cx');
  node.innerHTML = `<div class="qi-fig">${drawing('wide')}${drawing('narrow')}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
