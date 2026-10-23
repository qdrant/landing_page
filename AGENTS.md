# AGENTS.md

Guidance for AI coding agents working in this repository. This is the Hugo site
behind [qdrant.tech](https://qdrant.tech): the marketing pages, the blog, and
the documentation.

This file is about editing the repository. It is not the agent-facing entry
point for the published site, which is
[`qdrant.tech/llms.txt`](https://qdrant.tech/llms.txt), generated from
`themes/qdrant-2024/layouts/index.llms.txt`.

## Build and serve

```bash
./run.sh                 # npm install, then hugo serve on :1313
./install-and-build.sh   # what Netlify runs: fetches Dart Sass, builds to public/
```

Three things about the build cause more lost time than everything else combined:

- **Hugo 0.160.1 exactly.** `install-and-build.sh` refuses any other version and
  `run.sh` warns. A different version produces failures that look like content
  bugs.
- **Dart Sass is required, and the npm package named `sass` is not it.** It is a
  different implementation. Without Dart Sass on `PATH`, Hugo still reports a
  successful build and serves stale CSS out of `qdrant-landing/resources/_gen`.
  A panel that renders unstyled after an SCSS change almost always means this
  rather than a mistake in the SCSS.
- **`hugo --quiet` hides build errors.** It has reported exit 0 through a pipe
  while the site failed to render. Grep unpiped output for `ERROR` before
  trusting a green build.

## Layout of the repository

| Path | What it holds |
|---|---|
| `qdrant-landing/content/` | All content. `documentation/` is the docs tree |
| `qdrant-landing/content/headless/`, `.../documentation/headless/` | Page bundles that are never published as URLs: code snippets, prompts |
| `qdrant-landing/themes/qdrant-2024/` | The theme: layouts, shortcodes, SCSS, JS |
| `qdrant-landing/layouts/` | Project layouts, which override the theme's |
| `automation/` | Checks and generators, each with its own README |
| `.github/workflows/` | CI |

`qdrant-landing/public/`, `qdrant-landing/resources/_gen/`, and `node_modules/`
are generated and git-ignored. Never edit them, and never cite a path under
`public/` as the source of anything.

Project layouts win over theme layouts, which is why `layouts/shortcodes/`
holds the per-output-format variants while the theme holds the HTML ones.

## Every page has two outputs

A content page renders as HTML and as Markdown at `<url>/index.md`. The Markdown
output is what AI agents consume, and `qdrant.tech/llms.txt` indexes it. It is
not a format conversion of the HTML: `layouts/_default/single.markdown.md`
prepends pointers to the skills catalog and rewrites internal links to their
`index.md` form.

So a change to a page changes two published artifacts. When a shortcode should
behave differently for agents, give it a `<name>.markdown.md` variant in
`layouts/shortcodes/` rather than trying to detect the format inside the HTML
one. `code-snippet`, `include`, `prompt`, and `prompt-index` all do this.

## Content conventions

- **`weight` in front matter orders the docs sidebar.** Adding a page without
  one puts it in an unpredictable position.
- **Moving or renaming a page needs `aliases`** in the destination's front
  matter. Old URLs are linked from blog posts, from articles, and from the
  pointers prepended to every documentation `index.md`.
- **Prompts belong in `documentation/headless/prompts/`**, one file per prompt,
  included with `{{< prompt "id" >}}`. A prompt body written inline on a page
  reaches the agent-facing `index.md`, where an instruction addressed to an
  agent can displace the question that agent was actually asked. See
  `automation/prompts/README.md`.
- **Agent skill links are `https://skills.qdrant.tech/<path>/SKILL.md`.** The
  bare path without the suffix returns 404, meta skills live under `meta/`, and
  a path that exists in the `qdrant/skills` repository is not necessarily
  published. `https://skills.qdrant.tech/llms.txt` lists what is actually
  served.

## Code snippets

- **Code samples belong in `documentation/headless/snippets/`**, not written
  inline. They are compilable sources that CI type-checks against the real
  client libraries. See `automation/snippets/README.md` for authoring
  conventions, deployment variants, and snippets for unreleased Qdrant
  versions, and the root `README.md` for the `code-snippet` shortcode.
- **`generated/` is derived, not written.** `automation/snippets/generate-md.py`
  creates the Markdown in each `generated/` directory. Commit its output and
  never edit it by hand.
- **Check for deployment variants before editing a snippet.** Once a
  `_server/`, `_edge/`, or `_serverless/` subdirectory exists, the shortcode
  ignores the files at the top level of the snippet directory.
- **Rust snippets use `?`, not `.unwrap()`.** Use `.context("...")?` (with
  `use anyhow::Context;`) for `Option`s, a `for` loop instead of
  `.map().collect()` when the body needs `?`, and `NonZeroU32::try_from(8)?`
  instead of `NonZeroU32::new(8).unwrap()`. Keep `.unwrap()` only where the
  error type doesn't implement `std::error::Error`. When sweeping for
  `.unwrap()`, scan the existing files too, not just the diff.
- **Go snippets use the SDK's helper constructors**, for example
  `qdrant.NewQueryDocument(...)`, instead of building the nested structs by
  hand.
- **Edge snippets match the server snippet's functionality.** Don't simplify
  them, and check them against the Qdrant Edge version pinned in
  `automation/snippets/templates/`, not the `dev` branch of `qdrant`, which is
  ahead of the release. For Rust, use docs.rs for the pinned version. For
  Python, use the `qdrant_edge.pyi` stubs installed in
  `automation/snippets/templates/python/.venv`.

## Writing style

American English, Oxford commas, straight quotes. No em dashes. No directional
language: an element is not "below" or "above", because the Markdown output,
the mobile layout, and a screen reader all order things differently. Name the
thing instead.

## Before opening a pull request

```bash
automation/prompts/check-prompts.sh       # prompt rules, source only, seconds
automation/prompts/check-skill-links.sh   # skill links resolve, needs network
automation/check-content-images.sh        # blog and article front matter images exist
automation/snippets/generate-md.py        # if you touched snippets, then commit the result
```

When you are not at the repository root, stage with `git add -A` or
`git add :/`. Plain `git add .` inside `qdrant-landing/` silently misses
changes to `automation/` and `.github/`.

## Two traps in the templates

- **`.Section` returns the top-level section, not the nested one.** For
  `/documentation/agentic-tools/skills/` it is `documentation`. Gating an asset
  on it loads that asset on every documentation page, several hundred of them.
  Check the path instead.
- **`[data-theme='light'] &` does not work inside a compound selector.** Nested
  under `&__a &__b` it compiles to `.a [data-theme=light] .b`, which puts the
  attribute in descendant position where it can never match, because the theme
  attribute sits on `<html>`. Write those rules out longhand.
