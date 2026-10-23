/*
 * budget-filling island — replaces budget-filling.svg.
 *
 * Search results go into the prompt in rank order until the next chunk would
 * not fit. Two rankings for the same question: chunks of up to 128 tokens with
 * the answer ranked 5th, and chunks of up to 510 tokens with the answer ranked
 * 2nd. Pick a context budget to see which prompt receives the answer:
 *   500    neither (4 small chunks fit, 1 large)
 *   1,000  only the small chunks (8 small, 1 large); the guide's default
 *   2,000  both (16 small, 4 large)
 * Chunk sizes are illustrative, not measured.
 *
 * Drawn on a fixed token scale so the budget visibly grows. A wide drawing
 * for the article column and a compact one for phones, switched by a
 * container query, as in the filter-order island.
 */

const BUDGETS = [500, 1000, 2000];
const DEFAULT_BUDGET = 1000;
const SCALE_MAX = 2200; // tokens across the plot; leaves room for the chunk that does not fit

const ROWS = [
  {
    label: 'Chunks of up to 128 tokens',
    short: '128-token chunks',
    sizes: [120, 128, 110, 125, 118, 127, 122, 115, 124, 119, 126, 112, 121, 128, 117, 123, 125],
    answer: 4, // ranked 5th
    noun: 'small',
  },
  {
    label: 'Chunks of up to 510 tokens',
    short: '510-token chunks',
    sizes: [500, 505, 470, 488, 495],
    answer: 1, // ranked 2nd
    noun: 'large',
  },
];

const LAYOUTS = {
  wide: { w: 700, h: 258, x0: 20, plotW: 660, rowY: [0, 108], ticks: [0, 500, 1000, 1500, 2000], ranks: true, detail: true },
  narrow: { w: 340, h: 258, x0: 10, plotW: 320, rowY: [0, 108], ticks: [0, 1000, 2000], ranks: false, detail: false },
};

const BAR_Y = 30;
const BAR_H = 40;
const fmt = (n) => n.toLocaleString('en-US');
const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

// How many chunks fit, in rank order, before the next one would exceed the budget.
export function fill(sizes, budget) {
  let used = 0;
  let n = 0;
  while (n < sizes.length && used + sizes[n] <= budget) used += sizes[n++];
  return { n, used };
}

let uid = 0;

function row(r, budget, L, y, hatch) {
  const s = L.plotW / SCALE_MAX;
  const { n, used } = fill(r.sizes, budget);
  const sent = r.answer < n;
  const parts = [];
  const title = `${L.detail ? r.label : r.short} · answer ${sent ? 'sent' : 'not sent'}`;
  parts.push(`<text class="qi-label qi-label--strong qi-cb__title" x="${L.x0}" y="${y + 18}">${title}</text>`);
  parts.push(`<rect class="qi-cb__frame" x="${L.x0}" y="${y + BAR_Y}" width="${budget * s}" height="${BAR_H}" rx="3"/>`);
  parts.push(`<rect fill="url(#${hatch})" x="${L.x0 + used * s}" y="${y + BAR_Y + 1}" width="${(budget - used) * s}" height="${BAR_H - 2}"/>`);
  let x = L.x0;
  for (let i = 0; i < n; i++) {
    const w = r.sizes[i] * s;
    const cls = i === r.answer ? 'qi-cb__chunk qi-cb__chunk--answer' : 'qi-cb__chunk';
    parts.push(`<rect class="${cls}" x="${x}" y="${y + BAR_Y}" width="${w}" height="${BAR_H}" rx="3"/>`);
    if (L.ranks) parts.push(`<text class="qi-cb__rank${i === r.answer ? ' qi-cb__rank--answer' : ''}" x="${x + w / 2}" y="${y + BAR_Y + 25}">${i + 1}</text>`);
    x += w;
  }
  // The next chunk in rank order, which would cross the budget line.
  if (n < r.sizes.length) {
    const w = r.sizes[n] * s;
    const cls = n === r.answer ? 'qi-cb__next qi-cb__next--answer' : 'qi-cb__next';
    parts.push(`<rect class="${cls}" x="${x + 3}" y="${y + BAR_Y + 3}" width="${w - 6}" height="${BAR_H - 6}" rx="3"/>`);
    // Label it only where the whole label stays inside the plot (12px mono, 7.2px a character).
    const label = `rank ${n + 1} · ${r.sizes[n]} tokens`;
    const fits = Math.min(x + w, L.x0 + L.plotW) - (x + 8) >= label.length * 7.2 + 2;
    if (fits) parts.push(`<text class="qi-cb__next-label" x="${x + 8}" y="${y + BAR_Y + 25}">${label}</text>`);
  }
  parts.push(`<line class="qi-cb__limit" x1="${L.x0 + budget * s}" y1="${y + BAR_Y - 6}" x2="${L.x0 + budget * s}" y2="${y + BAR_Y + BAR_H + 6}"/>`);
  const detail = L.detail ? ` · answer ranked ${ordinal(r.answer + 1)}` : '';
  parts.push(`<text class="qi-label qi-cb__sub" x="${L.x0}" y="${y + BAR_Y + BAR_H + 22}">${n} chunk${n === 1 ? '' : 's'} · ${fmt(used)} of ${fmt(budget)} tokens${detail}</text>`);
  return parts.join('');
}

function drawing(name, budget) {
  const L = LAYOUTS[name];
  const s = L.plotW / SCALE_MAX;
  const hatch = `qi-cb-hatch-${uid}-${name}`;
  const axisY = 214;
  const ticks = L.ticks.map((t) => {
    const x = L.x0 + t * s;
    return `<line class="qi-axis" x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 8}"/><text class="qi-label" x="${x}" y="${axisY + 24}" text-anchor="middle">${fmt(t)}</text>`;
  }).join('');
  return `
  <svg class="qi-svg qi-cb__svg qi-cb__svg--${name}" viewBox="0 0 ${L.w} ${L.h}" role="img" aria-hidden="true">
    <defs>
      <pattern id="${hatch}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="qi-cb__hatch" x1="0" y1="0" x2="0" y2="8"/></pattern>
      <clipPath id="${hatch}-clip"><rect x="0" y="0" width="${L.x0 + L.plotW}" height="${L.h}"/></clipPath>
    </defs>
    <g clip-path="url(#${hatch}-clip)">
      ${ROWS.map((r, i) => row(r, budget, L, L.rowY[i], hatch)).join('')}
    </g>
    <line class="qi-axis" x1="${L.x0}" y1="${axisY}" x2="${L.x0 + L.plotW}" y2="${axisY}"/>
    ${ticks}
    <text class="qi-label" x="${L.x0 + L.plotW / 2}" y="${L.h - 2}" text-anchor="middle">tokens of retrieved text in the prompt</text>
  </svg>`;
}

function summary(budget) {
  const parts = ROWS.map((r) => {
    const { n } = fill(r.sizes, budget);
    const sent = r.answer < n;
    return `${n} ${r.noun} chunk${n === 1 ? '' : 's'} fit${n === 1 ? 's' : ''}, so the answer, ranked ${ordinal(r.answer + 1)}, is ${sent ? '<b>sent</b>' : '<b>not sent</b>'}`;
  });
  return `At ${fmt(budget)} tokens, ${parts[0]}; ${parts[1]}.`;
}

export function mount(node) {
  uid += 1;
  node.classList.add('qi-cb');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Context budget">',
    '      <span class="qi-hint">Context budget:</span>',
    BUDGETS.map((b) => `<button type="button" class="qi-chip" data-budget="${b}" aria-pressed="false">${fmt(b)} tokens</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <div class="qi-cb__stage"></div>',
    '  <p class="qi-status qi-status--2" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const stage = node.querySelector('.qi-cb__stage');
  const status = node.querySelector('.qi-status');
  const buttons = [...node.querySelectorAll('[data-budget]')];

  function render(budget) {
    stage.innerHTML = drawing('wide', budget) + drawing('narrow', budget);
    status.innerHTML = summary(budget);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.budget) === budget)));
  }

  buttons.forEach((b) => b.addEventListener('click', () => render(Number(b.dataset.budget))));
  render(DEFAULT_BUDGET);

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
