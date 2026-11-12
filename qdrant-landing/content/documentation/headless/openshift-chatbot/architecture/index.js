/*
 * architecture island: interactive replacement for openshift-diagram.png in
 * the "Private Chatbot for Interactive Learning" tutorial.
 *
 * Shows the containers that run on Red Hat OpenShift (Qdrant Hybrid Cloud, the
 * Haystack application with Hayhooks, and the model server) and lets the
 * reader step through indexing and the four stages of answering a question.
 * The links used at the selected stage are highlighted.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Two
 * layouts: a wide one (containers side by side) and a narrow one (flow from
 * top to bottom) so labels stay readable on phones.
 */

const NS = 'http://www.w3.org/2000/svg';
const WIDE_MIN = 560; // container px at which the wide layout keeps text >= 12px

const STEPS = [
  {
    label: 'Indexing',
    edges: ['hs_qd'],
    nodes: ['haystack', 'qdrant'],
    text: '<b>Indexing</b> runs offline, in batches. The Haystack application embeds the course chunks and writes them to Qdrant Hybrid Cloud. Nothing leaves the cluster.',
  },
  {
    label: '1 Question',
    edges: ['us_hh', 'hh_hs'],
    nodes: ['users', 'hayhooks', 'haystack'],
    text: '<b>1. Question.</b> A user sends a question to the HTTP endpoint that Hayhooks exposes. Hayhooks hands it to the search pipeline in the Haystack application.',
  },
  {
    label: '2 Retrieve',
    edges: ['hs_qd'],
    nodes: ['haystack', 'qdrant'],
    text: '<b>2. Retrieve.</b> The pipeline embeds the question and asks Qdrant Hybrid Cloud for the most similar chunks.',
  },
  {
    label: '3 Generate',
    edges: ['hs_llm'],
    nodes: ['haystack', 'llm'],
    text: '<b>3. Generate.</b> The pipeline builds a prompt from the chunks and the question and sends it to the model server, which runs Mistral-7B-Instruct-v0.1.',
  },
  {
    label: '4 Answer',
    edges: ['hs_llm', 'hh_hs', 'us_hh'],
    nodes: ['llm', 'haystack', 'hayhooks', 'users'],
    text: '<b>4. Answer.</b> The reply travels back through the Haystack application and Hayhooks to the user. Documents, questions, and answers stay inside the OpenShift cluster.',
  },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// Geometry for both layouts (viewBox units).
function layoutFor(wide) {
  if (wide) {
    return {
      vb: [0, 0, 680, 330],
      frame: { x: 0.5, y: 0.5, w: 679, h: 270, label: { x: 16, y: 26 } },
      containers: [
        { x: 16, y: 70, w: 150, h: 150 },
        { x: 256, y: 50, w: 160, h: 200 },
        { x: 506, y: 70, w: 150, h: 150 },
      ],
      nodes: {
        qdrant: { x: 28, y: 112, w: 126, h: 64, c: 'qd', lines: ['Qdrant Hybrid', 'Cloud'] },
        haystack: { x: 266, y: 84, w: 140, h: 56, c: 'hs', lines: ['Haystack', 'application'] },
        hayhooks: { x: 266, y: 172, w: 140, h: 56, c: 'hh', lines: ['Hayhooks'] },
        llm: { x: 518, y: 106, w: 126, h: 64, c: 'llm', lines: ['Mistral-7B-', 'Instruct-v0.1'] },
        users: { x: 306, y: 288, w: 60, h: 40, c: 'us', person: true, lines: [] },
      },
      edges: {
        hs_qd: { d: 'M266 112 H156', label: { x: 211, y: 104, a: 'middle', t: 'retrieve' } },
        hs_llm: { d: 'M406 112 H516', label: { x: 461, y: 104, a: 'middle', t: 'generate' } },
        hh_hs: { d: 'M336 172 V142' },
        us_hh: { d: 'M336 228 V286', label: { x: 346, y: 266, a: 'start', t: 'HTTP API' } },
      },
      captions: [
        { x: 26, y: 90, t: 'Container' },
        { x: 266, y: 70, t: 'Container' },
        { x: 516, y: 90, t: 'Container' },
      ],
    };
  }
  return {
    vb: [0, 0, 360, 424],
    frame: { x: 0.5, y: 70.5, w: 359, h: 352, label: { x: 12, y: 92 } },
    containers: [
      { x: 16, y: 292, w: 150, h: 112 },
      { x: 70, y: 100, w: 220, h: 140 },
      { x: 194, y: 292, w: 150, h: 112 },
    ],
    nodes: {
      users: { x: 150, y: 0, w: 60, h: 40, c: 'us', person: true, lines: [] },
      hayhooks: { x: 90, y: 124, w: 180, h: 44, c: 'hh', lines: ['Hayhooks'] },
      haystack: { x: 90, y: 188, w: 180, h: 44, c: 'hs', lines: ['Haystack application'] },
      qdrant: { x: 26, y: 322, w: 130, h: 64, c: 'qd', lines: ['Qdrant Hybrid', 'Cloud'] },
      llm: { x: 204, y: 322, w: 130, h: 64, c: 'llm', lines: ['Mistral-7B-', 'Instruct-v0.1'] },
    },
    edges: {
      us_hh: { d: 'M180 42 V122', label: { x: 190, y: 82, a: 'start', t: 'HTTP API' } },
      hh_hs: { d: 'M180 168 V186' },
      hs_qd: { d: 'M140 232 V270 H91 V320', label: { x: 134, y: 262, a: 'end', t: 'retrieve' } },
      hs_llm: { d: 'M220 232 V270 H269 V320', label: { x: 226, y: 262, a: 'start', t: 'generate' } },
    },
    captions: [
      { x: 26, y: 312, t: 'Container' },
      { x: 80, y: 118, t: 'Container' },
      { x: 204, y: 312, t: 'Container' },
    ],
  };
}

export function mount(node) {
  node.classList.add('qi-oa');
  const uid = Math.random().toString(36).slice(2, 7);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Step">',
    STEPS.map((s, i) => `<button type="button" class="qi-chip qi-oa__step" data-step="${i}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-oa__svg" role="img" aria-label="Architecture on Red Hat OpenShift. Users call Hayhooks, which serves the search pipeline of the Haystack application. The Haystack application talks to Qdrant Hybrid Cloud to index and retrieve documents, and to the model server running Mistral-7B-Instruct-v0.1 to generate answers. All of them run in separate containers on the same OpenShift cluster."></svg>',
    '  <p class="qi-status qi-oa__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-oa__svg');
  const statusEl = node.querySelector('.qi-oa__status');
  const stepBtns = [...node.querySelectorAll('.qi-oa__step')];

  let step = 0;
  let layout = '';
  let nodes = {};
  let edges = {};

  function build() {
    svg.replaceChildren();
    nodes = {};
    edges = {};
    const wide = layout === 'wide';
    const L = layoutFor(wide);

    const defs = el('defs', {});
    const marker = el('marker', { id: `qi-oa-${uid}`, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto-start-reverse' });
    marker.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'qi-oa__head' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // OpenShift frame and the container boxes
    svg.appendChild(el('rect', { class: 'qi-oa__frame', x: L.frame.x, y: L.frame.y, width: L.frame.w, height: L.frame.h, rx: 10 }));
    svg.appendChild(el('text', { class: 'qi-title', x: L.frame.label.x, y: L.frame.label.y }, 'Red Hat OpenShift'));
    L.containers.forEach((c) => svg.appendChild(el('rect', { class: 'qi-oa__container', x: c.x + 0.5, y: c.y + 0.5, width: c.w - 1, height: c.h - 1, rx: 8 })));
    L.captions.forEach((c) => svg.appendChild(el('text', { class: 'qi-label qi-oa__caption', x: c.x, y: c.y }, c.t)));

    // Links, then nodes on top
    Object.entries(L.edges).forEach(([key, e]) => {
      const g = el('g', { class: 'qi-oa__edge' });
      g.appendChild(el('path', { class: 'qi-oa__line', d: e.d, fill: 'none', 'marker-end': `url(#qi-oa-${uid})`, 'marker-start': key === 'us_hh' || key === 'hh_hs' ? `url(#qi-oa-${uid})` : 'none' }));
      if (e.label) g.appendChild(el('text', { class: 'qi-label qi-oa__edge-label', x: e.label.x, y: e.label.y, 'text-anchor': e.label.a }, e.label.t));
      svg.appendChild(g);
      edges[key] = g;
    });

    Object.entries(L.nodes).forEach(([key, b]) => {
      const g = el('g', { class: 'qi-oa__node' });
      if (b.person) {
        // A simple person glyph for the users
        const cx = b.x + b.w / 2;
        g.appendChild(el('circle', { class: 'qi-oa__person', cx, cy: b.y + 11, r: 9 }));
        g.appendChild(el('path', { class: 'qi-oa__person', d: `M${cx - 18} ${b.y + 40} a18 18 0 0 1 36 0 z` }));
        g.appendChild(el('title', {}, 'Users'));
      } else {
        g.appendChild(el('rect', { class: `qi-oa__rect qi-oa__rect--${b.c}`, x: b.x + 0.5, y: b.y + 0.5, width: b.w - 1, height: b.h - 1, rx: 10 }));
        const cx = b.x + b.w / 2;
        const top = b.lines.length === 1 ? b.y + b.h / 2 + 5 : b.y + b.h / 2 - 3;
        b.lines.forEach((t, i) => g.appendChild(el('text', { class: 'qi-title qi-oa__text', x: cx, y: top + i * 17, 'text-anchor': 'middle' }, t)));
      }
      svg.appendChild(g);
      nodes[key] = g;
    });

    svg.setAttribute('viewBox', L.vb.join(' '));
    svg.classList.toggle('is-narrow', !wide);
  }

  function render() {
    const s = STEPS[step];
    Object.entries(nodes).forEach(([k, g]) => g.classList.toggle('is-active', s.nodes.includes(k)));
    Object.entries(edges).forEach(([k, g]) => g.classList.toggle('is-active', s.edges.includes(k)));
    stepBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === step)));
    statusEl.innerHTML = s.text;
  }

  function relayout(force) {
    const w = svg.getBoundingClientRect().width || WIDE_MIN;
    const next = w >= WIDE_MIN ? 'wide' : 'narrow';
    if (!force && next === layout) return;
    layout = next;
    build();
    render();
  }

  stepBtns.forEach((b) =>
    b.addEventListener('click', () => {
      step = Number(b.dataset.step);
      render();
    }),
  );

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => relayout(false)).observe(node);
  }

  relayout(true);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
