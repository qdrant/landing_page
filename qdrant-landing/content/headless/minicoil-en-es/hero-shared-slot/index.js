/*
 * hero-shared-slot island: a drawing without controls, home and casa write into one shared block of a sparse vector.
 *
 * Same design as the static figure (00-hero-shared-slot.svg), drawn inline so it follows the
 * page theme like the other islands of this article: every color is a CSS
 * variable (index.css) with the light design value and a dark counterpart.
 * Inline copy of static/articles_data/minicoil-en-es/00-hero-shared-slot.svg (the no-JS fallback);
 * keep the drawing and the fallback in sync when editing either.
 */

const WIDE = '<svg class="qi-svg qi-hs__svg" aria-label="English and Spanish words share one sparse-vector block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1480 830" role="img">\n  <title>English and Spanish words share one sparse-vector block</title>\n  <desc>The words home and casa merge into one arrow pointing to a bracket over the same eight active cells in an eighteen-cell sparse vector. Three documents sit to the right.</desc>\n  <defs>\n    <marker id="concept-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="24" markerHeight="24" markerUnits="userSpaceOnUse" orient="auto">\n      <path d="M0 0 12 6 0 12Z" style="fill: var(--f-9c27b0)"/>\n    </marker>\n    <style>.qi-hs text { font-family: var(--qi-mono); }.qi-hs .qi-hs-word { font-size: 64px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; }.qi-hs .qi-hs-source { fill: var(--f-f0f3fa); stroke-width: 4; }.qi-hs .qi-hs-connector { fill: none; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }.qi-hs .qi-hs-cell { stroke: var(--f-656b7f); stroke-width: 3; }.qi-hs .qi-hs-active { fill: var(--f-f3e5f5); stroke: var(--f-9c27b0); stroke-width: 4; }.qi-hs .qi-hs-document { fill: var(--f-f0f3fa); stroke: var(--f-303547); stroke-width: 4; stroke-linejoin: round; }.qi-hs .qi-hs-document-line { stroke: var(--f-656b7f); stroke-width: 4; stroke-linecap: round; }\n    </style>\n  </defs>\n\n  <rect width="1480" height="830" style="fill: var(--f-f0f3fa)"/>\n\n  <rect class="qi-hs-source" x="150" y="90" width="380" height="190" rx="6" style="stroke: var(--f-006064)"/>\n  <text class="qi-hs-word" x="340" y="188" style="fill: var(--f-006064)">home</text>\n  <rect class="qi-hs-source" x="950" y="90" width="380" height="190" rx="6" style="stroke: var(--f-6047ff)"/>\n  <text class="qi-hs-word" x="1140" y="188" style="fill: var(--f-6047ff)">casa</text>\n\n  <path class="qi-hs-connector" d="M340 280 C340 410 685 388 685 470" style="stroke: var(--f-006064)"/>\n  <path class="qi-hs-connector" d="M1140 280 C1140 410 685 388 685 470" style="stroke: var(--f-6047ff)"/>\n  <circle cx="685" cy="470" r="8" style="fill: var(--f-9c27b0)"/>\n  <line class="qi-hs-connector" x1="685" y1="478" x2="685" y2="548" style="stroke: var(--f-9c27b0)" marker-end="url(#concept-arrow)"/>\n\n  <path d="M450 606 V598 Q450 580 468 580 H661 Q685 580 685 558 Q685 580 709 580 H902 Q920 580 920 598 V606" fill="none" style="stroke: var(--f-9c27b0)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>\n\n  <g aria-label="Sparse vector with eight active cells out of eighteen">\n    <rect class="qi-hs-cell" x="150" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="210" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="270" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="330" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="390" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-active" x="450" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="510" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="570" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="630" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="690" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="750" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="810" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-active" x="870" y="620" width="50" height="64" rx="6"/>\n    <rect class="qi-hs-cell" x="930" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="990" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="1050" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="1110" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n    <rect class="qi-hs-cell" x="1170" y="620" width="50" height="64" rx="6" style="fill: var(--f-f0f3fa)"/>\n  </g>\n\n  <g aria-label="Three documents">\n    <g transform="translate(1280 450)">\n      <path class="qi-hs-document" d="M0 0 H56 L80 24 V100 H0Z"/>\n      <path d="M56 0 V24 H80" fill="none" style="stroke: var(--f-303547)" stroke-width="4" stroke-linejoin="round"/>\n      <path class="qi-hs-document-line" d="M14 44 H66 M14 62 H66 M14 80 H49"/>\n    </g>\n    <g transform="translate(1280 565)">\n      <path class="qi-hs-document" d="M0 0 H56 L80 24 V100 H0Z"/>\n      <path d="M56 0 V24 H80" fill="none" style="stroke: var(--f-303547)" stroke-width="4" stroke-linejoin="round"/>\n      <path class="qi-hs-document-line" d="M14 44 H66 M14 62 H66 M14 80 H49"/>\n    </g>\n    <g transform="translate(1280 680)">\n      <path class="qi-hs-document" d="M0 0 H56 L80 24 V100 H0Z"/>\n      <path d="M56 0 V24 H80" fill="none" style="stroke: var(--f-303547)" stroke-width="4" stroke-linejoin="round"/>\n      <path class="qi-hs-document-line" d="M14 44 H66 M14 62 H66 M14 80 H49"/>\n    </g>\n  </g>\n</svg>\n';
// Narrow layout below 635px of island width (empty: the wide drawing stays legible).
const NARROW = [];
const IDS = ['concept-arrow'];
let instance = 0;

export function mount(node) {
  node.classList.add('qi-hs');
  instance += 1;
  const me = instance;
  // Unique ids per instance, so two copies on one page never share markers.
  const uniq = (svg, part) =>
    IDS.reduce((s, id) => {
      const uid = `${id}-qi-hs-${me}-${part}`;
      return s.split(`id="${id}"`).join(`id="${uid}"`).split(`#${id})`).join(`#${uid})`);
    }, svg);
  let mode = '';
  function render(next) {
    if (next === mode) return;
    mode = next;
    const parts = mode === 'narrow' ? NARROW : [WIDE];
    node.innerHTML = `<div class="qi-fig qi-hs__stack">${parts.map((p, i) => uniq(p, i)).join('')}</div>`;
  }
  render('wide');
  if (NARROW.length) {
    // Switch while the wide drawing would still render 28-unit labels below 12px:
    // 28 x width / 1480 < 12  <=>  width < 635.
    const ro = new ResizeObserver(([entry]) => render(entry.contentRect.width < 635 ? 'narrow' : 'wide'));
    ro.observe(node);
  }
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
