import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let cachedDir = null;

/** Build the site once per test process, with drafts, into a temp dir. */
export function buildSite() {
  if (cachedDir) return cachedDir;
  const out = mkdtempSync(join(tmpdir(), 'viz-build-'));
  execFileSync('hugo', [
    '--buildDrafts',
    '--baseURL', 'http://localhost:1313/',
    '--destination', out,
    '--logLevel', 'error',
  ], { stdio: 'pipe' });
  cachedDir = out;
  return out;
}

/** Rendered HTML of the draft fixture page. */
export function getFixtureHtml() {
  return readFileSync(join(buildSite(), 'blog', 'viz-fixtures', 'index.html'), 'utf8');
}

/** Rendered Markdown of the draft fixture page (config.toml: page = HTML + Markdown). */
export function getFixtureMarkdown() {
  return readFileSync(join(buildSite(), 'blog', 'viz-fixtures', 'index.md'), 'utf8');
}

/** Every index.md the build emitted, absolute paths. */
export function everyBuiltMarkdownFile() {
  const out = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  })(buildSite());
  return out;
}

/** Run a hugo build expected to FAIL; return combined stderr. */
export function buildExpectingFailure(extraArgs = []) {
  try {
    execFileSync('hugo', ['--buildDrafts', '--logLevel', 'error',
      '--destination', mkdtempSync(join(tmpdir(), 'viz-fail-')), ...extraArgs],
      { stdio: 'pipe' });
  } catch (err) {
    return `${err.stdout || ''}${err.stderr || ''}`;
  }
  throw new Error('Expected the Hugo build to fail, but it succeeded.');
}
