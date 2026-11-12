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

const ROOT = 'qi-sp-arch';
const HOT = false;
const LABEL = 'The user sends a query to the application. The application gets the embedded query from the embedding model, sends it to Qdrant, and receives relevant chunks. It checks those chunks with SpiceDB with a CheckPermissionRequest and gets a CheckPermissionResponse back, then sends the query, context, and prompt to the LLM and returns the response to the user.';

/* Request flow around the application: embedding model, Qdrant, and the LLM,
   with SpiceDB checking the retrieved chunks before any reach the LLM. */
const strong = 'qi-label--strong qi-sp__label';
export function svg(narrow = false, id = ROOT) {
  if (narrow) {
    const W = 340, H = 640;
    let out = open(W, H, 'qi-sp__narrow', LABEL) + defs(id) + frame(W, H) +
      box(16, 16, 84, 44) + text(58, 44, 'User', 18, strong) +
      edge(id, 'M38 62 V108') + edge(id, 'M78 108 V62') +
      text(112, 80, '↓ query', 14, '', 'start') +
      text(112, 98, '↑ response', 14, '', 'start') +
      box(16, 110, 84, 514) +
      `<text x="58" y="367" class="qi-label qi-label--strong qi-sp__label" style="font-size:18px;text-anchor:middle" transform="rotate(-90 58 367)">Application</text>`;
    const rows = [
      ['Embedding', 'model', '', ['query'], ['embedded', 'query']],
      ['Qdrant', '', 'qi-sp__node--qdrant', ['embedded', 'query'], ['relevant', 'chunks']],
      ['SpiceDB', '', 'qi-sp__node--authz', ['Check', 'Permission', 'Request'], ['Check', 'Permission', 'Response']],
      ['LLM', '', '', ['query +', 'context +', 'prompt'], ['response']],
    ];
    rows.forEach(([a, b, cls, req, resp], i) => {
      const y = [120, 250, 390, 550][i];
      out += box(206, y, 118, 64, cls) +
        (b ? text(265, y + 28, a, 16, strong) + text(265, y + 48, b, 15) : text(265, y + 38, a, 17, strong)) +
        edge(id, `M102 ${y + 20} H204`) + edge(id, `M204 ${y + 44} H102`);
      const above = req.map((_, j) => y + 12 - (req.length - 1 - j) * 16);
      out += lines(153, above, req, 14, 'middle') +
        lines(153, resp.map((_, j) => y + 62 + j * 16), resp, 14, 'middle');
    });
    return out + '</svg>';
  }
  const W = 760, H = 372;
  let out = open(W, H, 'qi-sp__wide', LABEL) + defs(id) + frame(W, H) +
    box(16, 190, 110, 56) + text(71, 224, 'User', 20, strong) +
    edge(id, 'M128 218 H168') + text(148, 210, 'query', 14) +
    edge(id, 'M230 248 V330 H71 V250') + text(150, 322, 'response', 14) +
    box(170, 190, 574, 56) + text(457, 224, 'Application', 20, strong) +
    box(180, 20, 150, 60) + text(255, 46, 'Embedding', 18, strong) + text(255, 68, 'model', 16) +
    box(385, 20, 150, 60, 'qi-sp__node--qdrant') + text(460, 57, 'Qdrant', 18, strong) +
    box(590, 20, 150, 60) + text(665, 57, 'LLM', 18, strong) +
    edge(id, 'M210 188 V82') + lines(202, [112], ['query'], 14, 'end') +
    edge(id, 'M300 82 V188') + lines(308, [154, 170], ['embedded', 'query'], 14, 'start') +
    edge(id, 'M415 188 V82') + lines(407, [104, 120], ['embedded', 'query'], 14, 'end') +
    edge(id, 'M505 82 V188') + lines(513, [154, 170], ['relevant', 'chunks'], 14, 'start') +
    edge(id, 'M620 188 V82') + lines(612, [98, 114, 130], ['query +', 'context +', 'prompt'], 14, 'end') +
    edge(id, 'M710 82 V188') + lines(702, [162], ['response'], 14, 'end') +
    box(425, 300, 170, 56, 'qi-sp__node--authz') + text(510, 334, 'SpiceDB', 18, strong) +
    edge(id, 'M455 248 V298') + lines(447, [270, 286], ['CheckPermission', 'Request'], 14, 'end') +
    edge(id, 'M565 298 V248') + lines(573, [270, 286], ['CheckPermission', 'Response'], 14, 'start');
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
