// Illustrative handbook paragraphs. Counts are whitespace-separated words,
// not embedding-model tokens. Oversized paragraphs stay visible for inspection.
export const PARAGRAPHS = [
  { id: 'P1', section: 'Export', label: 'Definition', text: 'A complete export includes project settings, documents, and attached files.' },
  { id: 'P2', section: 'Export', label: 'Procedure', text: 'Pause edits. Export the project, download the archive, and check its contents.' },
  { id: 'P3', section: 'Export', label: 'Exception', text: 'Linked files remain references in the archive. Download them separately before sharing a complete copy.' },
  { id: 'P4', section: 'Billing', label: 'Invoice', text: 'Open Billing, then Invoices, to download an invoice.' },
].map((paragraph) => ({ ...paragraph, wordCount: paragraph.text.split(/\s+/).length }));

export function groupParagraphs(paragraphs, cap, pack = false) {
  if (!Number.isInteger(cap) || cap < 1) throw new RangeError('The word cap must be a positive integer.');
  const groups = [];
  for (const paragraph of paragraphs) {
    const previous = groups.at(-1);
    if (pack && previous && previous.section === paragraph.section && previous.wordCount + paragraph.wordCount <= cap) {
      previous.paragraphs.push(paragraph);
      previous.wordCount += paragraph.wordCount;
    } else {
      groups.push({ section: paragraph.section, paragraphs: [paragraph], wordCount: paragraph.wordCount, oversized: paragraph.wordCount > cap });
    }
  }
  return groups;
}

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const color = (index) => `--chunk-color:var(--qi-cat-${index + 1});--chunk-soft:var(--qi-cat-${index + 1}-soft)`;
const sourceColor = (paragraph) => color(PARAGRAPHS.indexOf(paragraph));

export function mount(node) {
  node.classList.add('qi-chunk', 'qi-chunk--paragraph');
  node.innerHTML = `
    <div class="qi-fig">
      <p class="qi-chunk__lead">Keep each paragraph intact, or pack adjacent paragraphs within the same section.</p>
      <div class="qi-controls">
        <div class="qi-group" role="group" aria-label="Paragraph grouping">
          <button type="button" class="qi-chip" data-pack="false" aria-pressed="true">One per paragraph</button>
          <button type="button" class="qi-chip" data-pack="true" aria-pressed="false">Pack within section</button>
        </div>
        <div class="qi-group" role="group" aria-label="Paragraph word cap">
          <span class="qi-hint">Cap</span>
          ${[12, 24, 48].map((cap) => `<button type="button" class="qi-chip" data-cap="${cap}" aria-label="Paragraph cap ${cap} words" aria-pressed="false">${cap} words</button>`).join('')}
        </div>
        <button type="button" class="qi-chip" data-reset>Reset</button>
      </div>
      <div class="qi-chunk__panels">
        <div class="qi-chunk__panel">
          <p class="qi-frame-label qi-chunk__label">Source · 4 paragraphs</p>
          <div class="qi-chunk__chunks" data-paragraph-source></div>
        </div>
        <div class="qi-chunk__panel">
          <p class="qi-frame-label qi-chunk__label" data-output-label></p>
          <div class="qi-chunk__chunks" data-paragraph-output></div>
          <p class="qi-chunk__note">A section change ends a group even when more words would fit.</p>
        </div>
      </div>
      <p class="qi-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  let cap = 24;
  let pack = false;
  const source = node.querySelector('[data-paragraph-source]');
  const output = node.querySelector('[data-paragraph-output]');
  const label = node.querySelector('[data-output-label]');
  const status = node.querySelector('[role="status"]');

  function render() {
    const groups = groupParagraphs(PARAGRAPHS, cap, pack);
    const oversized = PARAGRAPHS.filter((paragraph) => paragraph.wordCount > cap);
    const totalWords = PARAGRAPHS.reduce((sum, paragraph) => sum + paragraph.wordCount, 0);
    node.querySelectorAll('[data-pack]').forEach((button) => button.setAttribute('aria-pressed', String((button.dataset.pack === 'true') === pack)));
    node.querySelectorAll('[data-cap]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.cap) === cap)));
    source.innerHTML = PARAGRAPHS.map((paragraph) => `<div class="qi-chunk__chunk${paragraph.wordCount > cap ? ' is-oversized' : ''}" style="${sourceColor(paragraph)}" data-paragraph="${paragraph.id}">
      <p class="qi-chunk__chunk-title">${paragraph.id} · ${escape(paragraph.section)} <span class="qi-chunk__badge">${paragraph.wordCount} words</span></p>
      <p class="qi-chunk__text">${escape(paragraph.text)}</p>
    </div>`).join('');
    label.textContent = `${groups.length} ${oversized.length ? 'units to inspect' : 'chunks'} · cap ${cap} words`;
    output.innerHTML = groups.map((group, index) => `<div class="qi-chunk__chunk${group.oversized ? ' is-oversized' : ''}" data-group="${index}" data-section="${escape(group.section)}">
      <p class="qi-chunk__chunk-title">${group.oversized ? 'Pending' : `C${index + 1}`} · ${escape(group.section)} <span class="qi-chunk__badge">${group.wordCount} words</span></p>
      <div class="qi-chunk__tokens">${group.paragraphs.map((paragraph) => `<span class="qi-chunk__token" style="${sourceColor(paragraph)}" data-member="${paragraph.id}">${paragraph.id} ${escape(paragraph.label)}</span>`).join('')}</div>
      ${group.oversized ? `<p class="qi-chunk__note"><b>Needs a finer split:</b> ${group.wordCount} words exceed the ${cap}-word cap.</p>` : ''}
    </div>`).join('');
    status.textContent = `${pack ? 'Pack adjacent paragraphs within each section.' : 'One paragraph per chunk.'} ` +
      `${groups.length} ${oversized.length ? 'units' : 'chunks'} retain all ${totalWords} source words. ` +
      (oversized.length ? `${oversized.map((paragraph) => paragraph.id).join(', ')} exceeds the cap and needs a finer split before embedding. ` : 'Every paragraph fits the selected cap. ') +
      'Billing stays separate from Export. Counts are words, not model tokens.';
  }

  node.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    if (button.hasAttribute('data-pack')) pack = button.dataset.pack === 'true';
    else if (button.hasAttribute('data-cap')) cap = Number(button.dataset.cap);
    else if (button.hasAttribute('data-reset')) {
      cap = 24;
      pack = false;
    } else return;
    render();
  });

  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}
