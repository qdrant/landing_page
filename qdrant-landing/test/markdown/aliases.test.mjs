import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// node --test test/markdown/aliases.test.mjs
const run = (dir) => execFileSync('bash', ['scripts/emit-md-aliases.sh', dir], { encoding: 'utf8' });

function fixture() {
  const out = mkdtempSync(join(tmpdir(), 'md-alias-'));
  mkdirSync(join(out, 'articles', 'foo'), { recursive: true });
  writeFileSync(join(out, 'articles', 'foo', 'index.md'), 'page\n');
  writeFileSync(join(out, 'index.md'), 'home\n');
  return out;
}

test('the site root does not write outside the publish directory', () => {
  const out = fixture();
  try {
    run(out);
    assert.ok(existsSync(join(out, 'articles', 'foo.md')), 'a page should gain its alias');
    assert.ok(!existsSync(`${out}.md`), 'the root must not produce a sibling of the publish dir');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('an existing file is never overwritten', () => {
  const out = fixture();
  try {
    writeFileSync(join(out, 'articles', 'foo.md'), 'hand written\n');
    run(out);
    assert.equal(execFileSync('cat', [join(out, 'articles', 'foo.md')], { encoding: 'utf8' }),
      'hand written\n', 'an existing alias must survive');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
