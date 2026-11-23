// Checks the Accept parsing and the page allowlist in netlify/edge-functions/agents.ts.
//
//   node --experimental-strip-types automation/agent-access/markdown-negotiation.test.ts

import assert from "node:assert/strict";
import { MARKDOWN_PAGES, prefersMarkdown } from "../../netlify/edge-functions/agents.ts";

const cases: [string | null, boolean][] = [
  [null, false],
  ["", false],
  ["*/*", false],
  ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false],
  ["text/markdown", true],
  ["text/markdown, text/html;q=0.5", true],
  ["text/markdown;q=0.9, text/html", false],
  ["text/html;q=0.5, text/markdown;q=0.9", true],
  ["text/markdown;q=0", false],
  ["TEXT/MARKDOWN; charset=utf-8", true],
  ["text/plain, text/markdown;q=0.8, */*;q=0.1", true],
];

for (const [accept, expected] of cases) {
  assert.equal(prefersMarkdown(accept), expected, `Accept: ${accept}`);
}
const paths: [string, boolean][] = [
  ["/documentation/", true],
  ["/documentation/search/hybrid-queries/", true],
  ["/articles/", true],
  ["/course/essentials/day-1/embedding-models/", true],
  ["/learn/", true],
  ["/blog/case-study-faz/", true],
  ["/blog/", false],
  ["/", false],
  ["/cloud/", false],
  ["/lp/rust/", false],
  ["/documentation/index.md", false],
  ["/documentation", false],
];
for (const [path, expected] of paths) {
  assert.equal(MARKDOWN_PAGES.test(path), expected, `path: ${path}`);
}
console.log(`ok: ${cases.length + paths.length} cases`);
