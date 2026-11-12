/*
 * taxonomy island: interactive replacement for taxonomy-overview.png,
 * query.png and similairty-scoring.png.
 *
 * The taxonomy of ways to use relevance feedback: update the query, the
 * documents, or the similarity scoring, and below each, how. Click a node to
 * expand or collapse it; the chips expand everything or highlight the methods
 * built for lexical or neural search.
 */

const NS = 'http://www.w3.org/2000/svg';

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
  node.classList.toggle('sf-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('sf-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

// kind: 'lex' | 'neu' | 'both' for methods; undefined for structure.
const TREE = {
  id: 'root',
  label: 'Relevance feedback',
  text: 'Relevance feedback can update the <b>query</b>, the <b>documents</b>, or the <b>similarity scoring</b>. Click a node to expand it.',
  children: [
    {
      id: 'query',
      label: 'Query',
      edge: 'Update',
      text: 'Refine the query, either as text or as a vector.',
      children: [
        {
          id: 'text',
          label: 'As text',
          edge: 'Refine',
          text: 'Modify the text of the query using feedback.',
          children: [
            { id: 'qte', label: 'Query term expansion', edge: 'Using feedback', kind: 'lex', text: 'Expand the query with terms from relevant documents, as the Relevance Models family and RM3 do. Built for lexical search.' },
            { id: 'refo', label: 'Re-formulate query', kind: 'both', text: 'Rewrite the query using feedback. Used in both lexical and neural search.' },
            { id: 'ext', label: 'Extend and re-encode', kind: 'neu', text: 'Extend the query with feedback, for example with relevant chunks as BERT-QE does, then encode it again. Neural search.' },
          ],
        },
        {
          id: 'vec',
          label: 'As vector',
          edge: 'Refine',
          text: 'Modify the vector representation of the query using feedback.',
          children: [
            { id: 'alg', label: 'Algebra with feedback vectors', edge: 'Using feedback', kind: 'both', text: 'Combine the query vector with feedback vectors, as Rocchio\'s method does. Works for lexical and neural search.' },
            { id: 'gd', label: 'Query gradient descent', kind: 'neu', text: 'Adjust the query vector by gradient descent, guided by a reranker, as TOUR and ReFit do. Neural search.' },
            { id: 'enc', label: 'Second stage encoder', kind: 'neu', text: 'Encode the query again with a relevance-aware encoder. Neural search.' },
          ],
        },
      ],
    },
    {
      id: 'docs',
      label: 'Documents',
      edge: 'Update',
      muted: true,
      text: 'Adapting documents or the search index to feedback would need per-request changes, which is impractical when systems store billions of documents. This branch is not pursued.',
    },
    {
      id: 'sim',
      label: 'Similarity scoring',
      edge: 'Update',
      text: 'Change how the query and documents are compared, for the whole collection or for a subset.',
      children: [
        { id: 'whole', label: 'Whole documents collection', edge: 'Applied to', unknown: true, text: 'Feedback-aware scoring over the whole collection is largely unexplored: the papers we found center on reranking.' },
        {
          id: 'subset',
          label: 'Subset (i.e. reranking)',
          edge: 'Applied to',
          text: 'Apply feedback-aware scoring to a retrieved subset, which is reranking.',
          children: [
            { id: 'comb', label: 'Combine similarity scores', edge: 'Using feedback', kind: 'both', text: 'Add a feedback-based similarity to the query-document score, for example the kNN-based method. Lexical and neural.' },
            { id: 'adapt', label: 'Adapt reranker', kind: 'both', text: 'Train or fine-tune a reranker to be feedback-aware. Lexical and neural.' },
          ],
        },
      ],
    },
  ],
};

const LABEL_COL = { lex: 'sf-tx__k--lex', neu: 'sf-tx__k--neu', both: 'sf-tx__k--both' };

function wrap(text, max) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  });
  if (cur) lines.push(cur);
  return lines;
}

export function mount(node) {
  node.classList.add('sf-tx');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Taxonomy view">',
    '      <button type="button" class="qi-chip" data-act="all">Expand all</button>',
    '      <button type="button" class="qi-chip" data-act="reset">Collapse</button>',
    '    </div>',
    '    <div class="qi-group" role="group" aria-label="Highlight by search type">',
    '      <button type="button" class="qi-chip" data-hl="lex" aria-pressed="false"><span class="sf-tx__sw sf-tx__sw--lex"></span>lexical search</button>',
    '      <button type="button" class="qi-chip" data-hl="neu" aria-pressed="false"><span class="sf-tx__sw sf-tx__sw--neu"></span>neural search</button>',
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 300" role="group" aria-label="Taxonomy of relevance feedback methods. Click a node to expand it.">',
    '    <g class="sf-tx__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 sf-tx__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.sf-tx__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.sf-tx__status');
  const hlChips = [...node.querySelectorAll('[data-hl]')];
  const open = new Set(['root']);
  let hl = null;
  let sel = 'root';
  const isNarrow = watchNarrow(node, () => render());

  const walk = (n, fn, depth = 0) => {
    fn(n, depth);
    (n.children || []).forEach((c) => walk(c, fn, depth + 1));
  };
  const byId = {};
  walk(TREE, (n) => (byId[n.id] = n));

  const visibleKids = (n) => (open.has(n.id) ? n.children || [] : []);
  const matches = (n) => !hl || (n.kind && (n.kind === hl || n.kind === 'both'));

  function swatch(x, y, size, kind) {
    if (kind === 'both') {
      g.appendChild(el('polygon', { class: 'sf-tx__k sf-tx__k--lex', points: `${x},${y} ${x + size},${y} ${x},${y + size}` }));
      g.appendChild(el('polygon', { class: 'sf-tx__k sf-tx__k--neu', points: `${x + size},${y} ${x + size},${y + size} ${x},${y + size}` }));
    } else {
      g.appendChild(el('rect', { class: `sf-tx__k ${LABEL_COL[kind]}`, x, y, width: size, height: size, rx: 2 }));
    }
  }

  function renderWide() {
    const colX = [10, 205, 390, 590];
    const colW = [150, 140, 170, 160];
    let row = 0;
    const PITCH = 68;
    const pos = {};
    const place = (n, depth) => {
      const kids = visibleKids(n);
      if (!kids.length) {
        pos[n.id] = { depth, y: row * PITCH };
        row += 1;
      } else {
        kids.forEach((c) => place(c, depth + 1));
        const ys = kids.map((c) => pos[c.id].y);
        pos[n.id] = { depth, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      }
    };
    place(TREE, 0);
    const H = Math.max(row, 1) * PITCH + 12;
    svg.setAttribute('viewBox', `0 0 760 ${H}`);
    const draw = (n) => {
      const p = pos[n.id];
      visibleKids(n).forEach((c) => {
        const q = pos[c.id];
        const x1 = colX[p.depth] + colW[p.depth];
        const x2 = colX[q.depth];
        const y1 = p.y + 33;
        const y2 = q.y + 33;
        const xm = x1 + (x2 - x1) / 2;
        g.appendChild(el('path', { class: `sf-tx__edge${n.muted || c.muted ? ' is-muted' : ''}`, d: `M${x1} ${y1} H${xm} V${y2} H${x2 - 4}` }));
        draw(c);
      });
      const hasKids = !!(n.children && n.children.length);
      const avail = colW[p.depth] - (n.kind ? 30 : 12) - (hasKids ? 22 : 8);
      const lines = wrap(n.label, Math.max(8, Math.floor(avail / 7.9)));
      const x = colX[p.depth];
      const dim = !matches(n) && n.kind;
      const gEl = el('g', { class: `sf-tx__node${open.has(n.id) ? ' is-open' : ''}${n.id === sel ? ' is-sel' : ''}${n.muted ? ' is-muted' : ''}${dim ? ' is-dim' : ''}${hasKids ? ' is-branch' : ''}`, 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': n.label + (hasKids ? (open.has(n.id) ? ', expanded' : ', collapsed') : '') });
      gEl.appendChild(el('rect', { class: 'sf-tx__box', x, y: p.y + 4, width: colW[p.depth], height: 58, rx: 6 }));
      lines.forEach((l, i) => gEl.appendChild(el('text', { class: 'qi-label qi-label--strong sf-tx__lab', x: x + (n.kind ? 28 : 10), y: p.y + 4 + (58 - lines.length * 15) / 2 + 11 + i * 15 }, l)));
      g.appendChild(gEl);
      if (n.kind) {
        const sz = 14;
        const before = g.childNodes.length;
        swatch(x + 8, p.y + 26, sz, n.kind);
        // move swatch inside the node group so a click on it selects the node
        while (g.childNodes.length > before) gEl.appendChild(g.childNodes[before]);
      }
      if (hasKids) gEl.appendChild(el('text', { class: 'qi-label sf-tx__chev', x: x + colW[p.depth] - 14, y: p.y + 38 }, open.has(n.id) ? '−' : '+'));
    };
    draw(TREE);
  }

  function renderNarrow() {
    const rows = [];
    const collect = (n, depth) => {
      rows.push({ n, depth });
      visibleKids(n).forEach((c) => collect(c, depth + 1));
    };
    collect(TREE, 0);
    const PITCH = 36;
    svg.setAttribute('viewBox', `0 0 340 ${rows.length * PITCH + 12}`);
    rows.forEach(({ n, depth }, i) => {
      const y = 6 + i * PITCH;
      const x = 6 + depth * 18;
      const hasKids = !!(n.children && n.children.length);
      const dim = !matches(n) && n.kind;
      const gEl = el('g', { class: `sf-tx__node${open.has(n.id) ? ' is-open' : ''}${n.id === sel ? ' is-sel' : ''}${n.muted ? ' is-muted' : ''}${dim ? ' is-dim' : ''}${hasKids ? ' is-branch' : ''}`, 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': n.label });
      gEl.appendChild(el('rect', { class: 'sf-tx__box', x, y, width: 334 - x, height: 30, rx: 5 }));
      let tx = x + 10;
      if (n.kind) {
        const before = g.childNodes.length;
        swatch(x + 8, y + 8, 14, n.kind);
        while (g.childNodes.length > before) gEl.appendChild(g.childNodes[before]);
        tx = x + 30;
      }
      gEl.appendChild(el('text', { class: 'qi-label qi-label--strong sf-tx__lab', x: tx, y: y + 20 }, n.label));
      if (hasKids) gEl.appendChild(el('text', { class: 'qi-label sf-tx__chev', x: 322, y: y + 20, 'text-anchor': 'end' }, open.has(n.id) ? '−' : '+'));
      g.appendChild(gEl);
    });
  }

  function render() {
    g.replaceChildren();
    if (isNarrow()) renderNarrow();
    else renderWide();
    const sn = byId[sel];
    statusEl.innerHTML = (sn.edge ? `<i>${sn.edge}</i> \u00b7 ` : '') + sn.text;
  }

  function activate(id) {
    sel = id;
    const n = byId[id];
    if (n.children && n.children.length) {
      if (open.has(id)) {
        walk(n, (m) => open.delete(m.id));
      } else open.add(id);
    }
    render();
  }

  svg.addEventListener('click', (e) => {
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    if (t) activate(t.getAttribute('data-id'));
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest ? e.target.closest('[data-id]') : null;
    if (t) {
      e.preventDefault();
      activate(t.getAttribute('data-id'));
    }
  });
  node.querySelector('[data-act="all"]').addEventListener('click', () => {
    walk(TREE, (n) => n.children && open.add(n.id));
    render();
  });
  node.querySelector('[data-act="reset"]').addEventListener('click', () => {
    open.clear();
    open.add('root');
    sel = 'root';
    render();
  });
  hlChips.forEach((b) =>
    b.addEventListener('click', () => {
      hl = hl === b.dataset.hl ? null : b.dataset.hl;
      hlChips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.hl === hl)));
      render();
    }),
  );

  walk(TREE, (n) => n.children && n.depth !== 99 && (n.id === 'root' || n.id === 'query' || n.id === 'sim') && open.add(n.id));
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
