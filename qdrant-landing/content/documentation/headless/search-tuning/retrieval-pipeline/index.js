/*
 * retrieval-pipeline island — interactive replacement for retrieval-pipeline.svg.
 *
 * Shows the hybrid retrieval pipeline: a dense prefetch and a sparse prefetch
 * feed fusion, and an optional reranker rescores the fused candidates. At
 * article width every stage already shows its full name and the settings it
 * owns, drawn straight into the SVG.
 *
 * Below ~480px CSS px the same viewBox is too small to keep that text
 * legible (a 1200-unit-wide drawing rendered at ~350px puts a 21px label
 * under 6px). Enlarging the in-SVG text to compensate would need the boxes
 * to grow past the canvas edge, so instead each stage collapses to its short
 * name there, and tapping it plays the same full name and settings as
 * ordinary HTML text in the status line below the diagram, where there is no
 * viewBox to shrink it. Nothing shown on desktop is unavailable on mobile;
 * it just moves from inside the drawing to below it.
 */

const VB_W = 1200;
const VB_H = 320;

const STAGES = [
  { id: 'dense', x: 15, y: 56, w: 315, h: 86, short: 'Dense', full: 'Dense prefetch', knobs: 'limit · hnsw_ef', role: 'win' },
  { id: 'sparse', x: 15, y: 198, w: 315, h: 86, short: 'Sparse', full: 'Sparse prefetch', knobs: 'limit · Modifier.IDF', role: 'win' },
  { id: 'fusion', x: 395, y: 127, w: 350, h: 86, short: 'Fusion', full: 'Fusion', knobs: 'RRF (k, weights) · DBSF', role: 'accent' },
  { id: 'reranker', x: 830, y: 127, w: 350, h: 86, short: 'Reranker', full: 'Reranker', knobs: 'candidate count · model', role: 'cat1', dashed: true },
];

function pct(n, of) {
  return (n / of) * 100;
}

function stageMarkup(s) {
  const cx = s.x + s.w / 2;
  const rectAttrs = s.dashed ? `fill="none" stroke-dasharray="7 6"` : `fill="var(--rp-${s.role}-fill)"`;
  return [
    `<g class="qi-rp__stage" data-stage="${s.id}">`,
    `  <rect class="qi-rp__box qi-rp__box--${s.role}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="10" ${rectAttrs}/>`,
    `  <text x="${cx}" y="${s.y + 35}" text-anchor="middle" class="qi-rp__name qi-rp__name--${s.role}">${s.full}</text>`,
    `  <text x="${cx}" y="${s.y + 67}" text-anchor="middle" class="qi-rp__knobs qi-rp__knobs--${s.role}">${s.knobs}</text>`,
    `  <text x="${cx}" y="${s.y + s.h / 2}" text-anchor="middle" dominant-baseline="middle" class="qi-rp__short qi-rp__short--${s.role}">${s.short}</text>`,
    `</g>`,
  ].join('');
}

function hitMarkup(s) {
  const style = [`left:${pct(s.x, VB_W)}%`, `top:${pct(s.y, VB_H)}%`, `width:${pct(s.w, VB_W)}%`, `height:${pct(s.h, VB_H)}%`].join(';');
  return `<button type="button" class="qi-rp__hit" data-stage="${s.id}" style="${style}" aria-pressed="false" aria-label="${s.full}"></button>`;
}

const DEFAULT_STATUS = 'Tap a stage to see its parameters.';

export function mount(node) {
  node.classList.add('qi-rp');

  node.innerHTML = [
    '<div class="qi-fig qi-rp__fig">',
    `  <svg class="qi-svg qi-rp__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`,
    '    aria-label="The hybrid retrieval pipeline: a dense prefetch and a sparse prefetch feed fusion, and an optional reranker rescores the fused candidates before the results return.">',
    '    <defs>',
    '      <marker id="rp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '        <path d="M0 0 L10 5 L0 10 z" class="qi-rp__arrowhead"/>',
    '      </marker>',
    '    </defs>',
    '    <text x="1005" y="110" text-anchor="middle" class="qi-rp__tag">optional</text>',
    STAGES.map(stageMarkup).join(''),
    '    <path class="qi-rp__wire" d="M330 99 H360 V148 H395" marker-end="url(#rp-arrow)"/>',
    '    <path class="qi-rp__wire" d="M330 241 H360 V192 H395" marker-end="url(#rp-arrow)"/>',
    '    <path class="qi-rp__wire" d="M745 170 H830" marker-end="url(#rp-arrow)"/>',
    '  </svg>',
    '  <div class="qi-rp__hits">',
    STAGES.map(hitMarkup).join(''),
    '  </div>',
    `  <p class="qi-status qi-rp__status" role="status" aria-live="polite">${DEFAULT_STATUS}</p>`,
    '</div>',
  ].join('');

  const hits = [...node.querySelectorAll('.qi-rp__hit')];
  const statusEl = node.querySelector('.qi-rp__status');
  let active = null;

  hits.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.stage;
      const stage = STAGES.find((s) => s.id === id);
      const pressed = active !== id;
      active = pressed ? id : null;
      hits.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stage === active)));
      statusEl.textContent = pressed ? `${stage.full} — ${stage.knobs}` : DEFAULT_STATUS;
    });
  });

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
