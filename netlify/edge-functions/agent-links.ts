// Adds utm_term=<agent> to the utm_source=agent Cloud links in llms.txt and
// Markdown pages. Terminal agents send no referrer, so the User-Agent that read
// the page is the only record of which agent it was. Every request is logged so
// AGENTS can grow from what actually reads the docs.

import type { Config, Context } from "https://edge.netlify.com";

// Only User-Agents we have seen or the vendor documents. First match wins, so
// claude-code beats the Claude-User token it also sends.
const AGENTS: [RegExp, string][] = [
  [/\bclaude-code\//i, "claude-code"],
  [/\bClaude-User\b/i, "claude"],
  [/\bChatGPT-User\b/i, "chatgpt"],
  [/\bPerplexity-User\b/i, "perplexity"],
];

const TAG = /utm_source=agent(?!&utm_term=)/g;

export function agentName(userAgent: string): string | null {
  return AGENTS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
}

export function stamp(text: string, agent: string): string {
  return text.replace(TAG, `utm_source=agent&utm_term=${agent}`);
}

export default async (request: Request, context: Context) => {
  const userAgent = request.headers.get("user-agent") ?? "";
  const agent = agentName(userAgent);
  console.log(JSON.stringify({
    event: "agent-read",
    path: new URL(request.url).pathname,
    agent: agent ?? "unknown",
    userAgent,
  }));
  if (!agent) return;

  const response = await context.next();
  if (!response.ok) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  return new Response(stamp(await response.text(), agent), { status: response.status, headers });
};

export const config: Config = {
  pattern: ["^/llms\\.txt$", "^/\\.well-known/llms\\.txt$", "^/.+\\.md$"],
  excludedPattern: "^/\\.well-known/agent-skills/",
};
