// BERT: bert-base-uncased, last layer, token "right", first 3 of 768 values.
// Word2Vec values are illustrative, not measurements from that model.
const SENTENCES = ['Your answer is right', 'turn right at the corner', 'everyone has the right to freedom of speech'];
const BERT = [[-0.31, -0.57, 0.09], [0.05, 0.15, 0.24], [0.29, 0.01, 0.38]];
const WORD2VEC = '[0.4, -0.1, -1.2, ...]';

export function mount(node) {
  node.classList.add('qi-cv');
  node.innerHTML = `<div class="qi-fig">
    <div class="qi-controls"><div class="qi-group" role="group" aria-label="Embedding model">
      ${['Word2Vec', 'BERT'].map(model => `<button type="button" class="qi-chip" data-model="${model}" aria-pressed="false">${model}</button>`).join('')}
    </div></div>
    <div class="qi-cv__diagram">
      <svg class="qi-svg qi-cv__wires" aria-hidden="true"><path/><path/><path/></svg>
      <div class="qi-cv__sentences">${SENTENCES.map(sentence => `<div class="qi-cv__sentence">${sentence.replace('right', '<span class="qi-cv__word">right</span>')}</div>`).join('')}</div>
      <div class="qi-cv__vectors">
        ${BERT.map(values => `<div class="qi-cv__vector"><span class="qi-label">[${values.map(value => value.toFixed(2)).join(', ')}, ...]</span><span>first 3 of 768</span></div>`).join('')}
        <div class="qi-cv__shared" hidden><span class="qi-label">${WORD2VEC}</span><span>illustrative</span></div>
      </div>
    </div>
    <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;
  const diagram = node.querySelector('.qi-cv__diagram');
  const svg = node.querySelector('svg');
  const paths = [...svg.children];
  const sentences = [...node.querySelectorAll('.qi-cv__sentence')];
  const vectors = [...node.querySelectorAll('.qi-cv__vector')];
  const shared = node.querySelector('.qi-cv__shared');
  const buttons = [...node.querySelectorAll('button')];
  const status = node.querySelector('.qi-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'BERT';
  let geometry = null;
  let raf = 0;

  function connectors(animate = false) {
    cancelAnimationFrame(raf);
    const bounds = diagram.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, bounds.width)} ${Math.max(1, bounds.height)}`);
    const target = sentences.map((sentence, i) => {
      const a = sentence.getBoundingClientRect();
      const b = (mode === 'BERT' ? vectors[i] : shared).getBoundingClientRect();
      const x1 = a.right - bounds.left;
      const y1 = a.top + a.height / 2 - bounds.top;
      // In the stacked layout, use the reserved outer gutter, never the text.
      const stacked = b.left < a.right;
      const x2 = (stacked ? b.right : b.left) - bounds.left;
      const y2 = b.top + b.height / 2 - bounds.top;
      const mid = stacked ? bounds.width - 12 : (x1 + x2) / 2;
      return [x1, y1, mid, y1, mid, y2, x2, y2];
    });
    const from = geometry || target;
    const began = performance.now();
    function draw(now) {
      const t = !animate || reduced.matches ? 1 : Math.min(1, (now - began) / 280);
      const eased = 1 - (1 - t) ** 3;
      geometry = target.map((points, i) => points.map((value, j) => from[i][j] + (value - from[i][j]) * eased));
      geometry.forEach((p, i) => paths[i].setAttribute('d', `M${p[0]},${p[1]} L${p[2]},${p[3]} L${p[4]},${p[5]} L${p[6]},${p[7]}`));
      if (t < 1 && node.isConnected) raf = requestAnimationFrame(draw);
    }
    draw(began);
  }

  function select(next, animate = true) {
    mode = next;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.model === mode)));
    vectors.forEach(vector => { vector.hidden = mode !== 'BERT'; });
    shared.hidden = mode !== 'Word2Vec';
    status.textContent = mode === 'BERT'
      ? 'Cosine similarity: 0.26 (answer, turn), 0.25 (answer, speech), 0.40 (turn, speech).'
      : 'Cosine similarity: 1.00, the same vector in every sentence.';
    connectors(animate);
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.model)));
  // Mode changes preserve the diagram's size, so the observer only handles
  // CSS arrival, article resizing, and text reflow without interrupting motion.
  new ResizeObserver(() => connectors()).observe(diagram);
  select('BERT', false);
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
