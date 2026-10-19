/*
 * tradeoff-triangle island — illustrates the three-way tradeoff between
 * isolation, infrastructure cost, and how much the caller's own code must
 * enforce tenant boundaries, for three multitenancy architectures: Silo
 * (cluster per tenant), Bridge (collection per tenant), Pool (shared
 * collection).
 *
 * This is illustrative, not measured: the triangle and the three points are
 * hand-tuned to tell the story, not computed from any formula.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss).
 */

const NS = 'http://www.w3.org/2000/svg';

const VB_W = 400;
const VB_H = 360;

// Triangle vertices (hand-placed to leave room for the corner labels).
const ISO = { x: 200, y: 56 };
const INF = { x: 56, y: 300 };
const ENF = { x: 344, y: 300 };

// Hand-tuned point positions — not derived from the vertices by formula.
// Silo: high isolation, high infra cost, low enforcement -> upper-left, away
// from the Enforcement corner. Bridge: central, pulled toward Isolation.
// Pool: low isolation, low infra cost, high enforcement -> near Enforcement,
// away from the other two corners.
const ARCHS = [
  {
    id: 'silo',
    label: 'Silo',
    dot: { x: 160, y: 178 },
    labelPos: { x: 160, y: 158 },
    anchor: 'middle',
    status: 'Most isolated, at the highest infrastructure cost.',
  },
  {
    id: 'bridge',
    label: 'Bridge',
    dot: { x: 205, y: 165 },
    labelPos: { x: 216, y: 159 },
    anchor: 'start',
    status: 'Qdrant enforces the boundary through collection-scoped keys, at moderate cost.',
  },
  {
    id: 'pool',
    label: 'Pool',
    dot: { x: 295, y: 275 },
    labelPos: { x: 295, y: 257 },
    anchor: 'middle',
    status: 'Cheapest to run, but your code enforces every tenant boundary.',
  },
];

const DEFAULT_STATUS = 'Select an architecture to see its isolation, cost, and enforcement tradeoff.';

export function mount(node) {
  node.classList.add('qi-tt');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Choose an architecture">',
    ARCHS.map(
      (a) =>
        `<button type="button" class="qi-chip qi-tt__chip qi-tt__chip--${a.id}" data-arch="${a.id}" aria-pressed="false">` +
        `<span class="qi-chip__swatch"></span>${a.label}</button>`,
    ).join(''),
    '    </div>',
    '  </div>',
    `  <svg class="qi-svg qi-tt__svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Triangle comparing isolation, infrastructure cost, and enforcement effort for the Silo, Bridge, and Pool multitenancy architectures.">`,
    `    <polygon class="qi-tt__triangle" points="${ISO.x},${ISO.y} ${INF.x},${INF.y} ${ENF.x},${ENF.y}"/>`,
    `    <text class="qi-tt__vertex-label" x="${ISO.x}" y="32" text-anchor="middle">Isolation</text>`,
    '    <text class="qi-tt__vertex-label" x="14" y="326" text-anchor="start">',
    '      <tspan x="14" dy="0">Infrastructure</tspan><tspan x="14" dy="16">cost</tspan>',
    '    </text>',
    '    <text class="qi-tt__vertex-label" x="386" y="326" text-anchor="end">',
    '      <tspan x="386" dy="0">Enforcement</tspan><tspan x="386" dy="16">effort</tspan>',
    '    </text>',
    '    <g class="qi-tt__points">',
    ARCHS.map(
      (a) =>
        `<g class="qi-tt__point qi-tt__point--${a.id}" data-point="${a.id}">` +
        `<circle class="qi-tt__dot" cx="${a.dot.x}" cy="${a.dot.y}"/>` +
        `<text class="qi-tt__point-label" x="${a.labelPos.x}" y="${a.labelPos.y}" text-anchor="${a.anchor}">${a.label}</text>` +
        '</g>',
    ).join(''),
    '    </g>',
    '  </svg>',
    `  <p class="qi-status qi-status--2 qi-tt__status" role="status" aria-live="polite">${DEFAULT_STATUS}</p>`,
    '</div>',
  ].join('');

  const chips = [...node.querySelectorAll('.qi-tt__chip')];
  const points = {};
  ARCHS.forEach((a) => (points[a.id] = node.querySelector(`.qi-tt__point--${a.id}`)));
  const statusEl = node.querySelector('.qi-tt__status');

  let selected = null;

  function render() {
    ARCHS.forEach((a) => {
      const g = points[a.id];
      g.classList.toggle('is-active', selected === a.id);
      g.classList.toggle('is-dim', selected != null && selected !== a.id);
    });
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.arch === selected)));
    statusEl.textContent = selected == null ? DEFAULT_STATUS : ARCHS.find((a) => a.id === selected).status;
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.arch;
      selected = selected === id ? null : id;
      render();
    });
  });

  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
