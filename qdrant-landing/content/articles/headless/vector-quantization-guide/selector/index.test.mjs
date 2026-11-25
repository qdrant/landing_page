import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./index.js', import.meta.url), 'utf8');
const { recommend } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const input = {
  vectors: 1e6, dims: 1024, imbalance: 0.15, rescore: true,
  target: 0.95, ramBytes: 2e9, priority: 'recall', metric: 'cosine', disk: false,
};

test('starts with 4-bit TurboQuant when both it and scalar meet the budget and target', () => {
  const result = recommend(input);
  assert.equal(result.rows.find(row => row.method.id === 'sq').verdict.ok, true);
  assert.equal(result.pick.method.id, 'tq4');
});

test('keeps float32 when it fits and meets the target', () => {
  assert.equal(recommend({ ...input, ramBytes: 8e9 }).pick.method.id, 'f32');
});

test('uses scalar for Manhattan distance', () => {
  assert.equal(recommend({ ...input, metric: 'manhattan' }).pick.method.id, 'sq');
});

test('uses scalar when it meets a recall target that 4-bit TurboQuant misses', () => {
  const result = recommend({ ...input, imbalance: 0.128, rescore: false, target: 0.975 });
  assert.equal(result.rows.find(row => row.method.id === 'tq4').verdict.tag, 'recall');
  assert.equal(result.pick.method.id, 'sq');
});

test('speed priority still chooses the fastest measured qualifying method', () => {
  const result = recommend({ ...input, priority: 'speed', imbalance: 0.128, target: 0.9 });
  assert.equal(result.pick.method.id, 'bq1');
});

test('offers unmeasured product x64 only when memory excludes measured candidates', () => {
  const result = recommend({ ...input, ramBytes: 1e8 });
  assert.equal(result.pick.method.id, 'pq64');
  assert.equal(result.pick.recall, null);
});
