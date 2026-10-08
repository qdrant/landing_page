/*
 * rings island: interactive replacement for io-uring.png.
 *
 * io_uring gives the application and the kernel two ring buffers in shared memory:
 *   Submission queue:  the application writes requests at the tail, the kernel reads
 *                      them from the head.
 *   Completion queue:  the kernel writes responses at the tail, the application reads
 *                      them from the head.
 * Between the two, the kernel works on requests it has taken ("in flight"). Step a
 * request around the loop with the four actions. Each request keeps its label.
 */

const NS = 'http://www.w3.org/2000/svg';
const SLOTS = 8;
const MAX_FLIGHT = 6;

const WIDE = {
  W: 760, H: 420, cy: 200, cx: [190, 570], ro: 105, ri: 62, mr: 119, mk: 10,
  box: { x: 320, y: 238, w: 120, h: 108, labelY: 262, rowY: [274, 304] },
  appY: 26, kernelY: 372, divider: [20, 740],
  legend: [{ y: 406, text: 'H = head, the next slot to read        T = tail, the next slot to write' }],
  names: ['Submission', 'queue', 'Completion', 'queue'],
};
const NARROW = {
  W: 340, H: 392, cy: 125, cx: [98, 242], ro: 66, ri: 40, mr: 76, mk: 9,
  box: { x: 110, y: 215, w: 120, h: 90, labelY: 236, rowY: [246, 274] },
  appY: 22, kernelY: 326, divider: [8, 332],
  legend: [
    { y: 350, text: 'SQ submission queue, CQ completion queue' },
    { y: 368, text: 'H head: next slot to read' },
    { y: 386, text: 'T tail: next slot to write' },
  ],
  names: ['SQ', '', 'CQ', ''],
};

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

function watchNarrow(node, onChange, below = 700) {
  const is = () => {
    const w = node.getBoundingClientRect().width;
    return w > 0 && w < below;
  };
  let narrow = is();
  node.classList.toggle('iu-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('iu-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

const rad = (deg) => (deg * Math.PI) / 180;
const slotAngle = (i) => rad(-90 + i * (360 / SLOTS));
function sector(cx, cy, ri, ro, i) {
  const half = 360 / SLOTS / 2;
  const a0 = slotAngle(i) - rad(half);
  const a1 = slotAngle(i) + rad(half);
  const pt = (r, a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return `M${pt(ro, a0)} A${ro} ${ro} 0 0 1 ${pt(ro, a1)} L${pt(ri, a1)} A${ri} ${ri} 0 0 0 ${pt(ri, a0)} Z`;
}

const fresh = () => ({
  sq: [1, 2, 3, null, null, null, null, null], sqHead: 0, sqTail: 3,
  cq: Array(SLOTS).fill(null), cqHead: 0, cqTail: 0,
  flight: [], next: 4,
});
const count = (ring) => ring.filter((x) => x != null).length;
const label = (id) => `R${id}`;

export function mount(node) {
  node.classList.add('iu-rg');
  const ACTIONS = [
    { id: 'submit', text: 'App submits' },
    { id: 'take', text: 'Kernel takes' },
    { id: 'complete', text: 'Kernel completes' },
    { id: 'reap', text: 'App reaps' },
  ];
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step a request">',
    ACTIONS.map((a) => `<button type="button" class="qi-chip" data-act="${a.id}">${a.text}</button>`).join(''),
    '      <button type="button" class="qi-chip" data-act="reset">Reset</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 420" role="img" aria-label="Two ring buffers shared by an application and the kernel: the submission queue, written by the application and read by the kernel, and the completion queue, written by the kernel and read by the application.">',
    '    <g class="iu-rg__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 iu-rg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.iu-rg__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.iu-rg__status');
  const buttons = Object.fromEntries([...node.querySelectorAll('[data-act]')].map((b) => [b.dataset.act, b]));
  const isNarrow = watchNarrow(node, () => render());
  let s = fresh();
  let message = 'The application and the kernel share two ring buffers. Step a request around the loop: the application can keep submitting while earlier requests are still being served.';

  function head(x, y, dir) {
    const pts = {
      right: `${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}`,
      up: `${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}`,
    }[dir];
    g.appendChild(el('polygon', { class: 'iu-rg__head', points: pts }));
  }

  function ring(L, which, arr, headIdx, tailIdx, cls) {
    const cx = L.cx[which];
    arr.forEach((id, i) => {
      g.appendChild(el('path', { class: `iu-rg__slot${id != null ? ` ${cls}` : ''}`, d: sector(cx, L.cy, L.ri, L.ro, i) }));
      if (id != null) {
        const a = slotAngle(i);
        const r = (L.ri + L.ro) / 2;
        g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: cx + r * Math.cos(a), y: L.cy + r * Math.sin(a) + 5, 'text-anchor': 'middle' }, label(id)));
      }
    });
    const name = which === 0 ? L.names.slice(0, 2) : L.names.slice(2);
    name.forEach((line, k) => {
      if (line) g.appendChild(el('text', { class: 'qi-title', x: cx, y: L.cy + (name[1] ? -2 + k * 18 : 5), 'text-anchor': 'middle' }, line));
    });
    const mark = (idx, letter, kind, shift) => {
      const a = slotAngle(idx);
      const mx = cx + L.mr * Math.cos(a) - shift * Math.sin(a);
      const my = L.cy + L.mr * Math.sin(a) + shift * Math.cos(a);
      g.appendChild(el('circle', { class: `iu-rg__mark is-${kind}`, cx: mx, cy: my, r: L.mk }));
      g.appendChild(el('text', { class: `iu-rg__letter is-${kind}`, x: mx, y: my + 5, 'text-anchor': 'middle' }, letter));
    };
    const shift = headIdx === tailIdx ? L.mk + 2 : 0;
    mark(headIdx, 'H', 'head', -shift);
    mark(tailIdx, 'T', 'tail', shift);
  }

  function render() {
    const L = isNarrow() ? NARROW : WIDE;
    svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
    g.replaceChildren();
    g.appendChild(el('line', { class: 'iu-rg__divider', x1: L.divider[0], y1: L.cy, x2: L.divider[1], y2: L.cy }));
    g.appendChild(el('text', { class: 'qi-title', x: L.W / 2, y: L.appY, 'text-anchor': 'middle' }, 'APPLICATION'));
    g.appendChild(el('text', { class: 'qi-title', x: L.W / 2, y: L.kernelY, 'text-anchor': 'middle' }, 'KERNEL'));
    ring(L, 0, s.sq, s.sqHead, s.sqTail, 'is-queued');
    ring(L, 1, s.cq, s.cqHead, s.cqTail, 'is-done');

    const b = L.box;
    g.appendChild(el('rect', { class: 'qi-frame', x: b.x, y: b.y, width: b.w, height: b.h, rx: 8 }));
    g.appendChild(el('text', { class: 'qi-label', x: b.x + b.w / 2, y: b.labelY, 'text-anchor': 'middle' }, 'In flight'));
    s.flight.forEach((id, i) => {
      const x = b.x + (b.w - 110) / 2 + (i % 3) * 38;
      const y = b.rowY[Math.floor(i / 3)];
      g.appendChild(el('rect', { class: 'iu-rg__slot is-flight', x, y, width: 34, height: 24, rx: 4 }));
      g.appendChild(el('text', { class: 'qi-label qi-label--strong', x: x + 17, y: y + 17, 'text-anchor': 'middle' }, label(id)));
    });
    if (L === WIDE) {
      const y = 292;
      g.appendChild(el('path', { class: 'iu-rg__flow', d: `M246 ${y} H${b.x - 8}` }));
      head(b.x - 1, y, 'right');
      g.appendChild(el('path', { class: 'iu-rg__flow', d: `M${b.x + b.w + 2} ${y} H506` }));
      head(514, y, 'right');
    } else {
      g.appendChild(el('path', { class: 'iu-rg__flow', d: `M${L.cx[0]} 199 V257 H${b.x - 9}` }));
      head(b.x - 1, 257, 'right');
      g.appendChild(el('path', { class: 'iu-rg__flow', d: `M${b.x + b.w + 1} 257 H${L.cx[1]} V208` }));
      head(L.cx[1], 197, 'up');
    }
    L.legend.forEach((l) => g.appendChild(el('text', { class: 'qi-label iu-rg__legend', x: L.W / 2, y: l.y, 'text-anchor': 'middle' }, l.text)));

    buttons.submit.disabled = count(s.sq) >= SLOTS;
    buttons.take.disabled = count(s.sq) === 0 || s.flight.length >= MAX_FLIGHT;
    buttons.complete.disabled = s.flight.length === 0 || count(s.cq) >= SLOTS;
    buttons.reap.disabled = count(s.cq) === 0;
    statusEl.textContent = `${message} ${count(s.sq)} queued, ${s.flight.length} in flight, ${count(s.cq)} completed.`;
  }

  const step = {
    submit() {
      const id = s.next;
      s.sq[s.sqTail] = id;
      s.sqTail = (s.sqTail + 1) % SLOTS;
      s.next = (s.next % 99) + 1;
      return `The application put ${label(id)} at the tail of the submission queue.`;
    },
    take() {
      const id = s.sq[s.sqHead];
      s.sq[s.sqHead] = null;
      s.sqHead = (s.sqHead + 1) % SLOTS;
      s.flight.push(id);
      return `The kernel took ${label(id)} from the head of the submission queue and started the disk read.`;
    },
    complete() {
      const id = s.flight.shift();
      s.cq[s.cqTail] = id;
      s.cqTail = (s.cqTail + 1) % SLOTS;
      return `The read for ${label(id)} finished, so the kernel put its response at the tail of the completion queue.`;
    },
    reap() {
      const id = s.cq[s.cqHead];
      s.cq[s.cqHead] = null;
      s.cqHead = (s.cqHead + 1) % SLOTS;
      return `The application consumed the response for ${label(id)} from the head of the completion queue.`;
    },
    reset() {
      s = fresh();
      return 'Back to the start: three requests are queued.';
    },
  };
  Object.keys(buttons).forEach((id) => {
    buttons[id].addEventListener('click', () => {
      message = step[id]();
      render();
    });
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
