/*
 * query-planner island — replaces payload-index-vector-search.png, which
 * showed only the "payload index first, then vector search" path.
 *
 * Qdrant's query planner (per segment) estimates filter cardinality from the
 * payload indexes. If the estimated matches' vectors are below
 * full_scan_threshold (10,000 KB by default), it scores each match directly;
 * otherwise it searches the filterable HNSW graph. ACORN is an opt-in for
 * strict filter combinations. Source: search.md#query-planning and
 * indexing.md (full_scan_threshold, ACORN).
 *
 * Static flow in the shared island vocabulary (.qi-frame boxes, .qi-label
 * text, .qi-axis connectors), styled like the CTO-validated islands. Two
 * drawings: left-to-right for the article column, top-to-bottom for phones
 * (like the repairs island), switched by a container query in index.css.
 */

const TAG_FEW = 'vectors &lt; full_scan_threshold';
const TAG_MANY = 'strict combinations: add ACORN';

const LAYOUTS = {
  wide: {
    w: 700, h: 272,
    boxes: {
      q: { x: 0, y: 103, w: 130, h: 66, lines: ['Filtered', 'query'] },
      est: { x: 170, y: 93, w: 170, h: 86, lines: ['Payload index', 'estimates how many', 'points match'] },
      few: { x: 400, y: 4, w: 300, h: 112, lines: ['Few matches', 'Score each match directly', 'exact results'], tag: TAG_FEW },
      many: { x: 400, y: 156, w: 300, h: 112, lines: ['Many matches', 'Search the filterable', 'HNSW graph'], tag: TAG_MANY, acorn: true },
    },
    wires: (b) => {
      const mid = b.est.y + b.est.h / 2;
      const x = b.est.x + b.est.w;
      return [
        `M${b.q.x + b.q.w} ${mid} H${b.est.x - 2}`,
        `M${x} ${mid - 12} H${x + 24} V${b.few.y + b.few.h / 2} H${b.few.x - 2}`,
        `M${x} ${mid + 12} H${x + 24} V${b.many.y + b.many.h / 2} H${b.many.x - 2}`,
      ];
    },
  },
  narrow: {
    w: 340, h: 402,
    boxes: {
      q: { x: 24, y: 0, w: 316, h: 40, lines: ['Filtered query'] },
      est: { x: 24, y: 66, w: 316, h: 62, lines: ['Payload index estimates', 'how many points match'] },
      few: { x: 24, y: 158, w: 316, h: 104, lines: ['Few matches', 'Score each match directly', 'exact results'], tag: TAG_FEW },
      many: { x: 24, y: 294, w: 316, h: 104, lines: ['Many matches', 'Search the filterable', 'HNSW graph'], tag: TAG_MANY, acorn: true },
    },
    wires: (b) => {
      const cx = b.q.x + b.q.w / 2;
      return [
        `M${cx} ${b.q.y + b.q.h} V${b.est.y - 2}`,
        `M${cx} ${b.est.y + b.est.h} V${b.few.y - 2}`,
        `M${b.est.x} ${b.est.y + b.est.h / 2} H8 V${b.many.y + b.many.h / 2} H${b.many.x - 2}`,
      ];
    },
  },
};

function box(b) {
  const cx = b.x + b.w / 2;
  const top = b.tag ? b.y + 28 : b.y + b.h / 2 - ((b.lines.length - 1) * 18) / 2 + 4;
  const text = b.lines
    .map((l, i) => `<text class="qi-label${i === 0 ? ' qi-label--strong' : ''}" x="${cx}" y="${top + i * 18}" text-anchor="middle">${l}</text>`)
    .join('');
  const tag = b.tag
    ? `<text class="qi-label qi-qp__tag${b.acorn ? ' qi-qp__tag--acorn' : ''}" x="${cx}" y="${b.y + b.h - 14}" text-anchor="middle">${b.tag}</text>`
    : '';
  return `<rect class="qi-frame" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6"/>${text}${tag}`;
}

function drawing(name) {
  const L = LAYOUTS[name];
  const b = L.boxes;
  const marker = `qp-arrow-${name}`;
  return `
  <svg class="qi-svg qi-qp__svg qi-qp__svg--${name}" viewBox="0 0 ${L.w} ${L.h}" role="img"
    aria-label="A filtered query goes to the payload index, which estimates how many points match. If the matches' vectors are below full_scan_threshold, Qdrant scores each match directly for exact results. Otherwise it searches the filterable HNSW graph, and ACORN can be added for strict filter combinations.">
    <defs>
      <marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0 0 L10 5 L0 10 z" class="qi-qp__head"/>
      </marker>
    </defs>
    ${L.wires(b).map((d) => `<path class="qi-axis qi-qp__wire" d="${d}" marker-end="url(#${marker})"/>`).join('')}
    ${Object.values(b).map(box).join('')}
  </svg>`;
}

export function mount(node) {
  node.classList.add('qi-qp');
  node.innerHTML = `<div class="qi-fig">${drawing('wide')}${drawing('narrow')}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
