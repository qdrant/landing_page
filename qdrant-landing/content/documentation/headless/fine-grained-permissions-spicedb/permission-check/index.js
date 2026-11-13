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
const LABEL = 'Two permission checks for user bob. For engineering-architecture-001, the path goes through viewer to the sales department and through member to bob, so the result is PERMISSIONSHIP_HAS_PERMISSION. For engineering-architecture-002, the path goes through viewer to the engineering department, but its member relation does not reach bob, so the result is PERMISSIONSHIP_NO_PERMISSION.';

/* Two CheckPermission walks for user:bob. engineering-architecture-001 is
   shared with sales#member, so a path reaches Bob. engineering-architecture-002
   is shared with engineering#member, which does not include Bob. */
const CHECKS = [
  { doc: 'eng-arch-001', full: 'document:engineering-architecture-001', dept: 'sales', ok: true },
  { doc: 'eng-arch-002', full: 'document:engineering-architecture-002', dept: 'engineering', ok: false },
];
const strong = 'qi-label--strong qi-sp__label';
function cross(x, y) {
  return `<circle cx="${x}" cy="${y}" r="8" class="qi-sp__cross"/>` +
    `<path d="M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x + 3.5} ${y - 3.5} L${x - 3.5} ${y + 3.5}" class="qi-sp__edge qi-sp__edge--deny" style="stroke-dasharray:none"/>`;
}
export function svg(narrow = false, id = ROOT) {
  if (narrow) {
    let out = open(340, 356, 'qi-sp__narrow', LABEL) + defs(id) + frame(340, 356);
    CHECKS.forEach((c, col) => {
      const x = 16 + col * 162;
      const cx = x + 70;
      const k = c.ok ? 'hot' : '';
      const ys = [16, 70, 124, 178, 232];
      const items = [[c.doc, 6], ['viewer', 18], [c.dept, 6], ['member', 18], ['bob', 6]];
      items.forEach(([label, rx], i) => {
        const y = ys[i];
        const last = i === items.length - 1;
        const cls = last ? (c.ok ? 'qi-sp__node--hot' : 'qi-sp__dashed qi-sp__dim') : (rx > 6 ? 'qi-sp__node--rel' : '');
        out += box(x, y, 140, 36, cls, rx) + text(cx, y + 23, label, 15, last && !c.ok ? 'qi-sp__dim' : strong);
        if (i < items.length - 1) {
          const broken = !c.ok && i === items.length - 2;
          out += edge(id, `M${cx} ${y + 38} V${ys[i + 1] - 2}`, broken ? 'deny' : k);
          if (broken) out += cross(cx, y + 45);
        }
      });
      out += edge(id, `M${cx} 270 V288`, c.ok ? 'hot' : 'deny') +
        box(x, 290, 140, 52, c.ok ? 'qi-sp__node--hot' : 'qi-sp__node--deny') +
        text(cx, 311, 'PERMISSIONSHIP_', 14, 'qi-label--strong') +
        text(cx, 330, c.ok ? 'HAS_PERMISSION' : 'NO_PERMISSION', 14, 'qi-label--strong');
    });
    return out + '</svg>';
  }
  let out = open(760, 404, 'qi-sp__wide', LABEL) + defs(id) + frame(760, 404);
  CHECKS.forEach((c, row) => {
    const y0 = 34 + row * 196;
    const k = c.ok ? 'hot' : '';
    const y = y0 + 40;
    const mid = y + 24;
    out += text(16, y0, `CHECK ${c.full} · view · user:bob`, 15, 'qi-sp__kicker', 'start') +
      text(16, y0 + 30, 'DOCUMENT', 14, 'qi-sp__kicker', 'start') +
      text(352, y0 + 30, 'DEPARTMENT', 14, 'qi-sp__kicker', 'start') +
      text(668, y0 + 30, 'USER', 14, 'qi-sp__kicker', 'start') +
      box(16, y, 170, 48) + text(101, mid + 6, c.doc, 18, strong) +
      edge(id, `M188 ${mid} H212`, k) +
      box(214, y, 110, 48, 'qi-sp__node--rel', 24) + text(269, mid + 6, 'viewer', 18, strong) +
      edge(id, `M326 ${mid} H350`, k) +
      box(352, y, 150, 48) + text(427, mid + 6, c.dept, 18, strong) +
      edge(id, `M504 ${mid} H528`, k) +
      box(530, y, 110, 48, 'qi-sp__node--rel', 24) + text(585, mid + 6, 'member', 18, strong);
    if (c.ok) {
      out += edge(id, `M642 ${mid} H666`, 'hot') +
        box(668, y, 76, 48, 'qi-sp__node--hot') + text(706, mid + 6, 'bob', 18, strong) +
        edge(id, `M706 ${y + 50} V${y + 76}`, 'hot') +
        text(698, y + 68, 'path found', 14, '', 'end') +
        box(400, y + 78, 344, 40, 'qi-sp__node--hot') +
        text(572, y + 104, 'PERMISSIONSHIP_HAS_PERMISSION', 16, 'qi-label--strong');
    } else {
      out += edge(id, `M642 ${mid} H666`, 'deny') + cross(654, mid) +
        box(668, y, 76, 48, 'qi-sp__dashed qi-sp__dim') + text(706, mid + 6, 'bob', 18, 'qi-sp__dim') +
        edge(id, `M706 ${y + 50} V${y + 76}`, 'deny') +
        text(698, y + 68, 'no path', 14, '', 'end') +
        box(400, y + 78, 344, 40, 'qi-sp__node--deny') +
        text(572, y + 104, 'PERMISSIONSHIP_NO_PERMISSION', 16, 'qi-label--strong');
    }
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
