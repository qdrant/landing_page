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
const LABEL = 'The user asks the application a question. The application runs four numbered steps in order: 1, embed the query with the embedding model; 2, retrieve candidate documents from Qdrant; 3, check access in SpiceDB; 4, generate the answer with the LLM from the allowed documents only. Step 5 returns the answer to the user.';

/* The four services sit in one row in the order the application calls them,
   so the reader sees that the SpiceDB check (3) comes before the LLM (4).
   Data and API names live in the surrounding text, not on the arrows. */
const strong = 'qi-label--strong qi-sp__label';
function step(x, y, n) {
  return `<circle cx="${x}" cy="${y}" r="11" class="qi-sp__step"/>` +
    `<text x="${x}" y="${y + 5}" class="qi-label qi-sp__step-num" style="font-size:14px;text-anchor:middle">${n}</text>`;
}
/* Badge plus verb, centered on cx. Geist Mono advances 0.6em per glyph. */
function stepLabel(cx, y, n, verb) {
  const w = 28 + verb.length * 9;
  const x0 = cx - w / 2;
  return step(x0 + 11, y - 5, n) + text(x0 + 28, y, verb, 15, strong, 'start');
}
const SERVICES = [
  ['Embedding', 'model', '', 'Embed'],
  ['Qdrant', '', 'qi-sp__node--qdrant', 'Retrieve'],
  ['SpiceDB', '', 'qi-sp__node--authz', 'Check access'],
  ['LLM', '', '', 'Generate'],
];
function service(cx, y, w, h, [a, b, cls]) {
  return box(cx - w / 2, y, w, h, cls) +
    (b ? text(cx, y + h / 2 - 2, a, 17, strong) + text(cx, y + h / 2 + 17, b, 14)
       : text(cx, y + h / 2 + 6, a, 18, strong));
}
export function svg(narrow = false, id = ROOT) {
  if (narrow) {
    const W = 340, H = 500;
    let out = open(W, H, 'qi-sp__narrow', LABEL) + defs(id) + frame(W, H) +
      box(16, 16, 84, 44) + text(58, 44, 'User', 18, strong) +
      edge(id, 'M38 62 V104') + edge(id, 'M78 104 V62') +
      step(122, 83, 5) + text(140, 88, 'Answer', 15, strong, 'start') +
      box(16, 106, 84, 378) +
      `<text x="58" y="295" class="qi-label qi-label--strong qi-sp__label" style="font-size:18px;text-anchor:middle" transform="rotate(-90 58 295)">Application</text>`;
    SERVICES.forEach((s, i) => {
      const y = 130 + i * 96;
      out += stepLabel(265, y - 10, i + 1, s[3]) +
        service(265, y, 118, 56, s) +
        edge(id, `M102 ${y + 18} H204`) + edge(id, `M204 ${y + 38} H102`);
    });
    return out + '</svg>';
  }
  const W = 760, H = 304;
  let out = open(W, H, 'qi-sp__wide', LABEL) + defs(id) + frame(W, H) +
    box(16, 178, 92, 56) + text(62, 212, 'User', 20, strong) +
    edge(id, 'M110 206 H134') +
    edge(id, 'M180 236 V282 H62 V238') + step(98, 266, 5) + text(116, 271, 'Answer', 15, strong, 'start') +
    box(136, 178, 608, 56) + text(440, 212, 'Application', 20, strong);
  SERVICES.forEach((s, i) => {
    const cx = 201 + i * 159;
    out += stepLabel(cx, 30, i + 1, s[3]) +
      service(cx, 44, 130, 56, s) +
      edge(id, `M${cx - 16} 176 V102`) + edge(id, `M${cx + 16} 102 V176`);
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
