// Illustrative recursive splitter with an explicit custom hierarchy:
// paragraphs -> sentences -> words, then greedy packing with no overlap.
// This is a word-count teaching example, not LangChain's default separator list.
export const SOURCE_PARAGRAPHS = [
  'Pause all edits before exporting. Download the archive and check its contents.',
  'Linked files still remain references in the archive. Download those files separately and include them when sharing the complete original project copy so recipients can reliably access every attached file.',
  'Open Billing. Download the invoice.',
];
export const SOURCE_WORDS = SOURCE_PARAGRAPHS.join(' ').split(/\s+/);

function initialUnits() {
  let start = 0;
  return SOURCE_PARAGRAPHS.map((text, paragraph) => {
    const words = text.split(/\s+/);
    const unit = { id: `P${paragraph + 1}`, parent: null, paragraph, kind: 'paragraph', start, end: start + words.length, words };
    start = unit.end;
    return unit;
  });
}

function splitSentences(unit) {
  let start = unit.start;
  return unit.words.join(' ').match(/[^.!?]+(?:[.!?]+|$)/g).map((sentence, i) => {
    const words = sentence.trim().split(/\s+/);
    const child = { id: `${unit.id}.${i + 1}`, parent: unit.id, paragraph: unit.paragraph, kind: 'sentence', start, end: start + words.length, words };
    start = child.end;
    return child;
  });
}

function splitWords(unit) {
  return unit.words.map((word, i) => ({ id: `${unit.id}.w${i + 1}`, parent: unit.id, paragraph: unit.paragraph, kind: 'word', start: unit.start + i, end: unit.start + i + 1, words: [word] }));
}

export function recursiveStages(cap) {
  if (!Number.isInteger(cap) || cap < 1) throw new RangeError('The word cap must be a positive integer.');
  const paragraphs = initialUnits();
  const sentences = paragraphs.flatMap((unit) => unit.words.length > cap ? splitSentences(unit) : [unit]);
  const words = sentences.flatMap((unit) => unit.words.length > cap ? splitWords(unit) : [unit]);
  const chunks = [];
  let current = [];
  let length = 0;
  const flush = () => {
    if (!current.length) return;
    chunks.push({ id: `C${chunks.length + 1}`, start: current[0].start, end: current[current.length - 1].end, units: current, words: current.flatMap((unit) => unit.words) });
    current = [];
    length = 0;
  };
  words.forEach((unit) => {
    if (length + unit.words.length > cap) flush();
    current.push(unit);
    length += unit.words.length;
  });
  flush();
  return { paragraphs, sentences, words, chunks };
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const color = (i) => `--chunk-color:var(--qi-cat-${(i % 4) + 1});--chunk-soft:var(--qi-cat-${(i % 4) + 1}-soft)`;
const STEPS = ['Paragraphs', 'Sentences', 'Words', 'Pack chunks'];
const NEXT = ['Split oversized paragraphs', 'Split oversized sentences', 'Pack neighboring units', 'All steps complete'];

function visibleUnits(units) {
  const rows = [];
  units.forEach((unit) => {
    const last = rows[rows.length - 1];
    if (unit.kind === 'word' && last && last.kind === 'word-group' && last.id === unit.parent) {
      last.words.push(...unit.words);
      last.end = unit.end;
    } else if (unit.kind === 'word') {
      rows.push({ ...unit, id: unit.parent, kind: 'word-group', words: [...unit.words] });
    } else rows.push(unit);
  });
  return rows;
}

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--compact', 'qi-chunk--recursive');
  node.innerHTML = `
    <div class="qi-fig">
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Recursive chunk word cap">
          <span class="qi-hint">Cap</span>
          ${[12, 24, 36].map((n) => `<button type="button" class="qi-chip" data-cap="${n}" aria-label="Recursive cap ${n} words" aria-pressed="false">${n} words</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-next></button>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <ol class="qi-chunk__steps" aria-label="Recursive splitting stages">
        ${STEPS.map((name, i) => `<li data-step="${i}"><span class="qi-chunk__step-number">${i + 1}</span>${name}</li>`).join('')}
      </ol>
      <div class="qi-chunk__panel">
        <p class="qi-frame-label qi-chunk__label qi-chunk__stage-label"></p>
        <div class="qi-chunk__chunks qi-chunk__units"></div>
      </div>
      <p class="qi-chunk__note">Custom separators; word counts, not model tokens. No overlap.</p>
      <p class="qi-status qi-chunk__status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let cap = 12;
  let step = 0;
  const stageLabel = node.querySelector('.qi-chunk__stage-label');
  const unitsEl = node.querySelector('.qi-chunk__units');
  const statusEl = node.querySelector('.qi-chunk__status');
  const nextButton = node.querySelector('[data-next]');

  function render() {
    const stages = recursiveStages(cap);
    const units = [stages.paragraphs, stages.sentences, stages.words, stages.chunks][step];
    node.querySelectorAll('[data-cap]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.cap) === cap)));
    node.querySelectorAll('[data-step]').forEach((item) => {
      const i = Number(item.dataset.step);
      item.classList.toggle('is-current', i === step);
      item.classList.toggle('is-done', i < step);
      if (i === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    nextButton.textContent = NEXT[step];
    nextButton.disabled = step === 3;
    stageLabel.textContent = `${step + 1}. ${STEPS[step]} · cap ${cap}`;

    if (step === 3) {
      unitsEl.innerHTML = stages.chunks.map(chunk => `
        <div class="qi-chunk__chunk" style="--chunk-color:var(--qi-line);--chunk-soft:transparent">
          <p class="qi-chunk__chunk-title">${chunk.id} · ${chunk.words.length} words <span class="qi-chunk__note">(source ${chunk.start + 1}–${chunk.end})</span></p>
          <p class="qi-chunk__text">${escape(chunk.words.join(' '))}</p>
        </div>`).join('');
      statusEl.innerHTML = `<b>${stages.chunks.length} chunks</b>, each at most ${cap} words. All <b>${SOURCE_WORDS.length} source words</b> survive in order.`;
      return;
    }

    unitsEl.innerHTML = visibleUnits(units).map((unit) => {
      const wordGroup = unit.kind === 'word-group';
      const oversized = !wordGroup && unit.words.length > cap;
      const tag = wordGroup ? `${unit.words.length} one-word units` : oversized ? `${unit.words.length} words · split next` : `${unit.words.length} words · keep intact`;
      const body = wordGroup
        ? `<p class="qi-chunk__text qi-chunk__word-units">${unit.words.map(escape).join(' · ')}</p>`
        : `<p class="qi-chunk__text">${escape(unit.words.join(' '))}</p>`;
      return `<div class="qi-chunk__chunk${oversized ? ' is-oversized' : ''}${wordGroup ? ' qi-chunk__word-group' : ''}" style="${color(unit.paragraph)}"><p class="qi-chunk__chunk-title">${unit.id} <span class="qi-chunk__badge">${tag}</span></p>${body}</div>`;
    }).join('');

    const oversized = units.filter((unit) => unit.words.length > cap);
    if (step === 0) {
      statusEl.innerHTML = `<b>${stages.paragraphs.length - oversized.length} of ${stages.paragraphs.length} paragraphs fit</b> the ${cap}-word cap. ` +
        (oversized.length ? `${oversized.map((unit) => unit.id).join(', ')} will split at sentence boundaries; the other paragraphs stay intact.` : 'No paragraph needs a finer split.');
    } else if (step === 1) {
      const splitParents = stages.paragraphs.filter((unit) => unit.words.length > cap);
      statusEl.innerHTML = (splitParents.length ? `Only <b>${splitParents.map((unit) => unit.id).join(', ')}</b> split into sentences. ` : 'No paragraph was split. ') +
        (oversized.length ? `<b>${oversized.map((unit) => unit.id).join(', ')}</b> still exceeds ${cap} words and needs word boundaries.` : `Every unit fits; no word-level split is needed.`);
    } else {
      const splitSentences = stages.sentences.filter((unit) => unit.words.length > cap);
      statusEl.innerHTML = (splitSentences.length ? `<b>${splitSentences.map((unit) => unit.id).join(', ')}</b> became individual word units. ` : 'No word-level split was needed. ') +
        `Pack neighboring units up to <b>${cap} words</b>.`;
    }
  }

  node.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    if (button.hasAttribute('data-cap')) {
      cap = Number(button.dataset.cap);
      step = 0;
    } else if (button.hasAttribute('data-next')) step = Math.min(step + 1, 3);
    else if (button.hasAttribute('data-reset')) {
      cap = 12;
      step = 0;
    } else return;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
