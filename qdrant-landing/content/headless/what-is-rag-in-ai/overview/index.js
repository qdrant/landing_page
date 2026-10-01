// Fixed process diagram, adapted from the article's original image.
// Uses the existing island lifecycle and shared SVG frames/tokens. No controls
// are needed: the full process is visible. Geometry alone changes on phones.
const DIAGRAM = {"image": "how-rag-works.jpg", "ratio": "7 / 5", "caption": "The question retrieves relevant knowledge. The LLM receives both the question and that context to generate an answer; retrieval does not guarantee correctness.", "labels": [["Question", "Did I meet my", "spending goal?"], ["Knowledge", "base"], ["Relevant", "knowledge"], ["LLM", "Question", "+ context"], ["Answer", "Under budget by $50", "(illustrative)"]], "roles": ["query", "data", "data", "model", "query"], "positions": [[20, 24, 220, 100], [300, 24, 200, 100], [580, 24, 200, 100], [300, 224, 200, 100], [580, 224, 200, 100]], "height": 350, "edges": ["M240 74H300", "M500 74H580", "M130 124V274H300", "M680 124V174H400V224", "M500 274H580"], "mobile_extra": [[0, 3]], "name": "overview", "mobile_skip": []};
let instance = 0;
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function box(lines, role, p) {
  const [x,y,w,h] = p;
  const cy = y + h / 2 - (lines.length - 1) * 11;
  const stacked = role === 'data' ? [8,4].map(d =>
    `<rect class="qi-frame qi-rag-process__frame qi-rag-process__${role}" x="${x+d}" y="${y-d}" width="${w}" height="${h}" rx="6"/>`).join('') : '';
  return stacked + `<rect class="qi-frame qi-rag-process__frame qi-rag-process__${role}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` +
    lines.map((t,i) => `<text class="qi-rag-process__label" x="${x+w/2}" y="${cy+i*22}" text-anchor="middle" dominant-baseline="central">${escape(t)}</text>`).join('');
}
function svg(layout, id) {
  const mobile = layout === 'mobile';
  const width = mobile ? 320 : 800;
  const height = mobile ? DIAGRAM.labels.length * 96 + 16 : DIAGRAM.height;
  const positions = mobile ? DIAGRAM.labels.map((_,i) => [44,16+i*96,232,68]) : DIAGRAM.positions;
  const paths = mobile ? positions.slice(1).flatMap((p,i) => DIAGRAM.mobile_skip.includes(i) ? [] : [`M160 ${positions[i][1]+68}V${p[1]}`]) : DIAGRAM.edges;
  // Direct inputs travel through a dedicated gutter, not across other nodes.
  if (mobile) DIAGRAM.mobile_extra.forEach(([from,to]) => {
    paths.push(`M44 ${positions[from][1]+34}H20V${positions[to][1]+34}H44`);
  });
  return `<svg class="qi-svg qi-rag-process__${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(DIAGRAM.caption)}">
    <defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="qi-rag-process__arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>` +
    paths.map(d => `<path class="qi-rag-process__edge" d="${d}" marker-end="url(#${id})"/>`).join('') +
    positions.map((p,i) => box(DIAGRAM.labels[i], DIAGRAM.roles[i],p)).join('') + '</svg>';
}
export function mount(node) {
  node.classList.add('qi-rag-process');
  const id = `rag-${DIAGRAM.name}-${++instance}`;
  node.innerHTML = `<div class="qi-fig">${svg('desktop',id+'-desktop')}${svg('mobile',id+'-mobile')}</div>`;
  node.dispatchEvent(new CustomEvent('island:ready', {bubbles:true}));
}
