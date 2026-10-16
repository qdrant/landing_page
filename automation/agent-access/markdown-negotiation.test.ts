// Checks the Accept parsing in netlify/edge-functions/markdown.ts.
//
//   node --experimental-strip-types automation/agent-access/markdown-negotiation.test.ts

import assert from "node:assert/strict";
import { prefersMarkdown } from "../../netlify/edge-functions/markdown.ts";

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
console.log(`ok: ${cases.length} cases`);
