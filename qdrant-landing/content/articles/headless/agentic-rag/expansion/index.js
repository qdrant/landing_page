/*
 * expansion island: interactive replacement for query-expansion.png.
 *
 * An LLM improves the user's query before it reaches the vector database: it fixes
 * typos and adds synonyms. Pick an example. Words the LLM corrected are highlighted in
 * the original, and words it added or corrected are highlighted in the result. The
 * examples are illustrative.
 */

const NS = 'http://www.w3.org/2000/svg';
const EXAMPLES = [
  { label: 'Clothing', input: 'mens denim jacket size larg', output: 'mens denim jacket jeans coat outerwear size large' },
  { label: 'Electronics', input: 'iphone 15 pro case blk', output: 'iphone 15 pro case black cover protector' },
  { label: 'Travel', input: 'cheap flights nyc to lon', output: 'cheap flights new york city to london airfare tickets' },
];

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
  node.classList.toggle('ag-narrow', narrow);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (is() !== narrow) {
        narrow = is();
        node.classList.toggle('ag-narrow', narrow);
        onChange();
      }
    }).observe(node);
  }
  return () => narrow;
}

function wrap(words, maxChars) {
  const lines = [[]];
  words.forEach((w) => {
    const row = lines[lines.length - 1];
    if (row.length && row.join(' ').length + 1 + w.length > maxChars) lines.push([w]);
    else row.push(w);
  });
  return lines;
}

export function mount(node) {
  node.classList.add('ag-ex');
  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group" role="group" aria-label="Example query">',
    EXAMPLES.map((e, i) => `<button type="button" class="qi-chip" data-ex="${i}" aria-pressed="false">${e.label}</button>`).join(''),
    '    </div>',
    '  </div>',
    '  <svg class="qi-svg" viewBox="0 0 760 200" role="img" aria-label="A user query with a typo goes through an LLM and comes out corrected and expanded with synonyms.">',
    '    <g class="ag-ex__g"></g>',
    '  </svg>',
    '  <p class="qi-status qi-status--2 ag-ex__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const g = node.querySelector('.ag-ex__g');
  const svg = node.querySelector('svg');
  const statusEl = node.querySelector('.ag-ex__status');
  const chips = [...node.querySelectorAll('[data-ex]')];
  let selected = 0;
  const isNarrow = watchNarrow(node, () => render());

  function textBox(x, y, w, words, other, cls, hot) {
    const maxChars = Math.floor((w - 24) / 9.2);
    const lines = wrap(words, maxChars);
    const h = lines.length * 22 + 28;
    g.appendChild(el('rect', { class: `ag-ex__box ${cls}`, x, y, width: w, height: h, rx: 8 }));
    lines.forEach((row, i) => {
      const t = el('text', { class: 'ag-ex__text', x: x + w / 2, y: y + 30 + i * 22, 'text-anchor': 'middle' });
      row.forEach((word, k) => {
        const span = el('tspan', { class: other.has(word) ? '' : hot }, word);
        t.appendChild(span);
        if (k < row.length - 1) t.appendChild(document.createTextNode(' '));
      });
      g.appendChild(t);
    });
    return h;
  }
  function arrow(x1, y1, x2, y2) {
    g.appendChild(el('line', { class: 'ag-ex__edge', x1, y1, x2, y2 }));
    const horizontal = y1 === y2;
    const pts = horizontal ? `${x2 + 8},${y2} ${x2 - 1},${y2 - 5} ${x2 - 1},${y2 + 5}` : `${x2},${y2 + 8} ${x2 - 5},${y2 - 1} ${x2 + 5},${y2 - 1}`;
    g.appendChild(el('polygon', { class: 'ag-ex__head', points: pts }));
  }

  function render() {
    const narrow = isNarrow();
    const ex = EXAMPLES[selected];
    const inWords = ex.input.split(' ');
    const outWords = ex.output.split(' ');
    g.replaceChildren();
    if (!narrow) {
      const hIn = textBox(20, 40, 270, inWords, new Set(outWords), 'is-in', 'is-fixed');
      g.appendChild(el('rect', { class: 'ag-ex__llm', x: 345, y: 50, width: 70, height: 50, rx: 8 }));
      g.appendChild(el('text', { class: 'ag-ex__label', x: 380, y: 80, 'text-anchor': 'middle' }, 'LLM'));
      const hOut = textBox(470, 40, 270, outWords, new Set(inWords), 'is-out', 'is-added');
      arrow(294, 75, 340, 75);
      arrow(420, 75, 466, 75);
      svg.setAttribute('viewBox', `0 0 760 ${Math.max(hIn, hOut) + 70}`);
    } else {
      const hIn = textBox(20, 10, 300, inWords, new Set(outWords), 'is-in', 'is-fixed');
      const y2 = 10 + hIn + 18;
      arrow(170, 10 + hIn + 2, 170, y2 + 8);
      g.appendChild(el('rect', { class: 'ag-ex__llm', x: 120, y: y2 + 12, width: 100, height: 40, rx: 8 }));
      g.appendChild(el('text', { class: 'ag-ex__label', x: 170, y: y2 + 38, 'text-anchor': 'middle' }, 'LLM'));
      const y3 = y2 + 52 + 18;
      arrow(170, y2 + 54, 170, y3 + 8);
      const hOut = textBox(20, y3 + 12, 300, outWords, new Set(inWords), 'is-out', 'is-added');
      svg.setAttribute('viewBox', `0 0 340 ${y3 + 12 + hOut + 12}`);
    }
    const fixed = inWords.filter((w) => !outWords.includes(w));
    const added = outWords.filter((w) => !inWords.includes(w));
    statusEl.textContent = `The LLM changed or added ${added.length} words${fixed.length ? ` and replaced ${fixed.length} misspelled or abbreviated ones` : ''}. The expanded query reaches the vector database in place of the original.`;
  }

  function setEx(i) {
    selected = i;
    chips.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ex) === selected)));
    render();
  }
  chips.forEach((b) => b.addEventListener('click', () => setEx(Number(b.dataset.ex))));

  setEx(0);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
