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
  node.classList.add('qi-chunk', 'qi-chunk--semantic');
  node.innerHTML = `
    <div class="qi-fig">
      <p class="qi-chunk__lead">Move the threshold to change which neighboring sentences stay together.</p>
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Semantic similarity threshold">
          <span class="qi-hint">Split below:</span>
          ${THRESHOLDS.map(value => `<button type="button" class="qi-chip" data-threshold="${value}" aria-pressed="false">${value.toFixed(2)}</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <p class="qi-chunk__note">Illustrative similarity scores. No embedding model runs in this demo.</p>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label">Compare adjacent sentence embeddings</p>
          <p class="qi-chunk__note">Bar: similarity. Marker: selected threshold.</p>
          <div class="qi-chunk__sentences" data-source></div>
        </div>
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label" data-output-label></p>
          <div class="qi-chunk__chunks" data-chunks></div>
          <p class="qi-chunk__note">Sentence order and wording stay the same. Only the boundaries change.</p>
        </div>
      </div>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const source = node.querySelector('[data-source]');
  const chunks = node.querySelector('[data-chunks]');
  const outputLabel = node.querySelector('[data-output-label]');
  const status = node.querySelector('.qi-status');
  const buttons = [...node.querySelectorAll('[data-threshold]')];
  let threshold = 0.65;

  function render() {
    const groups = groupBySimilarity(SENTENCES, SIMILARITIES, threshold);
    const groupFor = new Map(groups.flatMap((group, index) => group.map(sentence => [sentence.id, index])));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.threshold) === threshold)));

    source.innerHTML = SENTENCES.map((sentence, index) => {
      const score = SIMILARITIES[index];
      const boundary = score == null ? '' : `
        <div class="qi-chunk__similarity ${score < threshold ? 'is-cut' : 'is-kept'}" data-boundary="${index + 1}">
          <div class="qi-chunk__similarity-label">
            <span>${sentence.id} / ${SENTENCES[index + 1].id}: <b>${score.toFixed(2)}</b></span>
            <strong>${score < threshold ? 'Split' : 'Keep'}</strong>
          </div>
          <div class="qi-chunk__meter" aria-hidden="true"><span class="qi-chunk__meter-fill" style="width:${score * 100}%"></span><span class="qi-chunk__meter-threshold" style="left:${threshold * 100}%"></span></div>
        </div>`;
      return `<div class="qi-chunk__sentence" data-sentence="${sentence.id}" style="${colorStyle(groupFor.get(sentence.id))}">
          <p class="qi-chunk__sentence-head"><b>${sentence.id}</b><span>${sentence.label}</span></p>
          <p class="qi-chunk__text">${sentence.text}</p>
        </div>${boundary}`;
    }).join('');

    outputLabel.textContent = `${groups.length} resulting chunks`;
    chunks.innerHTML = groups.map((group, index) => `
      <div class="qi-chunk__chunk" style="${colorStyle(index)}" data-chunk="${index + 1}">
        <p class="qi-chunk__chunk-title">Chunk ${index + 1}</p>
        <div class="qi-chunk__tokens">${group.map(sentence => `<span class="qi-chunk__token">${sentence.id}</span>`).join('')}</div>
        <p class="qi-chunk__text">${group.map(sentence => sentence.label).join(' + ')}</p>
      </div>`).join('');

    const boundaryText = threshold === 0.35
      ? 'Only the 0.18 export-to-billing boundary splits; S1 through S4 stay together.'
      : threshold === 0.65
        ? 'The 0.56 boundary also splits, separating the export steps from the linked-file exception.'
        : 'Every illustrated score is below 0.85, so every sentence becomes its own chunk.';
    status.textContent = `Threshold ${threshold.toFixed(2)}: ${groups.length} chunks. ${boundaryText} A similarity boundary does not prove the evidence is complete.`;
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
