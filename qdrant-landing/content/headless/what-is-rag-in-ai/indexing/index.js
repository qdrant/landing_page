// Fixed process diagram, adapted from the article's original image.
// Uses the existing island lifecycle and shared SVG frames/tokens. No controls
// are needed: the full process is visible. Geometry alone changes on phones.
const DIAGRAM = {"image": "how-indexing-works.jpg", "ratio": "63 / 40", "caption": "Indexing loads documents, splits them into chunks, and embeds the chunks. Qdrant stores the embeddings together with their source text.", "labels": [["Knowledge", "base"], ["Loader"], ["Documents"], ["Splitter"], ["Chunks"], ["Embedding", "model"], ["Embeddings"], ["Qdrant", "Vectors + text"]], "roles": ["data", "query", "data", "query", "data", "model", "model", "database"], "positions": [[20, 24, 152, 68], [20, 164, 152, 68], [220, 164, 152, 68], [220, 24, 152, 68], [420, 24, 152, 68], [620, 24, 152, 68], [620, 164, 152, 68], [420, 304, 152, 68]], "height": 400, "edges": ["M96 92V164", "M172 198H220", "M296 164V92", "M372 58H420", "M572 58H620", "M696 92V164", "M696 232V338H572", "M496 92V304"], "mobile_extra": [[4, 7]], "name": "indexing", "mobile_skip": []};
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
