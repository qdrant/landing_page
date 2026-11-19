// A scripted explanation of LLM-selected source boundaries, not a live LLM.
// The supplied input window changes what the model could consider.
export const SENTENCES = [
  { id: 'S1', label: 'Definition', text: 'A complete export includes settings, documents, and attached files.' },
  { id: 'S2', label: 'Steps', text: 'Pause edits, export the project, and check the archive.' },
  { id: 'S3', label: 'References', text: 'Linked files appear as references in the archive.' },
  { id: 'S4', label: 'Separate download', text: 'Download linked files separately before sharing a full copy.' },
  { id: 'S5', label: 'Billing', text: 'Open Billing to find your invoices.' },
];
const WINDOWS = [
  { end: 2, label: 'Through steps', range: 'S1–S2' },
  { end: 4, label: 'Through exception', range: 'S1–S4' },
];

export function exampleDecision(windowEnd) {
  if (windowEnd !== 2 && windowEnd !== 4) throw new Error('Unsupported example window.');
  const sentences = SENTENCES.slice(0, windowEnd);
  const text = sentences.map(sentence => sentence.text).join(' ');
  return { windowEnd, splitAfter: sentences[sentences.length - 1].id, characterPosition: text.length, sentences, text };
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--compact', 'qi-chunk--agentic');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Text supplied to the chunking model">
          ${WINDOWS.map(window => `<button type="button" class="qi-chip" data-window="${window.end}" aria-pressed="false">${window.label}<small>${window.range}</small></button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <p class="qi-chunk__note">Scripted decisions; no model runs here.</p>
      <div class="qi-chunk__panel">
        <p class="qi-chunk__label qi-frame-label">Source supplied to the model</p>
        <div data-source></div>
        <p class="qi-chunk__note" data-outside></p>
        <button type="button" class="qi-chip" data-reveal>Show example decision</button>
        <div data-decision></div>
        <div data-result></div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const source = node.querySelector('[data-source]');
  const decision = node.querySelector('[data-decision]');
  const result = node.querySelector('[data-result]');
  const status = node.querySelector('.qi-status');
  const revealButton = node.querySelector('[data-reveal]');
  const buttons = [...node.querySelectorAll('[data-window]')];
  let windowEnd = 2;
  let revealed = false;

  function render() {
    const example = exampleDecision(windowEnd);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.window) === windowEnd)));
    source.innerHTML = `<div class="qi-chunk__chunk" ${revealed ? 'data-output' : ''} style="--chunk-color:var(--qi-cat-1);--chunk-soft:var(--qi-cat-1-soft)">
      <p class="qi-chunk__chunk-title">S1–S${windowEnd} · ${example.characterPosition} characters</p>
      <p class="qi-chunk__text">${example.sentences.map(sentence => `<span class="is-in-window" data-sentence="${sentence.id}" title="${sentence.id}: ${sentence.label}">${sentence.text}</span>`).join(' ')}</p>
    </div>`;
    node.querySelector('[data-outside]').textContent = `Not supplied: ${SENTENCES.slice(windowEnd).map(sentence => `${sentence.id} ${sentence.label.toLowerCase()}`).join('; ')}.`;

    revealButton.textContent = revealed ? 'Hide example decision' : 'Show example decision';
    revealButton.setAttribute('aria-expanded', String(revealed));
    decision.innerHTML = revealed
      ? `<p class="qi-chunk__cut-line">Split after ${example.splitAfter} · character ${example.characterPosition}</p>`
      : '';
    result.innerHTML = revealed
      ? `<p class="qi-chunk__note">Output: S1–${example.splitAfter}, copied unchanged from the source.</p>`
      : '';

    const effect = windowEnd === 2
      ? 'The linked-file exception is outside the input.'
      : 'This input can keep the linked-file exception with the steps.';
    status.textContent = revealed
      ? `Scripted decision: split after ${example.splitAfter}. ${effect}`
      : `Input: S1–S${windowEnd}. ${effect}`;
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    windowEnd = Number(button.dataset.window);
    revealed = false;
    render();
  }));
  revealButton.addEventListener('click', () => {
    revealed = !revealed;
    render();
  });
  node.querySelector('[data-reset]').addEventListener('click', () => {
    windowEnd = 2;
    revealed = false;
    render();
  });
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
