// Fixed word windows over an illustrative handbook excerpt. Words are the
// counting unit in this diagram; these are not embedding-model tokens.
export const SOURCE_TEXT = 'Pause edits before exporting the project. Download the archive and check its contents. Linked files remain references; download them separately before sharing a complete copy. Open Billing to download an invoice.';
export const SOURCE_WORDS = SOURCE_TEXT.split(/\s+/);

export function chunkWords(words, size, overlap) {
  if (!Number.isInteger(size) || size < 1 || !Number.isInteger(overlap) || overlap < 0 || overlap >= size) {
    throw new RangeError('The word window must be positive and overlap must be smaller than the window.');
  }
  const chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const end = Math.min(start + size, words.length);
    chunks.push({ start, end, words: words.slice(start, end) });
    if (end === words.length) break;
  }
  return chunks;
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const color = (i) => `--chunk-color:var(--qi-cat-${(i % 4) + 1});--chunk-soft:var(--qi-cat-${(i % 4) + 1}-soft)`;

function wordTile(word, index, classes = '') {
  return `<span class="qi-chunk__word ${classes}" data-word="${index + 1}" title="Word ${index + 1}">${escape(word)}</span>`;
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--fixed', 'qi-chunk--compact');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Fixed chunk window size">
          <span class="qi-hint">Window</span>
          ${[8, 12, 16].map((n) => `<button type="button" class="qi-chip" data-size="${n}" aria-label="Window length ${n} words" aria-pressed="false">${n} words</button>`).join('')}
        </div>
        <div class="qi-group" role="group" aria-label="Fixed chunk overlap">
          <span class="qi-hint">Overlap</span>
          ${[0, 3, 6].map((n) => `<button type="button" class="qi-chip" data-overlap="${n}" aria-label="Overlap ${n} words" aria-pressed="false">${n}</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-frame-label qi-chunk__label qi-chunk__output-label"></p>
          <div class="qi-group qi-chunk__range-list" role="group" aria-label="Select a fixed chunk"></div>
          <p class="qi-chunk__source-words" aria-label="Source text with selected chunk highlighted"></p>
        </div>
      </div>
      <p class="qi-status qi-chunk__status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let size = 12;
  let overlap = 0;
  let selected = 0;
  const sourceEl = node.querySelector('.qi-chunk__source-words');
  const outputLabel = node.querySelector('.qi-chunk__output-label');
  const rangeList = node.querySelector('.qi-chunk__range-list');
  const statusEl = node.querySelector('.qi-chunk__status');

  function render() {
    const chunks = chunkWords(SOURCE_WORDS, size, overlap);
    selected = Math.max(0, Math.min(selected, chunks.length - 1));
    const current = chunks[selected];
    const previousEnd = selected > 0 ? chunks[selected - 1].end : 0;
    const repeatEnd = Math.min(previousEnd, current.end);
    const repeated = chunks.reduce((sum, chunk) => sum + chunk.words.length, 0) - SOURCE_WORDS.length;
    const style = color(selected);

    node.querySelectorAll('[data-size]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.size) === size)));
    node.querySelectorAll('[data-overlap]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.overlap) === overlap)));
    sourceEl.setAttribute('style', style);
    sourceEl.innerHTML = SOURCE_WORDS.map((word, i) => wordTile(word, i, i >= current.start && i < current.end
      ? `is-selected${i < repeatEnd ? ' is-overlap' : ''}` : '')).join(' ');

    outputLabel.textContent = `${chunks.length} chunks from ${SOURCE_WORDS.length} words`;
    rangeList.innerHTML = chunks.map((chunk, i) => `<button type="button" class="qi-chip qi-chunk__range" style="${color(i)}" data-chunk="${i}" aria-pressed="${i === selected}" aria-label="Select chunk ${i + 1}, words ${chunk.start + 1} through ${chunk.end}">Chunk ${i + 1}<small>${chunk.start + 1}–${chunk.end}</small></button>`).join('');
    statusEl.textContent = `Chunk ${selected + 1}: words ${current.start + 1}–${current.end}. Advance ${size - overlap} words; ${repeated} repeated word appearances across all chunks.` +
      (overlap ? ' Dashed underlines mark overlap.' : ' A length boundary can cut a sentence.');
  }

  node.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    if (button.hasAttribute('data-size')) {
      size = Number(button.dataset.size);
      selected = 0;
    } else if (button.hasAttribute('data-overlap')) {
      overlap = Number(button.dataset.overlap);
      selected = 0;
    } else if (button.hasAttribute('data-chunk')) {
      selected = Number(button.dataset.chunk);
    } else if (button.hasAttribute('data-reset')) {
      size = 12;
      overlap = 0;
      selected = 0;
    } else return;
    // Keep an activated range button focused when its list is regenerated.
    const activeRange = button.hasAttribute('data-chunk');
    render();
    if (activeRange) rangeList.querySelector(`[data-chunk="${selected}"]`).focus({ preventScroll: true });
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
