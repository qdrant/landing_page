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
  node.classList.add('qi-chunk', 'qi-chunk--agentic');
  node.innerHTML = `
    <div class="qi-fig">
      <p class="qi-chunk__lead">Change the text window, then reveal a scripted boundary decision.</p>
      <div class="qi-controls qi-controls--split">
        <div class="qi-group" role="group" aria-label="Text supplied to the chunking model">
          ${WINDOWS.map(window => `<button type="button" class="qi-chip" data-window="${window.end}" aria-pressed="false">${window.label}<small>${window.range}</small></button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <p class="qi-chunk__note">Scripted illustration. No model is called; an actual model may choose another boundary.</p>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label">1. Supply a source window</p>
          <div class="qi-chunk__sentences" data-source></div>
        </div>
        <div class="qi-chunk__panel">
          <p class="qi-chunk__label qi-frame-label">2. Model selects a position</p>
          <p class="qi-chunk__instruction">Example instruction: Keep a procedure with its conditions when they fit.</p>
          <div class="qi-chunk__decision" data-decision></div>
          <div class="qi-controls"><button type="button" class="qi-chip" data-reveal>Show example decision</button></div>
          <div class="qi-chunk__flow-arrow" aria-hidden="true">↓</div>
          <p class="qi-chunk__label qi-frame-label">3. Slice the source text</p>
          <div data-result></div>
        </div>
      </div>
      <p class="qi-status qi-status--2" role="status" aria-live="polite" aria-atomic="true"></p>
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
    source.innerHTML = SENTENCES.map((sentence, index) => `
      <div class="qi-chunk__sentence ${index < windowEnd ? 'is-in-window' : 'is-outside'}" data-sentence="${sentence.id}" style="--chunk-color:var(--qi-cat-1);--chunk-soft:var(--qi-cat-1-soft)">
        <p class="qi-chunk__sentence-head"><b>${sentence.id}</b><span>${sentence.label}</span><span class="qi-chunk__badge">${index < windowEnd ? 'In window' : 'Outside input'}</span></p>
        <p class="qi-chunk__text">${sentence.text}</p>
      </div>${revealed && index === windowEnd - 1 ? `<div class="qi-chunk__cut-line">Selected cut after ${sentence.id}</div>` : ''}`).join('');

    revealButton.textContent = revealed ? 'Hide example decision' : 'Show example decision';
    revealButton.setAttribute('aria-expanded', String(revealed));
    decision.innerHTML = revealed
      ? `<span class="qi-chunk__badge">Example response</span><p class="qi-chunk__chunk-title">Split after ${example.splitAfter}</p><p class="qi-chunk__text">Character position ${example.characterPosition} in the displayed source window.</p>`
      : '<p class="qi-chunk__text">The model receives only the sentences marked In window. It returns a boundary position.</p>';
    result.innerHTML = revealed
      ? `<div class="qi-chunk__chunk" data-output style="--chunk-color:var(--qi-cat-3);--chunk-soft:var(--qi-cat-3-soft)">
          <p class="qi-chunk__chunk-title">Chunk: S1–${example.splitAfter}</p>
          <p class="qi-chunk__text">${example.text}</p>
          <p class="qi-chunk__note">Source wording retained.</p>
        </div>`
      : '<p class="qi-chunk__note">The selected span will be copied from the source. The model is not rewriting it.</p>';

    const effect = windowEnd === 2
      ? 'The linked-file exception is outside the model input, so it cannot guide this decision.'
      : 'The input includes the linked-file exception. This example keeps it with the export steps.';
    status.textContent = revealed
      ? `Scripted decision: split after ${example.splitAfter}, at character ${example.characterPosition}. ${effect}`
      : `Input window: S1 through S${windowEnd}, ${example.characterPosition} characters with single spaces between sentences. ${effect} Reveal the example to see the source slice.`;
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
