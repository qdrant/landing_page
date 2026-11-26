// The same source is displayed in the guide. Headings are not counted.
// Ranges use zero-based, half-open word offsets until they are rendered.
export const SENTENCES = [
  'A complete export includes settings, documents, and attached files.',
  'Pause edits, export the project, and check the archive.',
  'Linked files appear as references in the archive.',
  'Download linked files separately before sharing a full copy.',
  'Open Billing to find your invoices.',
];

export const WORDS = SENTENCES.join(' ').split(/\s+/);

export function wordWindows(length, size, overlap = 0) {
  if (!Number.isInteger(length) || length < 0 || !Number.isInteger(size) || size < 1
      || !Number.isInteger(overlap) || overlap < 0 || overlap >= size) {
    throw new RangeError('Use a nonnegative word count, positive window, and smaller overlap.');
  }
  const ranges = [];
  for (let start = 0; start < length; start += size - overlap) {
    const end = Math.min(start + size, length);
    ranges.push([start, end]);
    if (end === length) break;
  }
  return ranges;
}

let position = 0;
export const SENTENCE_RANGES = SENTENCES.map(sentence => {
  const start = position;
  position += sentence.split(/\s+/).length;
  return [start, position];
});

export const PARAGRAPH_RANGES = [
  [SENTENCE_RANGES[0][0], SENTENCE_RANGES[1][1]],
  [SENTENCE_RANGES[2][0], SENTENCE_RANGES[3][1]],
  SENTENCE_RANGES[4],
];

export const STRATEGIES = [
  { id: 'fixed', name: 'Fixed', setting: '12 words, no overlap', ranges: wordWindows(WORDS.length, 12) },
  { id: 'sentence', name: 'Sentence', setting: 'One sentence per chunk', ranges: SENTENCE_RANGES },
  { id: 'paragraph', name: 'Paragraph', setting: 'One paragraph per chunk', ranges: PARAGRAPH_RANGES },
  { id: 'sliding-window', name: 'Sliding window', setting: '12 words, 4-word overlap', ranges: wordWindows(WORDS.length, 12, 4) },
  // These two choices illustrate possible outputs; no model is run.
  { id: 'semantic', name: 'Semantic', setting: 'Illustrative topic boundary', ranges: [[0, 35], [35, WORDS.length]] },
  { id: 'agentic', name: 'Agentic', setting: 'Scripted boundary decision', ranges: [[0, 35], [35, WORDS.length]] },
  // Every paragraph already fits the cap, so a finer recursive split is unused.
  { id: 'recursive', name: 'Recursive', setting: '24-word cap, paragraphs first', ranges: PARAGRAPH_RANGES },
];

export function repeatedPositions(ranges, index) {
  if (!index) return [];
  const [start, end] = ranges[index];
  const prior = new Set(ranges.slice(0, index).flatMap(([first, last]) =>
    Array.from({ length: last - first }, (_, offset) => first + offset)));
  return Array.from({ length: end - start }, (_, offset) => start + offset)
    .filter(word => prior.has(word));
}
