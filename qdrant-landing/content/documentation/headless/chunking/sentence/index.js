// An illustrative, already segmented excerpt. Word counts make the mechanism
// visible; real inputs need a sentence segmenter and the embedding tokenizer.
export const SENTENCES = [
  { id: 'S1', label: 'File references', text: 'Linked files appear as references in your archive.' },
  { id: 'S2', label: 'Separate download', text: 'Download those files separately before sharing a complete copy.' },
  { id: 'S3', label: 'Billing', text: 'Open Billing to download an invoice.' },
];
export const WORD_CAPS = [8, 12, 20];

const wordCount = text => text.trim() ? text.trim().split(/\s+/).length : 0;
const escape = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const colorStyle = index => `--chunk-color:var(--qi-cat-${(index % 4) + 1});--chunk-soft:var(--qi-cat-${(index % 4) + 1}-soft)`;

export function sentenceChunks(sentences, { group = false, cap = 20 } = {}) {
  if (!Number.isInteger(cap) || cap < 1) throw new RangeError('The word cap must be a positive integer.');
  const chunks = [];
  for (const sentence of sentences) {
    const count = wordCount(sentence.text);
    const previous = chunks.at(-1);
    if (group && previous && previous.wordCount + count <= cap) {
      previous.sentences.push(sentence);
      previous.wordCount += count;
    } else {
      // An oversized sentence stays visible and is flagged for a finer split.
      // Silently cutting it here would conceal the sentence-boundary limit.
      chunks.push({ sentences: [sentence], wordCount: count, oversized: count > cap });
    }
  }
  return chunks;
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--sentence');
  node.innerHTML = `
    <div class="qi-fig">
      <p class="qi-chunk__lead">Keep one sentence per chunk, or pack whole sentences within a word cap.</p>
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Sentence grouping">
          <button type="button" class="qi-chip" data-mode="single" aria-pressed="false">One sentence</button>
          <button type="button" class="qi-chip" data-mode="group" aria-pressed="false">Group sentences</button>
        </div>
        <div class="qi-group" role="group" aria-label="Grouped sentence word cap">
          <span class="qi-hint">Group cap</span>
          ${WORD_CAPS.map(cap => `<button type="button" class="qi-chip" data-cap="${cap}" aria-label="Group whole sentences with a ${cap}-word cap" aria-pressed="false">${cap} words</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-frame-label qi-chunk__label">Source · 3 sentences · 23 words</p>
          <div class="qi-chunk__sentences" data-source></div>
          <p class="qi-chunk__note">In S2, "those files" refers to the linked files in S1.</p>
        </div>
        <div class="qi-chunk__panel">
          <p class="qi-frame-label qi-chunk__label" data-output-label></p>
          <div class="qi-chunk__chunks" data-chunks></div>
          <p class="qi-chunk__note">Words illustrate size. They are not model tokens.</p>
        </div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let mode = 'single';
  let cap = 20;
  const source = node.querySelector('[data-source]');
  const output = node.querySelector('[data-chunks]');
  const outputLabel = node.querySelector('[data-output-label]');
  const status = node.querySelector('[role="status"]');

  function render() {
    const chunks = sentenceChunks(SENTENCES, { group: mode === 'group', cap });
    const groupFor = new Map(chunks.flatMap((chunk, index) => chunk.sentences.map(sentence => [sentence.id, index])));
    node.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    node.querySelectorAll('[data-cap]').forEach(button => button.setAttribute('aria-pressed', String(mode === 'group' && Number(button.dataset.cap) === cap)));

    source.innerHTML = SENTENCES.map(sentence => `
      <div class="qi-chunk__sentence" data-sentence="${sentence.id}" style="${colorStyle(groupFor.get(sentence.id))}">
        <p class="qi-chunk__sentence-head"><b>${sentence.id}</b><span>${sentence.label}</span><span class="qi-chunk__badge">${wordCount(sentence.text)} words</span></p>
        <p class="qi-chunk__text">${escape(sentence.text)}</p>
      </div>`).join('');

    outputLabel.textContent = `${chunks.length} ${mode === 'group' && chunks.some(chunk => chunk.oversized) ? 'candidate chunks' : 'chunks'}`;
    output.innerHTML = chunks.map((chunk, index) => `
      <div class="qi-chunk__chunk${mode === 'group' && chunk.oversized ? ' is-oversized' : ''}" data-chunk="${index + 1}" style="${colorStyle(index)}">
        <p class="qi-chunk__chunk-title">Chunk ${index + 1} <span class="qi-chunk__badge">${chunk.wordCount} words</span></p>
        <div class="qi-chunk__tokens">${chunk.sentences.map(sentence => `<span class="qi-chunk__token">${sentence.id}</span>`).join('')}</div>
        <p class="qi-chunk__text">${chunk.sentences.map(sentence => escape(sentence.text)).join(' ')}</p>
        ${mode === 'group' && chunk.oversized ? `<p class="qi-chunk__note"><b>Needs a finer split:</b> this sentence exceeds the ${cap}-word cap.</p>` : ''}
      </div>`).join('');

    if (mode === 'single') {
      status.textContent = '3 chunks, one per sentence. S2 keeps its wording but loses S1, which identifies "those files".';
    } else {
      const oversized = chunks.filter(chunk => chunk.oversized);
      const together = chunks.some(chunk => chunk.sentences.includes(SENTENCES[0]) && chunk.sentences.includes(SENTENCES[1]));
      status.textContent = `${cap}-word cap: ${chunks.length} ${oversized.length ? 'candidate chunks' : 'chunks'}. ` +
        (oversized.length ? 'S2 has 9 words and needs a finer split; no text is discarded. ' : 'Every chunk fits this word cap. ') +
        (together ? 'S1 and S2 now share a chunk, so "those files" has its referent.' : 'S1 and S2 remain separate, so S2 still needs its preceding context.');
    }
  }

  node.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    if (button.hasAttribute('data-mode')) mode = button.dataset.mode;
    else if (button.hasAttribute('data-cap')) {
      cap = Number(button.dataset.cap);
      mode = 'group';
    } else if (button.hasAttribute('data-reset')) {
      mode = 'single';
      cap = 20;
    } else return;
    render();
  });
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
