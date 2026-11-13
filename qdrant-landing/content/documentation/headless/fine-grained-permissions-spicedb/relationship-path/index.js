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

const ROOT = 'qi-sp-path';
const HOT = true;
const LABEL = 'The same relationship graph with the path highlighted from somedocument to its reader relation, through the includes edge to writer, and on to user alice. Users bob and carol are dimmed.';

/* Relationship graph for document:somedocument. With HOT, the path that lets
   Alice read the document is highlighted and the other users are dimmed. */
export function svg(narrow = false, id = ROOT) {
  const hot = (yes) => (HOT && yes ? 'hot' : '');
  const node = (yes) => (HOT && yes ? 'qi-sp__node--hot' : '');
  const dim = HOT ? 'qi-sp__dim' : '';
  if (narrow) {
    return open(340, 360, 'qi-sp__narrow', LABEL) + defs(id) + frame(340, 360) +
      text(70, 30, 'DOCUMENT', 14, 'qi-sp__kicker', 'start') +
      box(70, 40, 200, 52, node(true)) +
      text(170, 72, 'somedocument', 18, 'qi-label--strong qi-sp__label') +
      edge(id, 'M130 94 C130 130 81 124 81 158', hot(true)) +
      edge(id, 'M210 94 C210 130 259 124 259 158') +
      box(16, 160, 130, 44, `qi-sp__node--rel ${node(true)}`, 22) +
      text(81, 188, 'reader', 18, 'qi-label--strong qi-sp__label') +
      box(194, 160, 130, 44, `qi-sp__node--rel ${node(true)}`, 22) +
      text(259, 188, 'writer', 18, 'qi-label--strong qi-sp__label') +
      edge(id, 'M148 182 H192', hot(true), 'qi-sp__dashed') +
      text(170, 150, 'includes', 15) +
      text(16, 290, 'USERS', 14, 'qi-sp__kicker', 'start') +
      `<g class="${dim}">` +
      edge(id, 'M96 206 V298') +
      edge(id, 'M130 206 C130 250 170 250 170 298') +
      box(16, 300, 96, 44) + text(64, 328, 'bob', 18, 'qi-label--strong qi-sp__label') +
      box(122, 300, 96, 44) + text(170, 328, 'carol', 18, 'qi-label--strong qi-sp__label') +
      '</g>' +
      edge(id, 'M276 206 V298', hot(true)) +
      box(228, 300, 96, 44, node(true)) + text(276, 328, 'alice', 18, 'qi-label--strong qi-sp__label') +
      '</svg>';
  }
  return open(760, 300, 'qi-sp__wide', LABEL) + defs(id) + frame(760, 300) +
    text(40, 186, 'DOCUMENT', 15, 'qi-sp__kicker', 'start') +
    box(40, 196, 200, 56, node(true)) +
    text(140, 231, 'somedocument', 20, 'qi-label--strong qi-sp__label') +
    edge(id, 'M242 210 C286 210 286 84 328 84', hot(true)) +
    edge(id, 'M242 236 H328') +
    box(330, 60, 150, 48, `qi-sp__node--rel ${node(true)}`, 24) +
    text(405, 91, 'reader', 20, 'qi-label--strong qi-sp__label') +
    box(330, 212, 150, 48, `qi-sp__node--rel ${node(true)}`, 24) +
    text(405, 243, 'writer', 20, 'qi-label--strong qi-sp__label') +
    edge(id, 'M405 110 V210', hot(true), 'qi-sp__dashed') +
    text(417, 165, 'includes', 16, '', 'start') +
    text(580, 30, 'USERS', 15, 'qi-sp__kicker', 'start') +
    `<g class="${dim}">` +
    edge(id, 'M482 76 C530 76 530 64 578 64') +
    edge(id, 'M482 92 C530 92 530 132 578 132') +
    box(580, 40, 150, 48) + text(655, 71, 'bob', 20, 'qi-label--strong qi-sp__label') +
    box(580, 108, 150, 48) + text(655, 139, 'carol', 20, 'qi-label--strong qi-sp__label') +
    '</g>' +
    edge(id, 'M482 236 H578', hot(true)) +
    box(580, 212, 150, 48, node(true)) + text(655, 243, 'alice', 20, 'qi-label--strong qi-sp__label') +
    '</svg>';
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
