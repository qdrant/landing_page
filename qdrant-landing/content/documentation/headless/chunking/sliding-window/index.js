// Sentence windows over a short handbook excerpt. Counts refer to sentences,
// not embedding-model tokens; boundaries are supplied for this illustration.
export const SENTENCES = [
  { id: 'S1', text: 'Pause edits before exporting the project.' },
  { id: 'S2', text: 'Download the archive and check its contents.' },
  { id: 'S3', text: 'Linked files remain references in the archive.' },
  { id: 'S4', text: 'Download those files separately before sharing.' },
  { id: 'S5', text: 'Share the archive with the downloaded files.' },
  { id: 'S6', text: 'Open Billing to download an invoice.' },
];
export const WINDOW_SIZE = 3;

export function sentenceWindows(sentences, size, stride) {
  if (!Number.isInteger(size) || size < 1 || !Number.isInteger(stride) || stride < 1 || stride > size) {
    throw new RangeError('Use a positive sentence window and a stride between one and the window size.');
  }
  const chunks = [];
  for (let start = 0; start < sentences.length; start += stride) {
    const end = Math.min(start + size, sentences.length);
    chunks.push({ start, end, sentences: sentences.slice(start, end) });
    if (end === sentences.length) break;
  }
  return chunks;
}

const colorStyle = index => `--chunk-color:var(--qi-cat-${(index % 4) + 1});--chunk-soft:var(--qi-cat-${(index % 4) + 1}-soft)`;

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--sliding-window', 'qi-chunk--compact');
  node.innerHTML = `
    <div class="qi-fig">
      <p class="qi-chunk__lead">Move a three-sentence window through the source.</p>
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Sliding-window stride">
          <span class="qi-hint">Advance by</span>
          ${[3, 2, 1].map(stride => `<button type="button" class="qi-chip" data-stride="${stride}" aria-label="Stride ${stride} ${stride === 1 ? 'sentence' : 'sentences'}" aria-pressed="false">${stride} ${stride === 1 ? 'sentence' : 'sentences'}</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label">Source · 6 sentences</p>
          <div class="qi-chunk__sentences" data-source></div>
        </div>
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label" data-output-label></p>
          <div class="qi-group qi-chunk__range-list" role="group" aria-label="Select a sliding-window chunk" data-ranges></div>
          <div class="qi-chunk__chunk" data-selected></div>
        </div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let stride = 3;
  let selected = 0;
  const source = node.querySelector('[data-source]');
  const ranges = node.querySelector('[data-ranges]');
  const outputLabel = node.querySelector('[data-output-label]');
  const selectedChunk = node.querySelector('[data-selected]');
  const status = node.querySelector('[role="status"]');

  function render() {
    const chunks = sentenceWindows(SENTENCES, WINDOW_SIZE, stride);
    selected = Math.max(0, Math.min(selected, chunks.length - 1));
    const current = chunks[selected];
    const previousEnd = selected > 0 ? chunks[selected - 1].end : 0;
    const repeated = chunks.reduce((total, chunk) => total + chunk.sentences.length, 0) - SENTENCES.length;
    const pairChunks = chunks.flatMap((chunk, index) => chunk.start <= 2 && chunk.end >= 4 ? [index + 1] : []);

    node.querySelectorAll('[data-stride]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stride) === stride)));
    source.innerHTML = SENTENCES.map((sentence, index) => {
      const inCurrent = index >= current.start && index < current.end;
      const isRepeated = inCurrent && index < previousEnd;
      return `<div class="qi-chunk__sentence${inCurrent ? ' is-selected' : ''}${isRepeated ? ' is-overlap' : ''}" data-sentence="${sentence.id}" style="${inCurrent ? colorStyle(selected) : '--chunk-color:var(--qi-line);--chunk-soft:transparent'}">
        <p class="qi-chunk__text"><b>${sentence.id}</b> ${sentence.text}</p>
      </div>`;
    }).join('');
    outputLabel.textContent = `${chunks.length} chunks · ${WINDOW_SIZE - stride} sentence${WINDOW_SIZE - stride === 1 ? '' : 's'} overlap`;
    ranges.innerHTML = chunks.map((chunk, index) => `<button type="button" class="qi-chip qi-chunk__range" style="${colorStyle(index)}" data-chunk="${index}" aria-label="Select chunk ${index + 1}, sentences ${chunk.start + 1} through ${chunk.end}" aria-pressed="${index === selected}"><span>C${index + 1}</span><small>S${chunk.start + 1}–S${chunk.end}</small></button>`).join('');
    selectedChunk.setAttribute('style', colorStyle(selected));
    selectedChunk.innerHTML = `<p class="qi-chunk__chunk-title">Chunk ${selected + 1} <span class="qi-chunk__badge">${current.sentences.length} sentences</span></p>
      <div class="qi-chunk__tokens">${current.sentences.map((sentence, index) => `<span class="qi-chunk__token${current.start + index < previousEnd ? ' is-overlap' : ''}" data-selected-sentence="${sentence.id}">${sentence.id}</span>`).join('')}</div>`;

    const dependency = pairChunks.length
      ? `S3 and S4 stay together in ${pairChunks.map(index => `C${index}`).join(' and ')}.`
      : 'S3 and S4 are split across chunks.';
    status.textContent = `${chunks.length} chunks; ${repeated} repeated sentence appearances. ${dependency}`;
  }

  node.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    const rangeChanged = button.hasAttribute('data-chunk');
    if (button.hasAttribute('data-stride')) {
      stride = Number(button.dataset.stride);
      selected = 0;
    } else if (rangeChanged) {
      selected = Number(button.dataset.chunk);
    } else if (button.hasAttribute('data-reset')) {
      stride = 3;
      selected = 0;
    } else return;
    render();
    if (rangeChanged) ranges.querySelector(`[data-chunk="${selected}"]`).focus({ preventScroll: true });
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
