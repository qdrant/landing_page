/* Static, theme-aware figure on the existing island loader, following
 * content/documentation/headless/agentic-rag-langgraph/workflow. No controls:
 * the whole idea stays visible without interaction. svg() is also the source
 * for the self-contained SVG/PNG fallbacks in
 * static/documentation/tutorials-build-essentials/fine-grained-rag-permissions-qdrant-spicedb/.
 */
let instance = 0;

function defs(id) {
  const head = (suffix, cls) =>
    `<marker id="${id}-arrow${suffix}" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" class="qi-sp__head ${cls}"/></marker>`;
  return `<defs>${head('', '')}${head('-hot', 'qi-sp__head--hot')}${head('-deny', 'qi-sp__head--deny')}</defs>`;
}
function text(x, y, s, size, cls = '', anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="qi-label ${cls}" style="font-size:${size}px;text-anchor:${anchor}">${s}</text>`;
}
function lines(x, ys, items, size, anchor) {
  return items.map((s, i) => text(x, ys[i], s, size, '', anchor)).join('');
}
function box(x, y, w, h, cls = '', rx = 6) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="qi-frame qi-sp__node ${cls}"/>`;
}
function edge(id, d, kind = '', extra = '') {
  const suffix = kind === 'hot' ? '-hot' : kind === 'deny' ? '-deny' : '';
  const cls = kind ? `qi-sp__edge--${kind}` : '';
  return `<path d="${d}" class="qi-sp__edge ${cls} ${extra}" marker-end="url(#${id}-arrow${suffix})"/>`;
}
function frame(w, h) {
  return `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" class="qi-frame"/>`;
}
function open(w, h, cls, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="qi-svg ${cls}" role="img" aria-label="${label}">`;
}

const ROOT = 'qi-sp-pipeline';
const HOT = false;
const LABEL = 'The application sends the query to retrieval in Qdrant, then to authorization in SpiceDB, then to generation by the LLM. The authorization step is highlighted.';

/* Application -> Retrieval (Qdrant) -> Authorization (SpiceDB) -> Generation
   (LLM). The authorization step is the highlighted security boundary. */
const STEPS = [
  ['Application', 'user query', ''],
  ['Retrieval', 'Qdrant', 'qi-sp__node--qdrant'],
  ['Authorization', 'SpiceDB', 'qi-sp__node--authz'],
  ['Generation', 'LLM', ''],
];
export function svg(narrow = false, id = ROOT) {
  if (narrow) {
    let out = open(340, 360, 'qi-sp__narrow', LABEL) + defs(id) + frame(340, 360);
    STEPS.forEach(([title, sub, cls], i) => {
      const y = 16 + i * 88;
      out += box(70, y, 200, 64, cls) +
        text(170, y + 28, title, 18, 'qi-label--strong qi-sp__label') +
        text(170, y + 51, sub, 15);
      if (i < STEPS.length - 1) out += edge(id, `M170 ${y + 66} V${y + 86}`);
    });
    return out + '</svg>';
  }
  let out = open(760, 164, 'qi-sp__wide', LABEL) + defs(id) + frame(760, 164);
  STEPS.forEach(([title, sub, cls], i) => {
    const x = 16 + i * 188;
    out += box(x, 40, 166, 84, cls) +
      text(x + 83, 76, title, 18, 'qi-label--strong qi-sp__label') +
      text(x + 83, 104, sub, 16);
    if (i < STEPS.length - 1) out += edge(id, `M${x + 168} 82 H${x + 186}`);
  });
  return out + '</svg>';
}

export function mount(node) {
  node.classList.add('qi-sp', ROOT);
  const wrapper = node.closest('.island');
  // The shared loader injects CSS without waiting for it. Do not expose an
  // unstyled drawing or signal ready until this figure's stylesheet is usable.
  const stylesheet = document.querySelector(`link[href="${wrapper.dataset.islandCss}"]`);
  const render = () => {
    if (wrapper.classList.contains('is-failed')) return;
    if (getComputedStyle(node).getPropertyValue('--qi-sp-ready').trim() !== '1') {
      fail();
      return;
    }
    const id = `${ROOT}-${++instance}`;
    node.innerHTML = svg(false, `${id}-wide`) + svg(true, `${id}-narrow`);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  };
  const fail = () => node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  if (!stylesheet) fail();
  else if (stylesheet.sheet) render();
  else {
    stylesheet.addEventListener('load', render, { once: true });
    stylesheet.addEventListener('error', fail, { once: true });
  }
}
