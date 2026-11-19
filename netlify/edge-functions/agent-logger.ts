// Counts requests from AI agents and crawlers.
//
// Netlify classifies every request and sets the netlify-agent-category request
// header (browser, ai-agent, crawler, other, none). The `header` filter in
// `config` makes Netlify invoke this function only for ai-agent and crawler
// requests, so browser traffic never counts toward the edge function quota.
//
// Phase 1 deploys with no sink: the invocation count in the Netlify usage
// dashboard is the number of agent and crawler requests. Setting AGENT_LOG_URL
// in the Netlify UI (never in the repository) turns on one small JSON event per
// request, sent in the background. The function always returns undefined, so
// the request passes through untouched and logging never affects the response.
//
// Environment variables, all optional:
//   AGENT_LOG_URL     ingest endpoint; unset means do nothing
//   AGENT_LOG_TOKEN   sent as `Authorization: Bearer <token>`
//   AGENT_LOG_SAMPLE  fraction of requests to send, 0..1, default 1

import type { Config, Context } from "https://edge.netlify.com";

const TIMEOUT_MS = 2000;

export default (request: Request, context: Context) => {
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
    host,
    path: pathname,
    method: request.method,
    country: context.geo?.country?.code ?? null,
    w: 1 / sample,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = Netlify.env.get("AGENT_LOG_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;

  // The timeout bounds how long a slow or hanging sink can keep the invocation
  // open; on the fallback path without waitUntil it bounds the response delay.
  const sent = fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((response) => response.body?.cancel())
    .catch(() => {});

  if (context.waitUntil) {
    context.waitUntil(sent);
    return;
  }
  return sent.then(() => undefined);
};

export const config: Config = {
  path: "/*",
  header: { "netlify-agent-category": "^(ai-agent|crawler)$" },
  // If the function ever throws, serve the request as if it did not exist
  // instead of an error page.
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
