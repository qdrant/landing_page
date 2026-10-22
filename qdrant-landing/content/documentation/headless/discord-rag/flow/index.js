const NS = 'http://www.w3.org/2000/svg';
const G = {
  width: 670,
  indexHeight: 580,
  answerHeight: 580,
  frame: { x: 48, y: 96, width: 282, height: 392 },
  input: { x: 66, y: 8, width: 244, height: 60 },
  left: { x: 66, width: 244, height: 64 },
  right: { x: 440, width: 214, height: 64 },
  rows: [146, 274, 402],
  reply: { x: 66, y: 520, width: 244, height: 44 },
  center: 188,
  bypass: 24,
};
let instance = 0;

const FLOWS = {
  index: {
    label: 'Index documents',
    description: 'Document URLs are extracted and chunked by CAMEL, embedded by OpenAI, and stored with their text and source URL in Qdrant Cloud.',
    status: 'Run ingestion once. CAMEL chunks the pages, OpenAI embeds the text, and Qdrant stores vectors with text and sources.',
    nodes: [
      { id: 'input', title: 'Documentation URLs', sub: 'public source pages', kind: 'source', box: G.input,
        detail: 'Read the selected public documentation URLs during ingestion. Questions reuse the stored content.' },
      { id: 'extract', title: 'Extract + chunk', sub: 'VectorRetriever.process()', kind: 'camel', row: 0,
        detail: 'VectorRetriever.process() extracts page text and splits it into chunks before requesting embeddings.' },
      { id: 'embed', title: 'OpenAIEmbedding', sub: 'document text → vectors', kind: 'camel', row: 1,
        detail: 'The CAMEL OpenAIEmbedding adapter sends chunk text to OpenAI and receives one vector per chunk.' },
      { id: 'embedding-service', title: 'OpenAI', sub: 'text-embedding-3-large', kind: 'openai', row: 1, external: true,
        detail: 'The embedding model runs at OpenAI. Use this same model for documents and questions.' },
      { id: 'storage', title: 'QdrantStorage', sub: 'upsert vectors + payload', kind: 'camel', row: 2,
        detail: 'The CAMEL QdrantStorage adapter writes each vector with its chunk text and full source URL.' },
      { id: 'cloud', title: 'Qdrant Cloud', sub: 'vectors · text · source', kind: 'qdrant', row: 2, external: true,
        detail: 'The collection persists the vectors and payloads. Starting the bot again reuses this collection.' },
    ],
    edges: [
      { from: 'input', to: 'extract', path: 'M188 68V142', label: 'pages', x: 204, y: 91 },
      { from: 'extract', to: 'embed', path: 'M188 210V270', label: 'chunks', x: 204, y: 246 },
      { from: 'embed', to: 'embedding-service', path: 'M310 292H436', label: 'text', x: 375, y: 283, center: true },
      { from: 'embedding-service', to: 'embed', path: 'M440 320H314', label: 'vectors', x: 375, y: 344, center: true, returning: true },
      { from: 'embed', to: 'storage', path: 'M188 338V398', label: 'vectors + data', x: 204, y: 374 },
      { from: 'storage', to: 'cloud', path: 'M310 434H436', label: 'upsert', x: 375, y: 424, center: true },
    ],
  },
  answer: {
    label: 'Answer question',
    description: 'A Discord question is embedded by OpenAI. CAMEL queries Qdrant, then sends matching text and the original question to a fresh ChatAgent using GPT-4o-mini. If no usable chunks are found, generation is skipped. The response returns to Discord.',
    status: 'With matching chunks, ChatAgent receives the question and retrieved text. Without usable context, generation is skipped.',
    nodes: [
      { id: 'input', title: 'Discord user', sub: '!ask followed by a question', kind: 'discord', box: G.input,
        detail: 'A user sends !ask plus a question. The application keeps the original question for the answer prompt.' },
      { id: 'embed', title: 'OpenAIEmbedding', sub: 'question → query vector', kind: 'camel', row: 0,
        detail: 'VectorRetriever.query() embeds the question through the same OpenAI model used for the documents.' },
      { id: 'embedding-service', title: 'OpenAI', sub: 'text-embedding-3-large', kind: 'openai', row: 0, external: true,
        detail: 'OpenAI returns a query vector. This vector is sent to Qdrant for similarity search.' },
      { id: 'storage', title: 'QdrantStorage', sub: 'search the collection', kind: 'camel', row: 1,
        detail: 'The adapter sends the query vector to Qdrant. VectorRetriever keeps up to five chunks above the score threshold.' },
      { id: 'cloud', title: 'Qdrant Cloud', sub: 'document collection', kind: 'qdrant', row: 1, external: true,
        detail: 'Qdrant searches the stored vectors and returns matching chunk text, source URLs, and similarity scores.' },
      { id: 'agent', title: 'Fresh ChatAgent', sub: 'question + retrieved text', kind: 'camel', row: 2,
        detail: 'A new ChatAgent receives the question and retrieved text. It has no tools and does not choose to search again.' },
      { id: 'chat-service', title: 'OpenAI', sub: 'gpt-4o-mini', kind: 'openai', row: 2, external: true,
        detail: 'GPT-4o-mini generates from the supplied context. If no usable chunks are retrieved, the application skips this call.' },
      { id: 'reply', title: 'Answer in Discord', kind: 'discord', box: G.reply,
        detail: 'The application sends the answer to Discord. Check its claims and citations against the retrieved sources.' },
    ],
    edges: [
      { from: 'input', to: 'embed', path: 'M188 68V142', label: 'question', x: 204, y: 91 },
      { from: 'embed', to: 'embedding-service', path: 'M310 164H436', label: 'text', x: 375, y: 155, center: true },
      { from: 'embedding-service', to: 'embed', path: 'M440 192H314', label: 'vector', x: 375, y: 216, center: true, returning: true },
      { from: 'embed', to: 'storage', path: 'M188 210V270', label: 'query vector', x: 204, y: 246 },
      { from: 'storage', to: 'cloud', path: 'M310 292H436', label: 'query', x: 375, y: 283, center: true },
      { from: 'cloud', to: 'storage', path: 'M440 320H314', label: 'matches', x: 375, y: 344, center: true, returning: true },
      { from: 'storage', to: 'agent', path: 'M188 338V398', label: 'text + sources', x: 204, y: 374 },
      { from: 'input', to: 'agent', path: 'M66 38H24V434H62', label: 'original question', x: 15, y: 255, rotate: true, bypass: true },
      { from: 'agent', to: 'chat-service', path: 'M310 420H436', label: 'prompt', x: 375, y: 411, center: true },
      { from: 'chat-service', to: 'agent', path: 'M440 448H314', label: 'answer', x: 375, y: 472, center: true, returning: true },
      { from: 'agent', to: 'reply', path: 'M188 466V516', label: 'reply', x: 204, y: 508 },
    ],
  },
};

const MOBILE_OWNERS = {
  "source": "Source",
  "discord": "Discord",
  "camel": "CAMEL-AI adapter",
  "openai": "External service",
  "qdrant": "External service"
};
const MOBILE_TRANSFERS = {
  "index": {
    "input": "Fetch the source pages",
    "extract": "Pass chunk text to the embedding adapter",
    "embed": "Send chunk text to OpenAI",
    "embedding-service": "Return vectors to the CAMEL adapter",
    "storage": "Upsert vectors with chunk text and full source URLs"
  },
  "answer": {
    "input": "Pass the question to the embedding adapter",
    "embed": "Send question text to OpenAI",
    "embedding-service": "Return the query vector to the adapter",
    "storage": "Search the stored vectors",
    "cloud": "Return matching text and sources through QdrantStorage",
    "agent": "Send original question + retrieved text as the prompt",
    "chat-service": "Return the answer through ChatAgent"
  }
};

function el(name, attrs = {}, text) {
  const item = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value));
  if (text !== undefined) item.textContent = text;
  return item;
}

export function mount(node) {
  const uid = `qi-discord-rag-${++instance}`;
  node.classList.add('qi-discord-rag');
  node.innerHTML = '<div class="qi-fig">' +
    '<div class="qi-controls"><div class="qi-group" role="group" aria-label="RAG path">' +
    '<button class="qi-chip" type="button" data-flow="index">Index documents</button>' +
    '<button class="qi-chip" type="button" data-flow="answer">Answer question</button>' +
    '</div></div><div class="qi-discord-rag__stage"></div>' +
    '<p class="qi-status qi-status--2 qi-discord-rag__status" role="status" aria-live="polite" aria-atomic="true"></p></div>';

  const stage = node.querySelector('.qi-discord-rag__stage');
  const status = node.querySelector('.qi-discord-rag__status');
  const buttons = [...node.querySelectorAll('[data-flow]')];
  let mode = 'answer';
  let pinned = null;
  let hovered = null;
  let focused = null;

  function update() {
    const selected = hovered || focused || pinned;
    const flow = FLOWS[mode];
    stage.querySelectorAll('[data-node]').forEach((item) => {
      item.classList.toggle('is-emphasized', item.dataset.node === selected);
      item.classList.toggle('is-pinned', item.dataset.node === pinned);
      item.setAttribute('aria-pressed', String(item.dataset.node === pinned));
    });
    stage.querySelectorAll('[data-from]').forEach((item) => {
      item.classList.toggle('is-emphasized', selected !== null &&
        (item.dataset.from === selected || item.dataset.to === selected));
    });
    status.textContent = selected ? flow.nodes.find((item) => item.id === selected).detail : flow.status;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.flow === mode)));
  }

  function bindNode(group, item) {
    const pick = () => { pinned = pinned === item.id ? null : item.id; update(); };
    group.addEventListener('click', pick);
    group.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') { hovered = item.id; update(); } });
    group.addEventListener('pointerleave', () => { hovered = null; update(); });
    group.addEventListener('focus', () => { focused = item.id; update(); });
    group.addEventListener('blur', () => { focused = null; update(); });
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(); }
      if (event.key === 'Escape') { pinned = null; hovered = null; focused = null; update(); }
    });
  }

  function drawMobile(flow) {
    const list = document.createElement('ol');
    list.className = 'qi-discord-rag__narrow qi-discord-rag__mobile-list';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', flow.label);
    flow.nodes.forEach((item) => {
      const li = document.createElement('li');
      if (mode === 'answer' && item.id === 'agent') {
        const branch = document.createElement('p');
        branch.className = 'qi-discord-rag__branch';
        branch.textContent = 'The original Discord question joins the retrieved text here. With no usable context, skip generation and send an insufficient-context reply.';
        li.appendChild(branch);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'qi-discord-rag__node qi-discord-rag__mobile-node qi-discord-rag__node--' + item.kind;
      button.dataset.node = item.id;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', item.title + (item.sub ? ': ' + item.sub : '') + '. Select for details.');
      const owner = document.createElement('span');
      owner.className = 'qi-discord-rag__mobile-owner';
      owner.textContent = MOBILE_OWNERS[item.kind];
      const name = document.createElement('strong');
      name.className = 'qi-discord-rag__mobile-name';
      name.textContent = item.title;
      button.append(owner, name);
      if (item.sub) {
        const sub = document.createElement('span');
        sub.className = 'qi-discord-rag__mobile-sub';
        sub.textContent = item.sub;
        button.appendChild(sub);
      }
      bindNode(button, item);
      li.appendChild(button);
      const transfer = MOBILE_TRANSFERS[mode][item.id];
      if (transfer) {
        const text = document.createElement('p');
        text.className = 'qi-discord-rag__transfer';
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↓ ';
        text.append(arrow, document.createTextNode(transfer));
        li.appendChild(text);
      }
      list.appendChild(li);
    });
    return list;
  }

  function draw() {
    const flow = FLOWS[mode];
    const svg = el('svg', {
      class: 'qi-svg qi-discord-rag__svg',
      viewBox: `-3 -3 ${G.width + 6} ${(mode === 'index' ? G.indexHeight : G.answerHeight) + 6}`,
      role: 'group', 'aria-label': flow.label, 'aria-describedby': `${uid}-description`,
    });
    svg.appendChild(el('desc', { id: `${uid}-description` }, `${flow.description} Select a node for details; select it again or press Escape to clear.`));
    const defs = el('defs');
    const marker = el('marker', { id: `${uid}-arrow`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' });
    marker.appendChild(el('path', { d: 'M0 0L9 5L0 10Z', class: 'qi-discord-rag__arrowhead' }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    svg.appendChild(el('rect', { ...G.frame, class: 'qi-frame qi-discord-rag__boundary', rx: 6 }));
    svg.appendChild(el('text', { x: 66, y: 120, class: 'qi-frame-label qi-discord-rag__owner' }, 'CAMEL-AI'));
    svg.appendChild(el('text', { x: 440, y: 120, class: 'qi-frame-label qi-discord-rag__owner' }, 'External services'));

    flow.edges.forEach((edge) => {
      const group = el('g', { class: 'qi-discord-rag__edge', 'data-from': edge.from, 'data-to': edge.to, 'aria-hidden': 'true' });
      group.appendChild(el('path', {
        d: edge.path, class: `qi-discord-rag__arrow${edge.returning ? ' is-return' : ''}${edge.bypass ? ' is-bypass' : ''}`,
        'marker-end': `url(#${uid}-arrow)`,
      }));
      const label = el('text', { x: edge.x, y: edge.y, class: 'qi-label qi-discord-rag__edge-label', 'text-anchor': edge.center || edge.rotate ? 'middle' : 'start' }, edge.label);
      if (edge.rotate) label.setAttribute('transform', `rotate(-90 ${edge.x} ${edge.y})`);
      group.appendChild(label);
      svg.appendChild(group);
    });

    flow.nodes.forEach((item) => {
      const box = item.box || { ...(item.external ? G.right : G.left), y: G.rows[item.row] };
      const group = el('g', {
        class: `qi-discord-rag__node qi-discord-rag__node--${item.kind}`,
        'data-node': item.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
        'aria-label': `${item.title}${item.sub ? `: ${item.sub}` : ''}. Select for details.`,
      });
      group.appendChild(el('rect', { ...box, rx: 5, class: 'qi-frame qi-discord-rag__box' }));
      group.appendChild(el('rect', { x: box.x + 1, y: box.y + 1, width: 4, height: box.height - 2, rx: 2, class: 'qi-discord-rag__stripe' }));
      group.appendChild(el('text', { x: box.x + 15, y: box.y + (item.sub ? 25 : 28), class: 'qi-discord-rag__name' }, item.title));
      if (item.sub) group.appendChild(el('text', { x: box.x + 15, y: box.y + 47, class: 'qi-label qi-discord-rag__sub' }, item.sub));
      bindNode(group, item);
      svg.appendChild(group);
    });
    stage.replaceChildren(svg, drawMobile(flow));
    update();
  }

  buttons.forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.flow;
    pinned = null;
    hovered = null;
    focused = null;
    draw();
  }));
  draw();
  node.dataset.ready = 'true';
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
