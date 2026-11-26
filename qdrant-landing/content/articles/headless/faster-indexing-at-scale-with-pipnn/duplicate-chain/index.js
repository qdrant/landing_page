/*
 * duplicate-chain island: identical vectors in the PiPNN graph.
 *
 * Only the first copy (c1) takes part in the build. The other copies are
 * chained behind it, the last one links back to c1, and every copy carries
 * c1's real neighbors. The five copies and the neighbors n1 to n3 are
 * illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const COPIES = 5;
const X0 = 150;
const PITCH = 118;
const BOX_W = 64;
const BOX_Y = 96;
const BOX_H = 48;
const CARD_Y = 196;

let instanceId = 0;

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  const uid = ++instanceId;
  node.classList.add('pn-dc');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <svg class="qi-svg" viewBox="0 0 760 244" role="img"></svg>',
    '</div>',
  ].join('');

  const svg = node.querySelector('svg');

  const marker = (id, cls) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path class="${cls}" d="M0 0L10 5L0 10Z"/></marker>`;
  const ids = { fg: `pn-dc-fg-${uid}`, blue: `pn-dc-blue-${uid}`, muted: `pn-dc-muted-${uid}` };

  function render(n) {
    svg.replaceChildren();
    svg.setAttribute(
      'aria-label',
      `${n} identical vectors c1 to c${n}. Only c1 is in the main graph. The copies are chained after it, the last links back to c1, and every copy points to c1's real neighbors.`,
    );
    svg.appendChild(el('defs', {})).innerHTML = marker(ids.fg, 'pn-dc__head pn-dc__head--fg') + marker(ids.blue, 'pn-dc__head pn-dc__head--blue') + marker(ids.muted, 'pn-dc__head pn-dc__head--muted');
    svg.appendChild(el('text', { class: 'pn-dc__text', x: 0, y: 16 }, 'Identical vectors: one copy in the graph, the rest chained'));

    const xs = Array.from({ length: n }, (_, i) => X0 + i * PITCH);
    const right = xs[n - 1] + BOX_W;

    // Incoming edges from the rest of the graph reach c1 only.
    svg.appendChild(el('rect', { class: 'qi-frame', x: 0, y: BOX_Y, width: 110, height: BOX_H, rx: 8 }));
    svg.appendChild(el('text', { class: 'pn-dc__text', x: 55, y: BOX_Y + 29, 'text-anchor': 'middle' }, 'Other points'));
    svg.appendChild(el('line', { class: 'pn-dc__link pn-dc__link--fg', x1: 110, y1: BOX_Y + 24, x2: X0 - 4, y2: BOX_Y + 24, 'marker-end': `url(#${ids.fg})` }));

    // Neighbors card and dotted arrows from every copy.
    const cardW = Math.max(300, right - X0);
    svg.appendChild(el('rect', { class: 'qi-frame', x: X0, y: CARD_Y, width: cardW, height: 40, rx: 8 }));
    svg.appendChild(el('text', { class: 'pn-dc__text', x: X0 + cardW / 2, y: CARD_Y + 25, 'text-anchor': 'middle' }, 'Real neighbors of c1 (n1, n2, n3)'));

    xs.forEach((x, i) => {
      svg.appendChild(el('line', { class: 'pn-dc__link pn-dc__link--dotted', x1: x + BOX_W / 2, y1: BOX_Y + BOX_H, x2: x + BOX_W / 2, y2: CARD_Y - 3, 'marker-end': `url(#${ids.muted})` }));
      if (i < n - 1) {
        svg.appendChild(el('line', { class: 'pn-dc__link pn-dc__link--blue', x1: x + BOX_W, y1: BOX_Y + 24, x2: xs[i + 1] - 4, y2: BOX_Y + 24, 'marker-end': `url(#${ids.blue})` }));
      }
    });
    xs.forEach((x, i) => {
      svg.appendChild(el('rect', { class: `pn-dc__box${i === 0 ? ' pn-dc__box--main' : ''}`, x, y: BOX_Y, width: BOX_W, height: BOX_H, rx: 8 }));
      svg.appendChild(el('text', { class: `pn-dc__strong${i === 0 ? ' pn-dc__strong--main' : ' pn-dc__strong--copy'}`, x: x + BOX_W / 2, y: BOX_Y + 30, 'text-anchor': 'middle' }, `c${i + 1}`));
    });

    // The last copy links back to c1.
    const lx = xs[n - 1] + BOX_W / 2;
    const fx = xs[0] + BOX_W / 2;
    svg.appendChild(el('path', { class: 'pn-dc__link pn-dc__link--blue pn-dc__link--back', d: `M${lx},${BOX_Y - 2} C${lx},46 ${fx},46 ${fx},${BOX_Y - 6}`, 'marker-end': `url(#${ids.blue})` }));
    svg.appendChild(el('text', { class: 'pn-dc__text', x: (lx + fx) / 2, y: 40, 'text-anchor': 'middle' }, `last copy (c${n}) links back to c1`));

  }

  render(COPIES);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
