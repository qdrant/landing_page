/*
 * bulk-batching island — theme-aware replacement for option5-batching.png.
 *
 * Uploading one point per request creates high overhead, while batches of 64 to 256 points pay the overhead once.
 *
 * Two paths through the same step: the default or risky path (Qdrant red) and
 * the recommended one (cyan), or two neutral tradeoffs. Drawn in the shared
 * island vocabulary (.qi-frame boxes, .qi-label text) in the style of the
 * CTO-validated islands. A wide drawing for the article column and a stacked
 * one for phones, switched by a container query in index.css.
 */

const PATHS = [
  {
    "label": "One point per request",
    "tone": "risk",
    "steps": [
      "Client",
      "Thousands of\nrequests",
      "Overhead paid\nfor every point"
    ]
  },
  {
    "label": "Batched",
    "tone": "good",
    "steps": [
      "Client",
      "Batches of\n64 to 256 points",
      "Overhead paid\nonce per batch"
    ]
  }
];

const WIDE = { w: 700, h: 196, boxW: 200, boxH: 56, gap: 50, rowY: [26, 124] };
const NARROW = { w: 340, boxW: 280, boxH: 44, gapY: 22, caption: 20 };

function box(x, y, w, h, text, tone, strong) {
  const lines = text.split('\n');
  const top = y + h / 2 - ((lines.length - 1) * 16) / 2 + 4;
  const t = lines
    .map((l, i) => `<text class="qi-label${strong && i === 0 ? ' qi-label--strong' : ''}" x="${x + w / 2}" y="${top + i * 16}" text-anchor="middle">${l}</text>`)
    .join('');
  return `<rect class="qi-frame qi-bk__box qi-bk__box--${tone}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>${t}`;
}

function arrow(d, tone, id) {
  return `<path class="qi-bk__wire qi-bk__wire--${tone}" d="${d}" marker-end="url(#${id}-${tone})"/>`;
}

function markers(id) {
  return ['risk', 'good', 'neutral']
    .map((t) => `<marker id="${id}-${t}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="qi-bk__head--${t}"/></marker>`)
    .join('');
}

function wide() {
  const L = WIDE;
  const id = 'bk-bulk-batching-w';
  const parts = [];
  PATHS.forEach((p, r) => {
    const y = L.rowY[r];
    parts.push(`<text class="qi-label qi-bk__caption--${p.tone}" x="0" y="${y - 10}">${p.label}</text>`);
    p.steps.forEach((s, i) => {
      const x = i * (L.boxW + L.gap);
      parts.push(box(x, y, L.boxW, L.boxH, s, i === 2 ? p.tone : 'neutral', i === 2));
      if (i < 2) parts.push(arrow(`M${x + L.boxW + 2} ${y + L.boxH / 2} H${x + L.boxW + L.gap - 3}`, p.tone, id));
    });
  });
  return `<svg class="qi-svg qi-bk__svg qi-bk__svg--wide" viewBox="0 0 ${L.w} ${L.h}" role="img" aria-label="Uploading one point per request pays the request overhead for every point. Batches of 64 to 256 points pay it once per batch."><defs>${markers(id)}</defs>${parts.join('')}</svg>`;
}

function narrow() {
  const L = NARROW;
  const id = 'bk-bulk-batching-n';
  const parts = [];
  let y = 0;
  PATHS.forEach((p) => {
    y += L.caption;
    parts.push(`<text class="qi-label qi-bk__caption--${p.tone}" x="0" y="${y - 6}">${p.label}</text>`);
    p.steps.forEach((s, i) => {
      parts.push(box(30, y, L.boxW, L.boxH, s.replace(/\n/g, ' '), i === 2 ? p.tone : 'neutral', i === 2));
      if (i < 2) parts.push(arrow(`M170 ${y + L.boxH + 2} V${y + L.boxH + L.gapY - 3}`, p.tone, id));
      y += L.boxH + (i < 2 ? L.gapY : 0);
    });
    y += 20;
  });
  return `<svg class="qi-svg qi-bk__svg qi-bk__svg--narrow" viewBox="0 0 ${L.w} ${y}" role="img" aria-label="Uploading one point per request pays the request overhead for every point. Batches of 64 to 256 points pay it once per batch."><defs>${markers(id)}</defs>${parts.join('')}</svg>`;
}

export function mount(node) {
  node.classList.add('qi-bk');
  node.innerHTML = `<div class="qi-fig">${wide()}${narrow()}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
