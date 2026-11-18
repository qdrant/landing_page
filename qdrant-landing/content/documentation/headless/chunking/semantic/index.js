// Illustrative boundary scores, not the output of an embedding model.
// The absolute-similarity rule deliberately differs from a percentile rule.
export const SENTENCES = [
  { id: 'S1', label: 'Definition', text: 'A complete export includes settings, documents, and attached files.' },
  { id: 'S2', label: 'Steps', text: 'Pause edits, export the project, and check the archive.' },
  { id: 'S3', label: 'References', text: 'Linked files appear as references in the archive.' },
  { id: 'S4', label: 'Separate download', text: 'Download linked files separately before sharing a full copy.' },
  { id: 'S5', label: 'Billing', text: 'Open Billing to find your invoices.' },
];
export const SIMILARITIES = [0.78, 0.56, 0.84, 0.18];
const THRESHOLDS = [0.35, 0.65, 0.85];

export function groupBySimilarity(sentences, similarities, threshold) {
  if (similarities.length !== Math.max(0, sentences.length - 1)) {
    throw new Error('Each adjacent sentence pair needs one similarity.');
  }
  if (!sentences.length) return [];
  const groups = [[sentences[0]]];
  for (let i = 1; i < sentences.length; i++) {
    if (similarities[i - 1] < threshold) groups.push([]);
    groups[groups.length - 1].push(sentences[i]);
  }
  return groups;
}

function colorStyle(index) {
  const category = (index % 4) + 1;
  return `--chunk-color:var(--qi-cat-${category});--chunk-soft:var(--qi-cat-${category}-soft)`;
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--compact', 'qi-chunk--semantic');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Semantic similarity threshold">
          <span class="qi-hint">Split below:</span>
          ${THRESHOLDS.map(value => `<button type="button" class="qi-chip" data-threshold="${value}" aria-pressed="false">${value.toFixed(2)}</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <p class="qi-chunk__note">Illustrative scores; no embedding model runs here.</p>
      <div class="qi-chunk__panel">
        <p class="qi-chunk__label qi-frame-label" data-output-label></p>
        <div class="qi-chunk__chunks" data-chunks></div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const chunks = node.querySelector('[data-chunks]');
  const outputLabel = node.querySelector('[data-output-label]');
  const status = node.querySelector('.qi-status');
  const buttons = [...node.querySelectorAll('[data-threshold]')];
  let threshold = 0.65;

  function render() {
    const groups = groupBySimilarity(SENTENCES, SIMILARITIES, threshold);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.threshold) === threshold)));

    outputLabel.textContent = `${groups.length} chunks`;
    chunks.innerHTML = groups.map((group, index) => {
      const rows = group.map(sentence => {
        const sourceIndex = SENTENCES.indexOf(sentence);
        const score = SIMILARITIES[sourceIndex];
        const kept = score != null && score >= threshold;
        return `<p class="qi-chunk__text" data-sentence="${sentence.id}"><span class="qi-chunk__token">${sentence.id}</span> ${sentence.text}</p>` +
          (kept ? `<p class="qi-chunk__boundary is-kept" data-boundary="${sourceIndex + 1}">Similarity ${score.toFixed(2)} ≥ ${threshold.toFixed(2)} · keep together</p>` : '');
      }).join('');
      const lastIndex = SENTENCES.indexOf(group.at(-1));
      const score = SIMILARITIES[lastIndex];
      const boundary = score == null ? '' : `<p class="qi-chunk__cut-line" data-boundary="${lastIndex + 1}">Similarity ${score.toFixed(2)} &lt; ${threshold.toFixed(2)} · split</p>`;
      return `<div class="qi-chunk__chunk" style="${colorStyle(index)}" data-chunk="${index + 1}">
        <p class="qi-chunk__chunk-title">Chunk ${index + 1}</p>${rows}
      </div>${boundary}`;
    }).join('');

    const boundaryText = threshold === 0.35
      ? 'Export stays together; billing separates.'
      : threshold === 0.65
        ? 'The 0.56 boundary separates export steps from their linked-file exception.'
        : 'Every sentence becomes its own chunk.';
    status.textContent = `Threshold ${threshold.toFixed(2)}: ${groups.length} chunks. ${boundaryText}`;
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    threshold = Number(button.dataset.threshold);
    render();
  }));
  node.querySelector('[data-reset]').addEventListener('click', () => {
    threshold = 0.65;
    render();
  });
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
