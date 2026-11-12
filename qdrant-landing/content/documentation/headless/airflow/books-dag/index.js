/*
 * books-dag island: interactive replacement for the demo-dag.png screenshot
 * in the "Querying with Airflow" tutorial.
 *
 * Draws the task graph of the `books_recommend` DAG and lets the reader step
 * through a run in four stages: load and prepare, embed in parallel, ingest,
 * and search. Finished tasks are filled, the tasks of the selected stage have
 * a thick outline, and tasks that have not run yet are dashed and muted. The
 * mapped `embed_description` task shows its ten instances as a stack.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). Two
 * layouts: a wide one (left to right) and a narrow one (two lanes) so labels
 * stay readable on phones.
 */

const NS = 'http://www.w3.org/2000/svg';
const WIDE_MIN = 560; // container px at which the wide layout keeps text >= 12px

const STAGES = [
  {
    label: '1 Load and prepare',
    run: ['import_books', 'init_collection', 'embed_preference'],
    text: '<b>Load and prepare.</b> <code>import_books</code> reads <code>books.txt</code>, <code>init_collection</code> creates the collection if it does not exist, and <code>embed_preference</code> embeds the user preference. None of them depends on another, so Airflow runs them in parallel.',
  },
  {
    label: '2 Embed in parallel',
    run: ['embed_description'],
    text: '<b>Embed in parallel.</b> <code>embed_description</code> is a dynamic task: Airflow creates one mapped task instance per book, ten here, and runs them in parallel.',
  },
  {
    label: '3 Ingest',
    run: ['qdrant_vector_ingest'],
    text: '<b>Ingest.</b> <code>qdrant_vector_ingest</code> waits for the collection, the book data, and all the embeddings, then uploads the points to Qdrant.',
  },
  {
    label: '4 Search',
    run: ['search_qdrant'],
    text: '<b>Search.</b> <code>search_qdrant</code> queries the collection with the preference embedding and prints the closest book.',
  },
];

// Edges of the graph: [from, to, kind]. "payload" is the dependency created by
// passing the output of import_books to the ingest operator.
const EDGES = [
  ['import_books', 'embed_description'],
  ['embed_description', 'qdrant_vector_ingest'],
  ['import_books', 'qdrant_vector_ingest'],
  ['init_collection', 'qdrant_vector_ingest'],
  ['qdrant_vector_ingest', 'search_qdrant'],
  ['embed_preference', 'search_qdrant'],
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

// Node boxes and edge paths for both layouts (viewBox units).
function layoutFor(wide) {
  if (wide) {
    return {
      vb: [0, -14, 640, 262],
      nodes: {
        import_books: { x: 0, y: 10, w: 130, h: 46 },
        embed_description: { x: 180, y: 10, w: 170, h: 46, mapped: true },
        qdrant_vector_ingest: { x: 400, y: 10, w: 190, h: 46 },
        init_collection: { x: 0, y: 100, w: 150, h: 46 },
        embed_preference: { x: 0, y: 190, w: 160, h: 46 },
        search_qdrant: { x: 400, y: 190, w: 190, h: 46 },
      },
      paths: {
        'import_books>embed_description': 'M130 33 H178',
        'embed_description>qdrant_vector_ingest': 'M350 33 H398',
        'import_books>qdrant_vector_ingest': 'M65 10 V-6 H495 V8',
        'init_collection>qdrant_vector_ingest': 'M150 123 H440 V58',
        'qdrant_vector_ingest>search_qdrant': 'M540 56 V188',
        'embed_preference>search_qdrant': 'M160 213 H398',
      },
    };
  }
  return {
    vb: [-14, 0, 374, 262],
    nodes: {
      import_books: { x: 0, y: 12, w: 185, h: 46 },
      init_collection: { x: 210, y: 12, w: 150, h: 46 },
      embed_description: { x: 0, y: 82, w: 185, h: 46, mapped: true },
      qdrant_vector_ingest: { x: 0, y: 152, w: 185, h: 46 },
      search_qdrant: { x: 0, y: 216, w: 185, h: 46 },
      embed_preference: { x: 210, y: 216, w: 150, h: 46 },
    },
    paths: {
      'import_books>embed_description': 'M92 58 V80',
      'embed_description>qdrant_vector_ingest': 'M92 128 V150',
      'import_books>qdrant_vector_ingest': 'M0 35 H-10 V175 H-2',
      'init_collection>qdrant_vector_ingest': 'M285 58 V175 H187',
      'qdrant_vector_ingest>search_qdrant': 'M92 198 V214',
      'embed_preference>search_qdrant': 'M210 239 H187',
    },
  };
}

export function mount(node) {
  node.classList.add('qi-dg');
  const uid = Math.random().toString(36).slice(2, 7);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="DAG run stage">',
    STAGES.map((s, i) => `<button type="button" class="qi-chip qi-dg__stage" data-stage="${i}" aria-pressed="false">${s.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-dg__svg" role="img" aria-label="Task graph of the books_recommend DAG. import_books feeds embed_description, which runs once per book, and qdrant_vector_ingest. init_collection also feeds qdrant_vector_ingest. qdrant_vector_ingest and embed_preference feed search_qdrant."></svg>',
    '  <p class="qi-status qi-dg__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-dg__svg');
  const statusEl = node.querySelector('.qi-dg__status');
  const stageBtns = [...node.querySelectorAll('.qi-dg__stage')];

  let stage = 0;
  let layout = '';
  let parts = {}; // task id -> <g>

  function build() {
    svg.replaceChildren();
    parts = {};
    const wide = layout === 'wide';
    const L = layoutFor(wide);

    const defs = el('defs', {});
    const marker = el('marker', { id: `qi-dg-${uid}`, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
    marker.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'qi-dg__head' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Edges first so nodes draw over their ends.
    EDGES.forEach(([from, to]) => {
      svg.appendChild(el('path', { class: 'qi-dg__edge', d: L.paths[`${from}>${to}`], fill: 'none', 'marker-end': `url(#qi-dg-${uid})` }));
    });

    Object.entries(L.nodes).forEach(([id, b]) => {
      const g = el('g', { class: 'qi-dg__node' });
      if (b.mapped) {
        // Two offset outlines behind the node suggest the mapped instances.
        g.appendChild(el('rect', { class: 'qi-dg__rect qi-dg__rect--ghost', x: b.x + 8.5, y: b.y - 7.5, width: b.w - 1, height: b.h - 1, rx: 8 }));
        g.appendChild(el('rect', { class: 'qi-dg__rect qi-dg__rect--ghost', x: b.x + 4.5, y: b.y - 3.5, width: b.w - 1, height: b.h - 1, rx: 8 }));
      }
      g.appendChild(el('rect', { class: 'qi-dg__rect', x: b.x + 0.5, y: b.y + 0.5, width: b.w - 1, height: b.h - 1, rx: 8 }));
      g.appendChild(el('text', { class: 'qi-title qi-dg__text', x: b.x + b.w / 2, y: b.y + b.h / 2 + 5, 'text-anchor': 'middle' }, id));
      if (b.mapped) {
        const bg = el('g', { class: 'qi-dg__badge' });
        bg.appendChild(el('rect', { x: b.x + b.w - 40, y: b.y + b.h - 10, width: 44, height: 22, rx: 11 }));
        bg.appendChild(el('text', { x: b.x + b.w - 18, y: b.y + b.h + 6, 'text-anchor': 'middle' }, '×10'));
        g.appendChild(bg);
      }
      svg.appendChild(g);
      parts[id] = g;
    });

    svg.setAttribute('viewBox', L.vb.join(' '));
    svg.classList.toggle('is-narrow', !wide);
  }

  function render() {
    const done = new Set(STAGES.slice(0, stage).flatMap((s) => s.run));
    const running = new Set(STAGES[stage].run);
    Object.entries(parts).forEach(([id, g]) => {
      g.classList.toggle('is-done', done.has(id));
      g.classList.toggle('is-running', running.has(id));
      g.classList.toggle('is-pending', !done.has(id) && !running.has(id));
    });
    stageBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === stage)));
    statusEl.innerHTML = STAGES[stage].text;
  }

  function relayout(force) {
    const w = svg.getBoundingClientRect().width || WIDE_MIN;
    const next = w >= WIDE_MIN ? 'wide' : 'narrow';
    if (!force && next === layout) return;
    layout = next;
    build();
    render();
  }

  stageBtns.forEach((b) =>
    b.addEventListener('click', () => {
      stage = Number(b.dataset.stage);
      render();
    }),
  );

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => relayout(false)).observe(node);
  }

  relayout(true);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
