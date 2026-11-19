// Serve a page's Markdown output to clients that ask for it.
//
// Every page on the site is published twice: as HTML at /path/ and as Markdown
// at /path/index.md. An agent that requests /path/ with
// `Accept: text/markdown` preferred over text/html gets the Markdown, about a
// twentieth of the bytes. Everyone else gets the HTML, untouched.
//
// Netlify runs this function only for requests that could get Markdown (see
// `config`): paths ending in a slash, with `text/markdown` in the Accept
// header. Browsers, assets, and direct requests for index.md never invoke it.

import type { Config, Context } from "@netlify/edge-functions";

// True when the Accept header ranks text/markdown above text/html. A bare
// `*/*` or a missing header is a browser or a generic client: serve HTML.
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let markdown = 0;
  let html = 0;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const q = params
      .map((p) => p.trim().match(/^q=([0-9.]+)$/))
      .find(Boolean);
    const weight = q ? Number(q[1]) : 1;
    if (type.trim() === "text/markdown") markdown = Math.max(markdown, weight);
    if (type.trim() === "text/html") html = Math.max(html, weight);
  }
  return markdown > 0 && markdown > html;
}

export default async (request: Request, context: Context) => {
  if (!prefersMarkdown(request.headers.get("accept"))) return;

  const url = new URL(request.url);
  url.pathname += "index.md";
  const markdown = await fetch(url);
  // No Markdown for this page (the homepage, for one): fall through to HTML.
  if (!markdown.ok) return;

  const headers = new Headers(markdown.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept");
  headers.set("Content-Location", url.pathname);
  return new Response(markdown.body, { status: 200, headers });
};

export const config: Config = {
  // Page URLs only. Excludes .md files, CSS, JS, images, and llms.txt.
  pattern: "^/(.*/)?$",
  // Accept mentions text/markdown. prefersMarkdown() still checks the ranking.
  header: { accept: "text/markdown" },
};
