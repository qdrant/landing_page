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

const ROOT = 'qi-sp-check';
const HOT = false;
const LABEL = 'Two permission checks for Bob. Doc 001 has the Sales department as a viewer, and Bob is a member of Sales, so a path reaches Bob and access is allowed. Doc 002 has the Engineering department as a viewer, and Bob is not a member of Engineering, so there is no path and access is denied.';

/* Two CheckPermission walks for user:bob. Doc 001 is shared with
   sales#member, so a path reaches Bob. Doc 002 is shared with
   engineering#member, which does not include Bob. Full IDs and API result
   names live in the surrounding text. */
const CHECKS = [
  { doc: 'Doc 001', dept: 'Sales', ok: true },
  { doc: 'Doc 002', dept: 'Engineering', ok: false },
];
const strong = 'qi-label--strong qi-sp__label';
function cross(x, y) {
  return `<circle cx="${x}" cy="${y}" r="8" class="qi-sp__cross"/>` +
    `<path d="M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x + 3.5} ${y - 3.5} L${x - 3.5} ${y + 3.5}" class="qi-sp__edge qi-sp__edge--deny" style="stroke-dasharray:none"/>`;
}
function bob(x, y, w, h, ok) {
  return box(x, y, w, h, ok ? 'qi-sp__node--hot' : 'qi-sp__dashed qi-sp__dim') +
    text(x + w / 2, y + h / 2 + 6, 'Bob', 17, ok ? strong : 'qi-sp__dim');
}
function result(x, y, w, h, ok) {
  return box(x, y, w, h, ok ? 'qi-sp__node--hot' : 'qi-sp__node--deny') +
    text(x + w / 2, y + h / 2 + 6, ok ? 'Allowed' : 'Denied', 17, 'qi-label--strong');
}
export function svg(narrow = false, id = ROOT) {
  if (narrow) {
    const W = 340, H = 322;
    let out = open(W, H, 'qi-sp__narrow', LABEL) + defs(id) + frame(W, H);
    CHECKS.forEach((c, col) => {
      const x = 16 + col * 162, w = 146, cx = x + w / 2, k = c.ok ? 'hot' : '';
      out += box(x, 16, w, 40) + text(cx, 42, c.doc, 17, strong) +
        edge(id, `M${cx} 58 V96`, k) + text(cx + 14, 82, 'viewer', 14, '', 'start') +
        box(x, 98, w, 40) + text(cx, 124, c.dept, 17, strong) +
        edge(id, `M${cx} 140 V178`, c.ok ? 'hot' : 'deny') + text(cx + 14, 164, 'member', 14, '', 'start') +
        (c.ok ? '' : cross(cx, 159)) +
        bob(x, 180, w, 40, c.ok) +
        edge(id, `M${cx} 222 V260`, c.ok ? 'hot' : 'deny') +
        result(x, 262, w, 44, c.ok);
    });
    return out + '</svg>';
  }
  const W = 760, H = 236;
  let out = open(W, H, 'qi-sp__wide', LABEL) + defs(id) + frame(W, H);
  CHECKS.forEach((c, row) => {
    const y0 = 34 + row * 108, y = y0 + 14, mid = y + 24, k = c.ok ? 'hot' : '';
    out += text(24, y0, `Can Bob view ${c.doc}?`, 15, 'qi-sp__kicker', 'start') +
      box(24, y, 130, 48) + text(89, mid + 6, c.doc, 18, strong) +
      edge(id, `M156 ${mid} H254`, k) + text(205, mid - 13, 'viewer', 14) +
      box(256, y, 150, 48) + text(331, mid + 6, c.dept, 18, strong) +
      edge(id, `M408 ${mid} H506`, c.ok ? 'hot' : 'deny') + text(457, mid - 13, 'member', 14) +
      (c.ok ? '' : cross(457, mid)) +
      bob(508, y, 90, 48, c.ok) +
      edge(id, `M600 ${mid} H622`, c.ok ? 'hot' : 'deny') +
      result(624, y, 120, 48, c.ok);
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
