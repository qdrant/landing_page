import assert from 'node:assert/strict';
import test from 'node:test';
import { WORDS, SENTENCES, SENTENCE_RANGES, STRATEGIES, repeatedPositions, wordWindows } from './model.mjs';

test('word windows cover every source word and stop after reaching the end', () => {
  for (let length = 0; length < 70; length++) {
    for (const size of [1, 4, 12, 24]) {
      for (const overlap of [0, size - 1]) {
        const ranges = wordWindows(length, size, overlap);
        const covered = new Set();
        for (const [start, end] of ranges) {
          assert(end > start && end <= length && end - start <= size);
          for (let word = start; word < end; word++) covered.add(word);
        }
        assert.equal(covered.size, length);
        assert(ranges.slice(0, -1).every(([, end]) => end < length));
      }
    }
  }
  assert.throws(() => wordWindows(41, 12, 12), RangeError);
  assert.throws(() => wordWindows(41, 0, 0), RangeError);
});

test('all illustrated ranges retain source provenance and the overlap marks are exact', () => {
  assert.equal(WORDS.length, 41);
  SENTENCE_RANGES.forEach(([start, end], index) => assert.equal(WORDS.slice(start, end).join(' '), SENTENCES[index]));
  for (const strategy of STRATEGIES) {
    const occurrences = new Map();
    const marked = [];
    for (const [index, [start, end]] of strategy.ranges.entries()) {
      assert(Number.isInteger(start) && start >= 0 && end <= WORDS.length && end > start);
      marked.push(...repeatedPositions(strategy.ranges, index));
      for (let word = start; word < end; word++) occurrences.set(word, (occurrences.get(word) ?? 0) + 1);
    }
    assert.equal(occurrences.size, WORDS.length, strategy.name);
    const duplicates = [...occurrences.entries()].flatMap(([word, count]) => Array(count - 1).fill(word));
    assert.deepEqual(marked.sort((a, b) => a - b), duplicates.sort((a, b) => a - b));
    assert.equal(marked.length, strategy.id === 'sliding-window' ? 16 : 0);
  }
});
