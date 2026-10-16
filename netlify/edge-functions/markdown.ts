// Serve a page's Markdown output to clients that ask for it.
//
// Every page on the site is published twice: as HTML at /path/ and as Markdown
// at /path/index.md. An agent that requests /path/ with
// `Accept: text/markdown` preferred over text/html gets the Markdown, about a
// twentieth of the bytes. Everyone else gets the HTML, untouched.
//
// Only paths ending in a slash reach this function (see `config`), so assets
// never pay for it.

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
  pattern: "^/(.*/)?$",
};
