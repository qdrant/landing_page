// Serves the Qdrant agent skills at /.well-known/agent-skills/ on qdrant.tech,
// in the format of the Agent Skills Discovery draft
// (https://github.com/cloudflare/agent-skills-discovery-rfc, schema 0.2.0).
//
// Nothing is copied into this repository or into the build. skills.qdrant.tech
// (the qdrant/skills repository) stays the only place a skill is edited:
//
// - /.well-known/agent-skills/index.json is built on request from the skills
//   site's sitemap, reading each SKILL.md for its name, description, and
//   SHA-256 digest.
// - /.well-known/agent-skills/<path>/SKILL.md proxies
//   https://skills.qdrant.tech/<path>/SKILL.md, so nested skills keep the path
//   they have there.
//
// Both responses are cached on the Netlify CDN for the same short time, so a
// skill change reaches qdrant.tech within CACHE_SECONDS without a deploy here.

import type { Config, Context } from "https://edge.netlify.com";
import { parse as parseYaml } from "https://esm.sh/yaml@2.8.1";

const UPSTREAM = "https://skills.qdrant.tech";
const PREFIX = "/.well-known/agent-skills/";
const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const CACHE_SECONDS = 300;
// Agent Skills naming rules: 1-64 characters, lowercase alphanumerics and
// single hyphens, no leading or trailing hyphen.
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// A skill path on the upstream: one or more directory segments, then SKILL.md.
const SKILL_PATH = /^(?:[a-z0-9-]+\/)+SKILL\.md$/;

type Skill = {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
  digest: string;
};

function cached(body: BodyInit, contentType: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}

function error(status: number, message: string): Response {
  return new Response(`${message}\n`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

async function fetchUpstream(path: string): Promise<ArrayBuffer> {
  const response = await fetch(`${UPSTREAM}/${path}`);
  if (!response.ok) {
    throw new Error(`${UPSTREAM}/${path} returned ${response.status}`);
  }
  return await response.arrayBuffer();
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
}

function frontmatter(text: string): Record<string, unknown> {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return {};
  const data = parseYaml(match[1]);
  return data && typeof data === "object" ? data : {};
}

// Skill paths relative to the upstream root, read from its sitemap, which lists
// every published Markdown file.
async function skillPaths(): Promise<string[]> {
  const sitemap = new TextDecoder().decode(await fetchUpstream("sitemap.xml"));
  const paths = new Set<string>();
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(loc.trim());
    const path = url.pathname.replace(/^\//, "");
    if (SKILL_PATH.test(path)) paths.add(path);
  }
  return [...paths].sort();
}

async function buildIndex(): Promise<Skill[]> {
  const paths = await skillPaths();
  const entries = await Promise.all(paths.map(async (path) => {
    const bytes = await fetchUpstream(path);
    const meta = frontmatter(new TextDecoder().decode(bytes));
    const name = typeof meta.name === "string" ? meta.name.trim() : "";
    const description = typeof meta.description === "string" ? meta.description.trim() : "";
    if (!NAME.test(name) || name.length > 64 || !description) {
      console.warn(`agent-skills: skipping ${path}, missing or invalid name or description`);
      return null;
    }
    return {
      name,
      type: "skill-md" as const,
      description,
      url: `${PREFIX}${path}`,
      digest: `sha256:${await sha256(bytes)}`,
    };
  }));

  const seen = new Set<string>();
  const skills: Skill[] = [];
  for (const entry of entries) {
    if (!entry) continue;
    if (seen.has(entry.name)) {
      console.warn(`agent-skills: skipping ${entry.url}, duplicate name ${entry.name}`);
      continue;
    }
    seen.add(entry.name);
    skills.push(entry);
  }
  return skills;
}

export default async (request: Request, _context: Context) => {
  const path = new URL(request.url).pathname.slice(PREFIX.length);

  try {
    if (path === "index.json") {
      const skills = await buildIndex();
      if (skills.length === 0) {
        return error(502, `${UPSTREAM} lists no skills`);
      }
      const index = JSON.stringify({ $schema: SCHEMA, skills }, null, 2) + "\n";
      return cached(index, "application/json; charset=utf-8");
    }

    if (SKILL_PATH.test(path)) {
      const response = await fetch(`${UPSTREAM}/${path}`);
      if (response.status === 404) return error(404, "No such skill");
      if (!response.ok) return error(502, `${UPSTREAM} returned ${response.status}`);
      return cached(await response.arrayBuffer(), "text/markdown; charset=utf-8");
    }
  } catch (e) {
    console.error(`agent-skills: ${e}`);
    return error(502, `Could not reach ${UPSTREAM}`);
  }

  return error(404, "Not found");
};

export const config: Config = {
  path: "/.well-known/agent-skills/*",
  cache: "manual",
};
