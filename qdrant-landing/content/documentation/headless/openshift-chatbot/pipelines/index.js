/*
 * pipelines island: interactive replacement for the two images that
 * Pipeline.draw() used to produce in the "Private Chatbot for Interactive
 * Learning" tutorial.
 *
 * Draws the indexing and the search flows as a column of components, with the
 * connections labeled by the name of the data that flows between them. The
 * components that run inside a Haystack pipeline sit in a frame; the steps
 * that do not (called directly, or plain Python) stay outside of it. Hover,
 * focus, or click a component to read what it does.
 *
 * Pure SVG + CSS on the shared island design system (islands.scss). A single
 * narrow layout works at every width; the stage is capped so text keeps its
 * size on large screens.
 */

const NS = 'http://www.w3.org/2000/svg';

const NODE_W = 240;
const NODE_H = 40;
const X0 = 14; // nodes sit inside the frame
const FRAME_W = 268;
const COL_X = 276; // frame labels
const VB_W = 428; // wide enough for the longest label in that column
const GAP = 30;
const FRAME_LABEL_ZONE = 30;
const FRAME_PAD = 12;

const VIEWS = [
  {
    label: 'Indexing',
    intro:
      '<b>Indexing.</b> The first three steps are plain function calls. Only the embedder and the writer run as a Haystack pipeline. Select a step to see what it does.',
    frame: 'indexing_pipeline',
    items: [
      { id: 'pages', kind: 'ext', text: 'Course pages', desc: 'The lessons of the Red Hat OpenShift Foundations course, given as a list of URLs.' },
      { id: 'fetcher', kind: 'hs', text: 'LinkContentFetcher', edge: 'urls', desc: '<b>LinkContentFetcher</b> downloads the pages. It is called directly, outside the pipeline.' },
      { id: 'converter', kind: 'hs', text: 'HTMLToDocument', edge: 'streams', desc: '<b>HTMLToDocument</b> extracts the text from the HTML and returns Haystack documents. It is called directly, outside the pipeline.' },
      { id: 'split', kind: 'py', text: 'split_document()', edge: 'documents', desc: '<b>split_document()</b> is plain Python: it splits each document into chunks of 5 sentences, with an overlap of 2.' },
      { id: 'embedder', kind: 'hs', text: 'FastembedDocumentEmbedder', group: true, edge: 'documents', desc: '<b>FastembedDocumentEmbedder</b> embeds every chunk with BAAI/bge-base-en-v1.5. It is the first component of the indexing pipeline.' },
      { id: 'writer', kind: 'hs', text: 'DocumentWriter', group: true, edge: 'documents', desc: '<b>DocumentWriter</b> writes the chunks and their embeddings to the Qdrant document store.' },
      { id: 'qdrant', kind: 'qd', text: 'Qdrant', edge: 'write', desc: 'The <code>red-hat-learning</code> collection on Qdrant Hybrid Cloud, with 768-dimensional vectors.' },
    ],
  },
  {
    label: 'Search',
    intro:
      '<b>Search.</b> Every step after the question runs inside one Haystack pipeline, which Hayhooks serves over HTTP. Select a step to see what it does.',
    frame: 'search_pipeline',
    items: [
      { id: 'question', kind: 'ext', text: 'Question', desc: 'The user question, sent to the endpoint that Hayhooks exposes.' },
      { id: 'query_embedder', kind: 'hs', text: 'FastembedTextEmbedder', group: true, edge: 'text', desc: '<b>FastembedTextEmbedder</b> embeds the question with the same model that embedded the chunks.' },
      { id: 'retriever', kind: 'hs', text: 'QdrantEmbeddingRetriever', group: true, edge: 'embedding', desc: '<b>QdrantEmbeddingRetriever</b> asks Qdrant for the <code>top_k</code> most similar chunks.' },
      { id: 'prompt_builder', kind: 'hs', text: 'ChatPromptBuilder', group: true, edge: 'documents', desc: '<b>ChatPromptBuilder</b> fills the prompt template with the retrieved chunks and the question.' },
      { id: 'llm', kind: 'hs', text: 'OpenAIChatGenerator', group: true, edge: 'prompt', desc: '<b>OpenAIChatGenerator</b> sends the prompt to the model server, which runs Mistral-7B-Instruct-v0.1.' },
      { id: 'answer', kind: 'ext', text: 'Answer', edge: 'replies', desc: 'The reply of the model, returned to the user by Hayhooks.' },
    ],
  },
];

function el(name, attrs, text) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  return node;
}

export function mount(node) {
  node.classList.add('qi-pl');
  const uid = Math.random().toString(36).slice(2, 7);

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Pipeline">',
    VIEWS.map((v, i) => `<button type="button" class="qi-chip qi-pl__view" data-view="${i}" aria-pressed="false">${v.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg qi-pl__svg" role="img"></svg>',
    '  <p class="qi-status qi-pl__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const svg = node.querySelector('.qi-pl__svg');
  const statusEl = node.querySelector('.qi-pl__status');
  const viewBtns = [...node.querySelectorAll('.qi-pl__view')];

  let view = 0;
  let hovered = null;
  let pinned = null;
  let nodes = {};

  function build() {
    svg.replaceChildren();
    nodes = {};
    const v = VIEWS[view];

    const defs = el('defs', {});
    const marker = el('marker', { id: `qi-pl-${uid}`, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
    marker.appendChild(el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'qi-pl__head' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Lay the column out from top to bottom.
    let y = 2;
    const pos = [];
    let frame = null;
    v.items.forEach((it, i) => {
      const opens = it.group && !(i > 0 && v.items[i - 1].group);
      const closes = it.group && !(i < v.items.length - 1 && v.items[i + 1].group);
      if (opens) {
        frame = { top: y };
        y += FRAME_LABEL_ZONE;
      }
      pos.push({ y });
      const bottom = y + NODE_H;
      if (closes) {
        frame.bottom = bottom + FRAME_PAD;
        y = frame.bottom + 26;
      } else {
        y = bottom + GAP;
      }
    });
    const lastBottom = pos[pos.length - 1].y + NODE_H;

    // Frame around the Haystack pipeline
    const first = v.items.findIndex((it) => it.group);
    const last = v.items.length - 1 - [...v.items].reverse().findIndex((it) => it.group);
    const fTop = pos[first].y - FRAME_LABEL_ZONE;
    const fBottom = pos[last].y + NODE_H + FRAME_PAD;
    svg.appendChild(el('rect', { class: 'qi-pl__frame', x: 0.5, y: fTop + 0.5, width: FRAME_W - 1, height: fBottom - fTop - 1, rx: 10 }));
    // The label sits outside the frame, in the right column, clear of the arrows.
    svg.appendChild(el('text', { class: 'qi-label qi-pl__frame-label', x: COL_X, y: fTop + 26 }, v.frame));

    // Connections, labeled with the data that flows through them
    v.items.forEach((it, i) => {
      if (i === 0) return;
      const from = pos[i - 1].y + NODE_H;
      const to = pos[i].y;
      const cx = X0 + NODE_W / 2;
      svg.appendChild(el('path', { class: 'qi-pl__edge', d: `M${cx} ${from} V${to - 2}`, fill: 'none', 'marker-end': `url(#qi-pl-${uid})` }));
      // Keep the label beside its arrow, in the gap outside the frame border
      const entering = it.group && !v.items[i - 1].group;
      const leaving = v.items[i - 1].group && !it.group;
      const top = entering ? from : leaving ? fBottom : from;
      const bottom = entering ? fTop : leaving ? to : to;
      svg.appendChild(el('text', { class: 'qi-label qi-pl__edge-label', x: cx + 10, y: (top + bottom) / 2 + 5 }, it.edge));
    });

    // Components
    v.items.forEach((it, i) => {
      const g = el('g', { class: `qi-pl__node qi-pl__node--${it.kind}`, tabindex: 0, role: 'button', 'aria-label': it.text, 'data-id': it.id });
      g.appendChild(el('rect', { class: 'qi-pl__rect', x: X0 + 0.5, y: pos[i].y + 0.5, width: NODE_W - 1, height: NODE_H - 1, rx: 8 }));
      g.appendChild(el('text', { class: 'qi-title qi-pl__text', x: X0 + NODE_W / 2, y: pos[i].y + NODE_H / 2 + 5, 'text-anchor': 'middle' }, it.text));
      svg.appendChild(g);
      nodes[it.id] = g;
    });

    svg.setAttribute('viewBox', `0 0 ${VB_W} ${lastBottom + 2}`);
    svg.setAttribute(
      'aria-label',
      `${v.label} flow: ${v.items.map((it) => it.text).join(', then ')}.`,
    );
  }

  function render() {
    const v = VIEWS[view];
    const hot = pinned || hovered;
    Object.entries(nodes).forEach(([id, g]) => {
      g.classList.toggle('is-hot', id === hot);
      g.setAttribute('aria-pressed', String(id === pinned));
    });
    viewBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === view)));
    const item = hot ? v.items.find((it) => it.id === hot) : null;
    statusEl.innerHTML = item ? item.desc : v.intro;
  }

  function setView(i) {
    view = i;
    hovered = null;
    pinned = null;
    build();
    render();
  }

  viewBtns.forEach((b) => b.addEventListener('click', () => setView(Number(b.dataset.view))));

  const idOf = (e) => {
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    return t ? t.getAttribute('data-id') : null;
  };
  svg.addEventListener('pointerover', (e) => {
    const id = idOf(e);
    if (id && id !== hovered) {
      hovered = id;
      render();
    }
  });
  svg.addEventListener('pointerout', (e) => {
    if (idOf(e)) {
      hovered = null;
      render();
    }
  });
  svg.addEventListener('click', (e) => {
    const id = idOf(e);
    if (!id) return;
    pinned = pinned === id ? null : id;
    render();
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const id = idOf(e);
    if (!id) return;
    e.preventDefault();
    pinned = pinned === id ? null : id;
    render();
  });
  svg.addEventListener('focusin', (e) => {
    const id = idOf(e);
    if (id) {
      hovered = id;
      render();
    }
  });
  svg.addEventListener('focusout', () => {
    hovered = null;
    render();
  });

  build();
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
