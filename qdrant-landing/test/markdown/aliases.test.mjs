import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

/*
 * Guards scripts/emit-md-aliases.sh, which publishes every /path/index.md a
 * second time as /path.md so the markdown of a page can be reached by swapping
 * its extension, the form a client can guess without first fetching the HTML.
 *
 * Builds once into a temp dir and runs the script over it, rather than asserting
 * on a checked-in fixture: the thing worth protecting is the shape of the real
 * build output, which is what a hosting change would break.
 */
// A full build is ~1.4 GB, so a run that leaves its temp directory behind costs
// more disk than most people notice until the volume is full. Clean up even when
// a test throws.
let built = null;
process.on('exit', () => {
  if (built) rmSync(built.out, { recursive: true, force: true });
});

function buildAndAlias() {
  if (built) return built;
  const out = mkdtempSync(join(tmpdir(), 'md-alias-'));
  execFileSync('hugo', ['--baseURL', 'http://localhost:1313/',
    '--destination', out, '--logLevel', 'error'], { stdio: 'pipe' });
  const log = execFileSync('bash', ['scripts/emit-md-aliases.sh', out], { encoding: 'utf8' });
  built = { out, log };
  return built;
}

function everyIndexMd(root) {
  const found = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.md') found.push(p);
    }
  })(root);
  return found;
}

test('every index.md gains a sibling .md alias with identical bytes', () => {
  const { out } = buildAndAlias();
  const sources = everyIndexMd(out);
  assert.ok(sources.length > 100, `expected a real build, found ${sources.length} index.md files`);

  const missing = [];
  const differing = [];
  for (const src of sources) {
    const dir = dirname(src);
    if (dir === out) continue; // site root would write outside the publish dir
    const alias = `${dir}.md`;
    if (!existsSync(alias)) { missing.push(alias); continue; }
    if (readFileSync(alias, 'utf8') !== readFileSync(src, 'utf8')) differing.push(alias);
  }
  assert.deepEqual(missing, [], 'these pages have no .md alias');
  assert.deepEqual(differing, [], 'these aliases do not match their index.md');
});

test('the canonical /index.md form is preserved, not replaced', () => {
  // /llms.txt advertises 670 index.md URLs. The aliases are additions; moving
  // them would break every link already published.
  const { out } = buildAndAlias();
  const canonical = join(out, 'articles', 'immutable-data-structures', 'index.md');
  assert.ok(existsSync(canonical), 'the original index.md must still be published');
  assert.ok(existsSync(join(out, 'articles', 'immutable-data-structures.md')),
    'and the alias must sit beside it');
  assert.ok(existsSync(join(out, 'articles', 'immutable-data-structures', 'index.html')),
    'the HTML page must be untouched');
});

test('nothing is written outside the publish directory', () => {
  const { out } = buildAndAlias();
  assert.ok(!existsSync(`${out}.md`), 'the site root must not produce a sibling of the publish dir');
});

test('an existing file is never overwritten', () => {
  const { out } = buildAndAlias();
  // Second run: every alias now exists, so all of them must be reported skipped.
  const again = execFileSync('bash', ['scripts/emit-md-aliases.sh', out], { encoding: 'utf8' });
  assert.match(again, /wrote 0, skipped \d+/, `expected an idempotent second run, got: ${again}`);
});
