// Handles requests from AI agents and crawlers: counts them, and serves a
// page's Markdown output to the ones that prefer it.
//
// Netlify classifies every request and sets the netlify-agent-category request
// header (browser, ai-agent, crawler, other, none). The `header` filter in
// `config` makes Netlify invoke this function only for ai-agent and crawler
// requests, so browser traffic never counts toward the edge function quota.
//
// Counting. Phase 1 deploys with no sink: the invocation count in the Netlify
// usage dashboard is the number of agent and crawler requests. Setting
// AGENT_LOG_URL in the Netlify UI (never in the repository) turns on one small
// JSON event per request, sent in the background, so logging never affects
// the response.
//
// Markdown. Every page is published twice: as HTML at /path/ and as Markdown
// at /path/index.md. An agent that requests /path/ with `Accept: text/markdown`
// preferred over text/html gets the Markdown, about a twentieth of the bytes.
// Every other request passes through untouched.
//
// Environment variables, all optional:
//   AGENT_LOG_URL     ingest endpoint; unset means do not log
//   AGENT_LOG_TOKEN   sent as `Authorization: Bearer <token>`
//   AGENT_LOG_SAMPLE  fraction of requests to send, 0..1, default 1

import type { Config, Context } from "https://edge.netlify.com";

const TIMEOUT_MS = 2000;
// Longer Accept values are cut to this many characters to keep events small.
const MAX_ACCEPT_LENGTH = 1024;

// Sends one event for the request to AGENT_LOG_URL. Returns the pending send,
// or undefined when logging is off or the request is sampled out.
function log(request: Request, context: Context): Promise<void> | undefined {
  const url = Netlify.env.get("AGENT_LOG_URL");
  if (!url) return;

  const parsed = Number(Netlify.env.get("AGENT_LOG_SAMPLE") ?? "1");
  const sample = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;
  if (sample <= 0) return;
  if (sample < 1 && Math.random() >= sample) return;

  // No query string, cookies, IP, or other headers.
  const { host, pathname } = new URL(request.url);
  const event = {
    ts: new Date().toISOString(),
    cat: request.headers.get("netlify-agent-category"),
    ua: request.headers.get("user-agent"),
    accept: request.headers.get("accept")?.slice(0, MAX_ACCEPT_LENGTH) ?? null,
    host,
    path: pathname,
    method: request.method,
    country: context.geo?.country?.code ?? null,
    w: 1 / sample,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = Netlify.env.get("AGENT_LOG_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((response) => response.body?.cancel())
    .catch(() => {});
}

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

// Pages whose index.md carries the full content: the docs part and blog posts.
// Marketing pages built from headless sections (/cloud/, /lp/*, the /blog/
// index, ...) render a Markdown file with only a title, so they keep the HTML.
// ponytail: prefix allowlist; drop it once those layouts get Markdown templates.
export const MARKDOWN_PAGES =
  /^\/(documentation|articles|course|learn)\/(.*\/)?$|^\/blog\/[^/]+\/$/;

// The page's index.md as a response, or undefined to serve the HTML.
async function markdownFor(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!MARKDOWN_PAGES.test(url.pathname)) return;
  if (!prefersMarkdown(request.headers.get("accept"))) return;

  url.pathname += "index.md";
  const markdown = await fetch(url);
  // No Markdown for this page (the homepage, for one): fall through to HTML.
  if (!markdown.ok) return;

  const headers = new Headers(markdown.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept");
  headers.set("Content-Location", url.pathname);
  return new Response(markdown.body, { status: 200, headers });
}

export default async (request: Request, context: Context) => {
  const sent = log(request, context);
  // The timeout on the send bounds how long a slow sink can keep the
  // invocation open; without waitUntil it bounds the response delay.
  if (sent && context.waitUntil) context.waitUntil(sent);
  else if (sent) await sent;
  return markdownFor(request);
};

export const config: Config = {
  path: "/*",
  // The value is "<category>[;<sub-category>]", e.g. "ai-agent;user" or "crawler;ai".
  header: { "netlify-agent-category": "^(ai-agent|crawler)(;|$)" },
  // If the function ever throws, serve the request as if it did not exist
  // instead of an error page, which for Markdown means the HTML.
  onError: "bypass",
  // Static assets built by Hugo. Markdown (index.md), llms.txt, sitemaps, and
  // feeds stay included: they are what agents and crawlers come for.
  excludedPath: [
    "/css/*",
    "/js/*",
    "/fonts/*",
    "/icons/*",
    "/img/*",
    "/images/*",
    "/*.css",
    "/*.js",
    "/*.map",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.webp",
    "/*.avif",
    "/*.svg",
    "/*.ico",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.eot",
    "/*.mp4",
    "/*.webm",
  ],
};
