# Blog Visual System Pilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace information-carrying raster images with inline SVG on three pilot blog posts, using a shared token file, one Hugo-native diagram shortcode, and one build-time chart shortcode.

**Architecture:** Two rendering engines behind one figure wrapper. Diagrams are emitted by Hugo Go templates at build time (no dependencies). Charts are generated locally by a Node script using Observable Plot, and the resulting SVG is committed; CI verifies regeneration produces no diff. Both read colors and type from a single `data/viz.json`.

**Tech Stack:** Hugo 0.140.2 (extended), Go templates, Node ≥22, `@observablehq/plot`, `jsdom`, `node --test` (built in, no test framework dependency), Dart Sass via Hugo Pipes.

**Spec:** `docs/superpowers/specs/2026-08-27-blog-visual-system-design.md`

## Global Constraints

- Hugo version: 0.140.2 extended. `markup.goldmark.renderer.unsafe = true` is already set in `config.toml`.
- Node engine floor: `>=22.x` (already declared in `package.json`).
- New runtime dependencies allowed: **none**. `@observablehq/plot` and `jsdom` go in `devDependencies` only — they must never be needed to build or serve the site.
- The site has **no dark mode**. `[data-theme='dark']` exists only in `themes/qdrant-2024/assets/css/search/_dark-theme.scss` and is scoped to the search dialog. Emit colors as CSS custom properties anyway so a future dark mode is a token swap.
- The viz palette is defined in `data/viz.json` and **nowhere else**. Figure chrome (margins, caption type) uses the existing SCSS `$neutral-*` tokens. No color value may be duplicated across the two files.
- `caption` is a **required** parameter on every viz shortcode. A missing caption must fail the build via `errorf`.
- All SCSS lives under `themes/qdrant-2024/assets/css/`; component partials are registered in `_components.scss`.
- Site shortcodes live in the **project** `layouts/shortcodes/` (not the theme), matching the existing `code-snippet` and `include` shortcodes.
- Local preview must use `hugo --baseURL http://localhost:<port>/`. `config.toml` sets `baseURL = https://qdrant.tech/`, and stylesheets carry SRI `integrity` attributes — building without the override makes a local page fetch CSS from production, fail SRI, and render unstyled. This has already cost one debugging cycle.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

---

## File Structure

**Created:**

| path | responsibility |
|---|---|
| `data/viz.json` | Single source of truth for viz palette, type scale, stroke weights. Read by Hugo templates and the Node chart generator. |
| `layouts/partials/viz-figure.html` | The one figure wrapper. Enforces the accessibility contract: required caption, `role="img"`, `aria-labelledby`, `<figcaption>`. Both shortcodes render through it. |
| `layouts/shortcodes/compare.html` | Before/after diagram. Emits SVG from Go templates. |
| `layouts/shortcodes/compare-side.html` | One side of a compare. Registers its data on the parent via `.Parent.Scratch`. |
| `layouts/shortcodes/chart.html` | Inlines a committed, pre-generated SVG and wraps it in the figure partial. |
| `themes/qdrant-2024/assets/css/components/_viz.scss` | Figure chrome only — container, caption, responsive behaviour. No viz colors. |
| `scripts/viz/generate-charts.mjs` | Node chart generator. Reads `data/viz.json` + a CSV, writes SVG. |
| `scripts/viz/extract-table-csv.mjs` | One-shot: extracts a markdown table from a post into CSV. |
| `test/viz/shortcodes.test.mjs` | `node --test` suite. Builds the site with drafts and asserts on rendered HTML. |
| `test/viz/helpers.mjs` | Build-and-parse helper shared by tests. |
| `content/blog/viz-fixtures.md` | `draft: true` fixture page exercising every shortcode. Never published. |

**Modified:**

| path | change |
|---|---|
| `themes/qdrant-2024/assets/css/_components.scss` | Add `@import 'components/viz';` |
| `package.json` | Add `viz:charts`, `viz:test` scripts; add two devDependencies. |
| `content/articles/bulk-uploads-in-qdrant.md` | Task 3 — 7 PNGs → `{{< compare >}}` |
| `content/blog/qdrant-1.19.x.md` | Task 4 — remove 8 decorative image references |
| `content/blog/benchmark-elastic-diskbbq.md` | Task 6 — add `{{< chart >}}` |

**Deleted:** `static/blog/qdrant-1.19.x/section-{1..9}.png` (Task 4).

---

## Task 1: Viz foundation — tokens, figure wrapper, chrome

Nothing renders yet. This task delivers the shared contract every later task depends on, plus the test harness.

**Files:**
- Create: `data/viz.json`
- Create: `layouts/partials/viz-figure.html`
- Create: `themes/qdrant-2024/assets/css/components/_viz.scss`
- Create: `content/blog/viz-fixtures.md`
- Create: `test/viz/helpers.mjs`
- Create: `test/viz/shortcodes.test.mjs`
- Modify: `themes/qdrant-2024/assets/css/_components.scss`
- Modify: `package.json`

**Interfaces:**
- Produces: `data/viz.json` with top-level keys `palette`, `surface`, `type`, `stroke`. Hugo templates read it as `site.Data.viz`; the Node generator reads the file directly.
- Produces: `partials/viz-figure.html`, invoked as
  `{{ partial "viz-figure.html" (dict "svg" $svg "viewBox" $viewBox "caption" $caption "id" $id "class" $class) }}`
  - `svg` — inner SVG markup **without** an outer `<svg>` element; the partial supplies that element plus its `role`, `aria-labelledby` and `<title>`
  - `viewBox` — string, e.g. `"0 0 820 340"`; required
  - `caption` — non-empty string; required, build fails otherwise
  - `id` — page-unique slug; required, used to build `viz-title-<id>`
  - `class` — optional extra class on the `<figure>`
- Produces: `test/viz/helpers.mjs` exporting `buildSite()` and `getFixtureHtml()`.

- [ ] **Step 1: Write the failing test**

Create `test/viz/helpers.mjs`:

```javascript
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
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
```

Create `test/viz/shortcodes.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFixtureHtml } from './helpers.mjs';

test('viz.json defines a palette and is valid JSON', () => {
  const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
  assert.ok(Array.isArray(viz.palette.categorical), 'palette.categorical must be an array');
  assert.ok(viz.palette.categorical.length >= 4, 'need at least 4 categorical colors');
  assert.match(viz.palette.categorical[0], /^#[0-9a-f]{6}$/i);
  assert.ok(viz.surface.ink, 'surface.ink required');
  assert.ok(viz.type.family, 'type.family required');
});

test('figure wrapper renders caption, role and aria-labelledby', () => {
  const html = getFixtureHtml();
  assert.match(html, /<figure class="viz-figure"/, 'figure wrapper missing');
  assert.match(html, /role="img"/, 'svg must carry role="img"');
  assert.match(html, /aria-labelledby="viz-title-smoke"/, 'aria-labelledby must point at the title id');
  assert.match(html, /<title id="viz-title-smoke">Smoke test caption\.<\/title>/,
    'svg <title> must carry the caption');
  assert.match(html, /<figcaption class="viz-figure__caption">Smoke test caption\.<\/figcaption>/,
    'caption must also be visible');
});

test('no viz color is duplicated into SCSS', () => {
  const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
  const scss = readFileSync(
    'themes/qdrant-2024/assets/css/components/_viz.scss', 'utf8').toLowerCase();
  const colors = [...viz.palette.categorical, ...Object.values(viz.surface)]
    .filter((v) => typeof v === 'string' && v.startsWith('#'));
  for (const c of colors) {
    assert.ok(!scss.includes(c.toLowerCase()),
      `${c} is defined in viz.json and must not be repeated in _viz.scss`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test test/viz/
```

Expected: FAIL. `data/viz.json` does not exist, so the first test throws ENOENT.

- [ ] **Step 3: Create the token file**

Create `data/viz.json`. Values are taken from `themes/qdrant-2024/assets/css/_theme-variables.scss` — this file is now their single home for visualisation purposes.

```json
{
  "$comment": "Single source of truth for blog visualisation colors and type. Consumed by Hugo templates (site.Data.viz) and scripts/viz/generate-charts.mjs. Do NOT duplicate these values into SCSS.",
  "palette": {
    "categorical": ["#dc244c", "#2f6ff0", "#038585", "#8547ff", "#e0700d"],
    "names": ["qdrant", "blue", "teal", "violet", "amber"],
    "muted": "#b4bacc"
  },
  "surface": {
    "ink": "#161e33",
    "inkMuted": "#576280",
    "page": "#ffffff",
    "panel": "#f0f3fa",
    "grid": "#d4d9e6",
    "axis": "#8f98b2"
  },
  "tone": {
    "cost": { "fill": "#f0f3fa", "stroke": "#b4bacc", "text": "#576280" },
    "win":  { "fill": "#c0f0f0", "stroke": "#038585", "text": "#004f4f" }
  },
  "type": {
    "family": "'Mona Sans', -apple-system, 'Segoe UI', sans-serif",
    "mono": "'Geist Mono', ui-monospace, monospace",
    "label": 15,
    "title": 17,
    "tick": 13
  },
  "stroke": { "hairline": 1, "regular": 2, "emphasis": 3 }
}
```

The first palette entry is Qdrant red, so a single-series chart is on-brand by default and a two-series chart reads as "us versus them" without the author choosing colors.

- [ ] **Step 4: Create the figure wrapper partial**

Create `layouts/partials/viz-figure.html`:

```go-html-template
{{- /*
  viz-figure — the one wrapper for every generated visual.

  Enforces the accessibility contract from the design spec §7: a required
  caption becomes both the SVG <title> (announced once, via aria-labelledby)
  and the visible <figcaption>.

  Params:
    svg      inner SVG markup, WITHOUT the outer <svg> tag
    viewBox  viewBox value for the outer <svg>, e.g. "0 0 800 320"
    caption  required, non-empty
    id       page-unique slug used to build the title element id
    class    optional extra class on the <figure>
*/ -}}
{{- $caption := .caption -}}
{{- $id := .id -}}
{{- if not $caption -}}
  {{- errorf "viz-figure: 'caption' is required. Write one sentence stating what the figure shows — it is the only description a screen reader receives." -}}
{{- end -}}
{{- if not $id -}}
  {{- errorf "viz-figure: 'id' is required and must be unique within the page." -}}
{{- end -}}
<figure class="viz-figure{{ with .class }} {{ . }}{{ end }}">
  <svg class="viz-figure__svg" viewBox="{{ .viewBox }}" role="img"
       aria-labelledby="viz-title-{{ $id }}" xmlns="http://www.w3.org/2000/svg"
       preserveAspectRatio="xMidYMid meet">
    <title id="viz-title-{{ $id }}">{{ $caption }}</title>
    {{ .svg | safeHTML }}
  </svg>
  <figcaption class="viz-figure__caption">{{ $caption }}</figcaption>
</figure>
```

- [ ] **Step 5: Create the chrome stylesheet**

Create `themes/qdrant-2024/assets/css/components/_viz.scss`. Chrome only — no viz colors, which is asserted by a test.

```scss
// Blog visualisation figures. See docs/superpowers/specs/2026-08-27-blog-visual-system-design.md
//
// Colors for the visuals themselves live in data/viz.json and arrive inside the
// SVG. This file styles only the surrounding chrome, using existing theme tokens.

.viz-figure {
  margin: 2rem 0;
}

.viz-figure__svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  overflow: visible;
}

.viz-figure__caption {
  margin-top: 0.75rem;
  font-size: $font-size-s;
  line-height: 1.5;
  color: $neutral-50;
}
```

- [ ] **Step 6: Register the stylesheet**

Append to `themes/qdrant-2024/assets/css/_components.scss`:

```scss
@import 'components/viz';
```

- [ ] **Step 7: Create the draft fixture page**

Create `content/blog/viz-fixtures.md`. `draft: true` keeps it out of production builds; tests use `--buildDrafts`.

```markdown
---
title: "Viz fixtures (not published)"
draft: true
slug: viz-fixtures
short_description: "Test fixture exercising the viz shortcodes. Never published."
description: "Test fixture exercising the viz shortcodes. Never published."
date: 2026-08-27
author: Qdrant
---

Fixture page for `node --test test/viz/`. Not linked, not published.

{{< partial-smoke >}}
```

Then create `layouts/shortcodes/partial-smoke.html` so the fixture can exercise
the partial before any real shortcode exists:

```go-html-template
{{- partial "viz-figure.html" (dict
      "svg" "<rect x=\"10\" y=\"10\" width=\"80\" height=\"40\" fill=\"#dc244c\"/>"
      "viewBox" "0 0 100 60"
      "caption" "Smoke test caption."
      "id" "smoke") -}}
```

- [ ] **Step 8: Add npm scripts and devDependencies**

In `package.json`, add to `scripts`:

```json
"viz:test": "node --test test/viz/",
"viz:charts": "node scripts/viz/generate-charts.mjs"
```

And to `devDependencies`:

```json
"@observablehq/plot": "^0.6.17",
"jsdom": "^25.0.1"
```

Then install:

```bash
npm install
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
node --test test/viz/
```

Expected: PASS, 3 tests.

- [ ] **Step 10: Verify drafts stay out of production builds**

```bash
hugo --logLevel error --destination /tmp/viz-prod-check
test ! -e /tmp/viz-prod-check/blog/viz-fixtures/index.html && echo "OK: fixture excluded from production"
```

Expected: `OK: fixture excluded from production`. If the file exists, the fixture leaks to production — stop and resolve before continuing.

- [ ] **Step 11: Commit**

```bash
git add data/viz.json layouts/partials/viz-figure.html \
        layouts/shortcodes/partial-smoke.html \
        themes/qdrant-2024/assets/css/components/_viz.scss \
        themes/qdrant-2024/assets/css/_components.scss \
        content/blog/viz-fixtures.md test/viz/ package.json package-lock.json
git commit -m "feat(viz): add viz tokens, figure wrapper and test harness"
```

---

## Task 2: `{{< compare >}}` — the before/after diagram

Hugo-native SVG, no dependencies. This is the shape that seven of the eight `bulk-uploads` diagrams share.

**Files:**
- Create: `layouts/shortcodes/compare.html`
- Create: `layouts/shortcodes/compare-side.html`
- Modify: `content/blog/viz-fixtures.md`
- Modify: `test/viz/shortcodes.test.mjs`

**Interfaces:**
- Consumes: `partial "viz-figure.html"` (Task 1) with keys `svg`, `viewBox`, `caption`, `id`, `class`; and `site.Data.viz` keys `tone.cost`, `tone.win`, `surface.ink`, `surface.inkMuted`, `type.family`, `type.label`.
- Produces: shortcode pair `compare` / `compare-side`.
  - `compare` params: `caption` (required), `id` (required, page-unique slug).
  - `compare-side` params: `label` (required), `tone` (`cost` | `win`, default `cost`).
  - `compare-side` inner content: one step per line. A step may contain a single `|` to force a second text line. Each line must be ≤ 34 characters or the build fails.
  - `compare-side` registers `{label, tone, steps[]}` on `.Parent.Scratch` under key `sides`. Exactly two sides required.

- [ ] **Step 1: Write the failing test**

Append to `test/viz/shortcodes.test.mjs`:

```javascript
test('compare renders two labelled panels with steps and one caption', () => {
  const html = getFixtureHtml();
  assert.match(html, /aria-labelledby="viz-title-cmp"/, 'compare figure missing');
  assert.match(html, /<title id="viz-title-cmp">Batching cuts per-request overhead\.<\/title>/);
  assert.match(html, />One point per request</, 'cost side label missing');
  assert.match(html, />Batches of 64-256</, 'win side label missing');
  assert.match(html, />network round trip</, 'cost step missing');
  assert.match(html, />grouped write path</, 'win step missing');
  // exactly one figcaption for this figure
  const captions = html.match(/Batching cuts per-request overhead\./g) || [];
  assert.equal(captions.length, 2, 'caption should appear exactly twice: <title> and <figcaption>');
});

test('compare uses tone colors from viz.json, not hardcoded', () => {
  const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
  const html = getFixtureHtml();
  assert.ok(html.includes(viz.tone.win.fill), 'win tone fill from viz.json must appear in output');
  assert.ok(html.includes(viz.tone.cost.stroke), 'cost tone stroke from viz.json must appear in output');
});
```

Add a second test file `test/viz/compare-validation.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { buildExpectingFailure } from './helpers.mjs';

const TMP_PAGE = 'content/blog/viz-badfixture.md';

function withPage(body, fn) {
  writeFileSync(TMP_PAGE, `---\ntitle: "bad"\ndraft: true\nslug: viz-badfixture\ndate: 2026-08-27\n---\n\n${body}\n`);
  try { return fn(); } finally { rmSync(TMP_PAGE, { force: true }); }
}

test('compare fails the build when caption is missing', () => {
  const out = withPage(
    `{{< compare id="x" >}}\n{{< compare-side label="A" >}}\nstep one\n{{< /compare-side >}}\n{{< compare-side label="B" >}}\nstep two\n{{< /compare-side >}}\n{{< /compare >}}`,
    () => buildExpectingFailure());
  assert.match(out, /caption/i, 'error must mention the missing caption');
});

test('compare fails the build with only one side', () => {
  const out = withPage(
    `{{< compare id="x" caption="c" >}}\n{{< compare-side label="A" >}}\nstep one\n{{< /compare-side >}}\n{{< /compare >}}`,
    () => buildExpectingFailure());
  assert.match(out, /exactly two/i, 'error must say two sides are required');
});

test('compare fails the build when a step line is too long', () => {
  const long = 'x'.repeat(40);
  const out = withPage(
    `{{< compare id="x" caption="c" >}}\n{{< compare-side label="A" >}}\n${long}\n{{< /compare-side >}}\n{{< compare-side label="B" >}}\nshort\n{{< /compare-side >}}\n{{< /compare >}}`,
    () => buildExpectingFailure());
  assert.match(out, /34/, 'error must state the 34-character limit');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test test/viz/
```

Expected: FAIL. The `compare` shortcode does not exist, so Hugo errors with `failed to extract shortcode: template for shortcode "compare" not found`.

- [ ] **Step 3: Implement `compare-side`**

Create `layouts/shortcodes/compare-side.html`:

```go-html-template
{{- /*
  compare-side — one panel of a {{< compare >}}.
  See docs/superpowers/specs/2026-08-27-blog-visual-system-design.md §6.2

  Params:
    label  required. The heading for this panel.
    tone   "cost" (the default/naive path) or "win" (the better path).
  Inner:
    one step per line. A single "|" inside a step forces a second text line.
*/ -}}
{{- $label := .Get "label" -}}
{{- if not $label -}}
  {{- errorf "compare-side in %s: 'label' is required." .Position -}}
{{- end -}}
{{- $tone := .Get "tone" | default "cost" -}}
{{- if not (in (slice "cost" "win") $tone) -}}
  {{- errorf "compare-side in %s: 'tone' must be \"cost\" or \"win\" (got %q)." .Position $tone -}}
{{- end -}}
{{- $steps := slice -}}
{{- range (split (trim .Inner "\n") "\n") -}}
  {{- $step := trim . " " -}}
  {{- if $step -}}
    {{- range (split $step "|") -}}
      {{- if gt (len (trim . " ")) 34 -}}
        {{- errorf "compare-side in %s: step line %q is %d characters; the limit is 34. Split it into two steps, or use a single | to break it across two lines." $.Position (trim . " ") (len (trim . " ")) -}}
      {{- end -}}
    {{- end -}}
    {{- $steps = $steps | append $step -}}
  {{- end -}}
{{- end -}}
{{- if eq (len $steps) 0 -}}
  {{- errorf "compare-side in %s: needs at least one step." .Position -}}
{{- end -}}
{{- .Parent.Scratch.Add "sides" (slice (dict "label" $label "tone" $tone "steps" $steps)) -}}
```

- [ ] **Step 4: Implement `compare`**

Create `layouts/shortcodes/compare.html`:

```go-html-template
{{- /*
  compare — two-panel before/after diagram, rendered as inline SVG.

  Params: caption (required), id (required, page-unique).
  Contains exactly two {{< compare-side >}} blocks.
*/ -}}
{{- $caption := .Get "caption" -}}
{{- if not $caption -}}
  {{- errorf "compare in %s: 'caption' is required. Write one sentence stating what the diagram shows — it is the only description a screen reader receives." .Position -}}
{{- end -}}
{{- $id := .Get "id" -}}
{{- if not $id -}}
  {{- errorf "compare in %s: 'id' is required and must be unique within the page." .Position -}}
{{- end -}}

{{- /* Force the inner shortcodes to run so they can register on Scratch. */ -}}
{{- $_ := .Inner -}}
{{- $sides := .Scratch.Get "sides" | default slice -}}
{{- if ne (len $sides) 2 -}}
  {{- errorf "compare in %s: exactly two compare-side blocks are required, found %d." .Position (len $sides) -}}
{{- end -}}

{{- $viz := site.Data.viz -}}
{{- $panelW := 390 -}}
{{- $gap := 40 -}}
{{- $W := add (mul $panelW 2) $gap -}}
{{- $top := 56 -}}
{{- $stepH := 46 -}}
{{- $stepGap := 26 -}}
{{- $maxSteps := 0 -}}
{{- range $sides -}}
  {{- if gt (len .steps) $maxSteps -}}{{- $maxSteps = len .steps -}}{{- end -}}
{{- end -}}
{{- $H := add $top (add (mul $maxSteps $stepH) (add (mul (sub $maxSteps 1) $stepGap) 16)) -}}

{{- $svg := "" -}}
{{- $svg = printf `%s<defs><marker id="viz-arrow-%s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker></defs>` $svg $id $viz.surface.inkMuted -}}

{{- range $i, $side := $sides -}}
  {{- $tone := index $viz.tone $side.tone -}}
  {{- $x := mul $i (add $panelW $gap) -}}
  {{- /* panel heading */ -}}
  {{- $svg = printf `%s<text x="%d" y="26" font-family=%q font-size="%d" font-weight="600" fill="%s">%s</text>`
        $svg (add $x 4) $viz.type.family $viz.type.title $viz.surface.ink $side.label -}}
  {{- range $j, $step := $side.steps -}}
    {{- $y := add $top (mul $j (add $stepH $stepGap)) -}}
    {{- $lines := split $step "|" -}}
    {{- $svg = printf `%s<rect x="%d" y="%d" width="%d" height="%d" rx="8" fill="%s" stroke="%s" stroke-width="%d"/>`
          $svg $x $y $panelW $stepH $tone.fill $tone.stroke $viz.stroke.hairline -}}
    {{- $cx := add $x (div $panelW 2) -}}
    {{- if eq (len $lines) 1 -}}
      {{- $svg = printf `%s<text x="%d" y="%d" text-anchor="middle" font-family=%q font-size="%d" fill="%s">%s</text>`
            $svg $cx (add $y 28) $viz.type.family $viz.type.label $tone.text (trim (index $lines 0) " ") -}}
    {{- else -}}
      {{- $svg = printf `%s<text x="%d" y="%d" text-anchor="middle" font-family=%q font-size="%d" fill="%s"><tspan x="%d">%s</tspan><tspan x="%d" dy="17">%s</tspan></text>`
            $svg $cx (add $y 20) $viz.type.family $viz.type.label $tone.text
            $cx (trim (index $lines 0) " ") $cx (trim (index $lines 1) " ") -}}
    {{- end -}}
    {{- /* connector to the next step */ -}}
    {{- if lt (add $j 1) (len $side.steps) -}}
      {{- $svg = printf `%s<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%d" marker-end="url(#viz-arrow-%s)"/>`
            $svg $cx (add $y $stepH) $cx (add $y (add $stepH $stepGap)) $viz.surface.inkMuted $viz.stroke.regular $id -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- partial "viz-figure.html" (dict
      "svg" $svg
      "viewBox" (printf "0 0 %d %d" $W $H)
      "caption" $caption
      "id" $id
      "class" "viz-figure--compare") -}}
```

- [ ] **Step 5: Add the fixture**

Replace `{{< partial-smoke >}}` in `content/blog/viz-fixtures.md` with that line plus:

```markdown
{{< compare id="cmp" caption="Batching cuts per-request overhead." >}}
{{< compare-side label="One point per request" tone="cost" >}}
network round trip
write path|per single point
high total overhead
{{< /compare-side >}}
{{< compare-side label="Batches of 64-256" tone="win" >}}
one round trip
grouped write path
far higher throughput
{{< /compare-side >}}
{{< /compare >}}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
node --test test/viz/
```

Expected: PASS, 8 tests.

- [ ] **Step 7: Verify visually in a browser**

```bash
hugo --buildDrafts --baseURL http://localhost:8899/ --destination /tmp/viz-preview --logLevel error
(cd /tmp/viz-preview && python3 -m http.server 8899 &)
```

Open `http://localhost:8899/blog/viz-fixtures/`. Confirm: two panels aligned, arrows connect the boxes, the two-line step wraps correctly, caption is below, nothing overflows horizontally at a 390px window width. Stop the server afterwards.

- [ ] **Step 8: Commit**

```bash
git add layouts/shortcodes/compare.html layouts/shortcodes/compare-side.html \
        content/blog/viz-fixtures.md test/viz/
git commit -m "feat(viz): add compare shortcode for before/after diagrams"
```

---

## Task 3: Retrofit `bulk-uploads-in-qdrant` — THE GATE

**This task is allowed to fail.** If seven diagrams cannot collapse into one component without losing meaning, the kit premise is wrong. Stop, report, and do not proceed to Task 5.

**Files:**
- Modify: `content/articles/bulk-uploads-in-qdrant.md`
- Delete (only after visual sign-off): `static/articles_data/bulk-uploads-in-qdrant/option{1..7}*.png`

**Interfaces:**
- Consumes: `compare` / `compare-side` from Task 2.

The seven targets, with the meaning each PNG's existing alt text records. That alt text is unusually good in this post and is the statement of author intent to check against.

| # | file | cost side | win side |
|---|---|---|---|
| 1 | `option1-memory.png` | default in-memory path, RAM pressure | `on_disk=True`, memmap from the start |
| 2 | `option2-payload-index.png` | index after upload → query-time fallback + HNSW rebuild | index before upload → filtered search fast immediately |
| 3 | `option3-quantization.png` | full-size vectors in RAM | compressed copy in RAM, originals on disk |
| 4 | `option4-sparse-ondisk.png` | sparse index in memory, growing pressure | sparse index on disk, lower memory, some latency |
| 5 | `option5-batching.png` | one point per request, high overhead | batches of 64–256 |
| 6 | `option6-parallel.png` | single worker underuses write capacity | parallel workers feed the write pipeline |
| 7 | `option7-sharding.png` | single shard limits ingestion parallelism | multiple shards, independent write paths |

The eighth image, `choosing-the-right-mix.png`, is a **decision tree, not a comparison**. It is out of scope and stays a PNG.

- [ ] **Step 1: Replace diagram 5 (batching) first as the smallest case**

At `content/articles/bulk-uploads-in-qdrant.md:171`, replace the image line with:

```markdown
{{< compare id="batching" caption="Uploading one point per request pays network and write-path overhead per point; batching 64-256 points amortises it across the group." >}}
{{< compare-side label="One point per request" tone="cost" >}}
1 network round trip|per point
1 write path traversal|per point
overhead x millions
{{< /compare-side >}}
{{< compare-side label="Batches of 64-256" tone="win" >}}
1 round trip per batch
points processed as a group
far fewer traversals
{{< /compare-side >}}
{{< /compare >}}
```

- [ ] **Step 2: Build and check this one diagram**

```bash
hugo --baseURL http://localhost:8899/ --destination /tmp/viz-preview --logLevel error
(cd /tmp/viz-preview && python3 -m http.server 8899 &)
```

Open `http://localhost:8899/articles/bulk-uploads-in-qdrant/`. Compare against `static/articles_data/bulk-uploads-in-qdrant/option5-batching.png` opened side by side. **Judgement call:** does the SVG carry everything the PNG carried? If not, stop here and report what is missing.

- [ ] **Step 3: Replace the remaining six**

Apply the same pattern at lines 53, 80, 104, 135, 195, 220 (line numbers shift as you edit — work bottom-up: 220, 195, 135, 104, 80, 53). Use `id` values `on-disk`, `payload-index`, `quantization`, `sparse-ondisk`, `parallel`, `sharding`. Derive each caption from the existing alt text, rewritten to state the finding rather than describe the picture.

- [ ] **Step 4: Verify no PNG references remain for the seven**

```bash
grep -c 'option[1-7]' content/articles/bulk-uploads-in-qdrant.md
```

Expected: `0`.

- [ ] **Step 5: Build and review all seven in the browser**

Rebuild and reload. Check each against its PNG. Confirm no horizontal overflow at 390px.

- [ ] **Step 6: Delete the superseded PNGs**

Only after sign-off:

```bash
rm static/articles_data/bulk-uploads-in-qdrant/option1-memory.png \
   static/articles_data/bulk-uploads-in-qdrant/option2-payload-index.png \
   static/articles_data/bulk-uploads-in-qdrant/option3-quantization.png \
   static/articles_data/bulk-uploads-in-qdrant/option4-sparse-ondisk.png \
   static/articles_data/bulk-uploads-in-qdrant/option5-batching.png \
   static/articles_data/bulk-uploads-in-qdrant/option6-parallel.png \
   static/articles_data/bulk-uploads-in-qdrant/option7-sharding.png
du -sh static/articles_data/bulk-uploads-in-qdrant
```

Expected: drops from 2.0 MB to roughly 0.65 MB (the decision-tree PNG stays).

- [ ] **Step 7: Run the full test suite and build**

```bash
node --test test/viz/ && hugo --logLevel error --destination /tmp/viz-prod-check
```

Expected: all tests PASS, build exits 0.

- [ ] **Step 8: Commit**

```bash
git add content/articles/bulk-uploads-in-qdrant.md static/articles_data/bulk-uploads-in-qdrant/
git commit -m "feat(viz): replace seven bulk-upload diagrams with compare shortcode

Removes 1.35 MB of PNG. Each caption now states the finding rather than
describing the image."
```

---

## Task 4: Subtract the decorative images from `qdrant-1.19.x`

Independent of every other task. Pure deletion, no design work.

**Files:**
- Modify: `content/blog/qdrant-1.19.x.md`
- Delete: `static/blog/qdrant-1.19.x/section-{1..9}.png`

**Interfaces:** none — this task consumes and produces nothing.

- [ ] **Step 1: Record the starting weight**

```bash
du -sh static/blog/qdrant-1.19.x
grep -c 'section-' content/blog/qdrant-1.19.x.md
```

Expected: `5.2M` and `8`.

- [ ] **Step 2: Confirm the three screenshots are the only images worth keeping**

```bash
grep -oE '!\[[^]]*\]\([^)]*\)' content/blog/qdrant-1.19.x.md | grep -v 'section-'
```

Expected: exactly three `web-ui-1.19-*.png` lines. Screenshots are legitimately raster and stay.

- [ ] **Step 3: Remove the eight decorative image lines**

```bash
python3 - <<'PY'
import re
p = "content/blog/qdrant-1.19.x.md"
s = open(p, encoding="utf-8").read()
out = re.sub(r'^!\[Section \d+\]\(/blog/qdrant-1\.19\.x/section-\d+\.png\)\n\n?', '', s, flags=re.M)
open(p, "w", encoding="utf-8").write(out)
print("removed", len(re.findall(r'section-\d', s)) - len(re.findall(r'section-\d', out)), "references")
PY
```

- [ ] **Step 4: Verify only the screenshots remain**

```bash
grep -c 'section-' content/blog/qdrant-1.19.x.md
grep -c 'web-ui-1.19' content/blog/qdrant-1.19.x.md
```

Expected: `0` and `3`.

- [ ] **Step 5: Delete the files, including the orphan**

`section-9.png` is referenced by nothing at all and goes with them.

```bash
rm static/blog/qdrant-1.19.x/section-{1,2,3,4,5,6,7,8,9}.png
du -sh static/blog/qdrant-1.19.x
```

Expected: drops from 5.2 MB to roughly 2.3 MB.

- [ ] **Step 6: Build and read the post end to end**

```bash
hugo --baseURL http://localhost:8899/ --destination /tmp/viz-preview --logLevel error
```

Read the rendered post. **Judgement call:** does any section now feel like it is missing something? The banners were decorative, but confirm none of them carried a heading cue the prose relied on.

- [ ] **Step 7: Commit**

```bash
git add content/blog/qdrant-1.19.x.md static/blog/qdrant-1.19.x/
git commit -m "chore(blog): remove decorative section banners from 1.19 release post

Nine PNGs totalling 2.9 MB carrying no information; section-9.png was
referenced by nothing. The three Web UI screenshots are kept."
```

---

## Task 5: Chart toolchain — CSV extraction and the generator

**Files:**
- Create: `scripts/viz/extract-table-csv.mjs`
- Create: `assets/viz/diskbbq/results.csv` (generated by that script, committed)
- Create: `data/viz-charts.json`
- Create: `scripts/viz/generate-charts.mjs`
- Create: `assets/viz/diskbbq/throughput.svg` (generated, committed)
- Modify: `test/viz/shortcodes.test.mjs`

**Interfaces:**
- Produces: `data/viz-charts.json` — an array of chart definitions, each
  `{ "id": string, "data": string (repo-relative CSV path), "kind": "bar",
     "x": string, "y": string, "series": string, "unit": string,
     "width": number, "height": number }`.
- Produces: `assets/viz/<id-path>.svg` containing **inner SVG markup only** — no
  outer `<svg>` element. The outer element and its `viewBox` come from
  `viz-figure.html` using `width`/`height` from the manifest.
- Produces: `npm run viz:charts`, idempotent — running it twice yields identical bytes.

The manifest carries `width`/`height` so nothing generated has to be read back
as metadata. Manifest and generator agree by construction.

- [ ] **Step 1: Write the failing test**

Append to `test/viz/shortcodes.test.mjs`:

```javascript
import { existsSync } from 'node:fs';

test('chart manifest is valid and every entry has a committed SVG', () => {
  const manifest = JSON.parse(readFileSync('data/viz-charts.json', 'utf8'));
  assert.ok(Array.isArray(manifest) && manifest.length > 0, 'manifest must be a non-empty array');
  for (const c of manifest) {
    for (const k of ['id', 'data', 'kind', 'x', 'y', 'width', 'height']) {
      assert.ok(c[k] !== undefined, `chart ${c.id}: missing "${k}"`);
    }
    assert.ok(existsSync(c.data), `chart ${c.id}: data file ${c.data} not found`);
    assert.ok(existsSync(`assets/viz/${c.id}.svg`),
      `chart ${c.id}: assets/viz/${c.id}.svg not found — run "npm run viz:charts"`);
  }
});

test('generated chart SVG has no outer <svg> element', () => {
  const svg = readFileSync('assets/viz/diskbbq/throughput.svg', 'utf8');
  assert.ok(!svg.trimStart().startsWith('<svg'),
    'generated file must contain inner markup only; viz-figure supplies the outer <svg>');
  assert.match(svg, /<rect|<g/, 'expected chart geometry in the output');
});

test('chart SVG contains the actual numbers from the CSV', () => {
  const csv = readFileSync('assets/viz/diskbbq/results.csv', 'utf8').trim().split('\n');
  const header = csv[0].split(',');
  const tp = header.indexOf('throughput_qps');
  const values = csv.slice(1).map((r) => r.split(',')[tp]);
  const svg = readFileSync('assets/viz/diskbbq/throughput.svg', 'utf8');
  for (const v of values) {
    assert.ok(svg.includes(v), `throughput value ${v} from the CSV is missing from the chart SVG`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test test/viz/
```

Expected: FAIL, `data/viz-charts.json` does not exist (ENOENT).

- [ ] **Step 3: Write the table extraction script**

Create `scripts/viz/extract-table-csv.mjs`. Extraction rather than hand-typing exists to prevent transcription errors between the post's table and the CSV.

```javascript
#!/usr/bin/env node
/**
 * One-shot: extract a markdown table from a post into CSV.
 *
 * Usage: node scripts/viz/extract-table-csv.mjs <post.md> <tableIndex> <out.csv>
 *
 * The post's table stays in place as the visible, machine-readable layer.
 * The CSV is derived from it and is what the chart generator reads.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [post, indexArg, out] = process.argv.slice(2);
if (!post || indexArg === undefined || !out) {
  console.error('usage: extract-table-csv.mjs <post.md> <tableIndex> <out.csv>');
  process.exit(1);
}

const lines = readFileSync(post, 'utf8').split('\n');
const tables = [];
let cur = [];
for (const l of lines) {
  if (l.trim().startsWith('|')) cur.push(l);
  else if (cur.length) { tables.push(cur); cur = []; }
}
if (cur.length) tables.push(cur);

const table = tables[Number(indexArg)];
if (!table) {
  console.error(`table index ${indexArg} not found; the file has ${tables.length}`);
  process.exit(1);
}

const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const header = cells(table[0]);
const rows = table.slice(2).map(cells);           // skip the |:---| alignment row

const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${csv}\n`);
console.log(`wrote ${out}: ${rows.length} rows x ${header.length} cols`);
```

- [ ] **Step 4: Extract, then clean the CSV into chartable columns**

```bash
node scripts/viz/extract-table-csv.mjs \
  content/blog/benchmark-elastic-diskbbq.md 1 assets/viz/diskbbq/raw.csv
cat assets/viz/diskbbq/raw.csv
```

The raw extraction carries units inside the values (`32.4 QPS`, `122.6 ms`) and
**two rows share the label `Qdrant, two-stage`**, distinguished only by the
`Nodes` column. Both need fixing before the data can be plotted. Write the
cleaned file:

```bash
python3 - <<'PY'
import csv, pathlib
src = list(csv.DictReader(open('assets/viz/diskbbq/raw.csv')))
out = pathlib.Path('assets/viz/diskbbq/results.csv')
num = lambda s: s.split()[0]
with out.open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['label', 'engine', 'recall_at_100',
                'throughput_qps', 'avg_latency_ms', 'p99_latency_ms'])
    for r in src:
        engine = 'Elasticsearch' if 'Elasticsearch' in r['Configuration'] else 'Qdrant'
        vcpu = r['Nodes'].split('/')[0].strip()          # e.g. "3 × 7 vCPU"
        w.writerow([f"{engine} {vcpu}", engine, r['Recall@100'],
                    num(r['Throughput']), num(r['Avg latency']), num(r['P99 latency'])])
print(out.read_text())
PY
rm assets/viz/diskbbq/raw.csv
```

Expected `assets/viz/diskbbq/results.csv`:

```
label,engine,recall_at_100,throughput_qps,avg_latency_ms,p99_latency_ms
Elasticsearch 3 × 7 vCPU,Elasticsearch,0.9599,32.4,122.6,184.3
Qdrant 3 × 2 vCPU,Qdrant,0.9596,67.2,59.5,86.0
Qdrant 3 × 4 vCPU,Qdrant,0.9596,111.9,35.7,83.1
```

Cross-check every number against `content/blog/benchmark-elastic-diskbbq.md:70-72` before continuing.

- [ ] **Step 5: Write the chart manifest**

Create `data/viz-charts.json`:

```json
[
  {
    "id": "diskbbq/throughput",
    "data": "assets/viz/diskbbq/results.csv",
    "kind": "bar",
    "x": "label",
    "y": "throughput_qps",
    "series": "engine",
    "label": "Throughput",
    "unit": "QPS",
    "width": 820,
    "height": 340
  }
]
```

- [ ] **Step 6: Write the chart generator**

Create `scripts/viz/generate-charts.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Generate chart SVGs from data/viz-charts.json.
 *
 * Output is COMMITTED. CI re-runs this and fails if the result differs, so a
 * chart can never silently disagree with its data. See the design spec §5.2.
 *
 * Emits INNER svg markup only — layouts/partials/viz-figure.html supplies the
 * outer <svg>, its viewBox, role and aria wiring.
 */
import * as Plot from '@observablehq/plot';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const viz = JSON.parse(readFileSync('data/viz.json', 'utf8'));
const manifest = JSON.parse(readFileSync('data/viz-charts.json', 'utf8'));

function readCsv(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split('\n');
  const cols = head.split(',');
  return rows.map((r) => Object.fromEntries(
    r.split(',').map((v, i) => [cols[i], Number.isNaN(Number(v)) ? v : Number(v)])));
}

/** Qdrant series always takes the brand color; everything else follows in order. */
function colorRange(values) {
  const others = values.filter((v) => v !== 'Qdrant');
  return ['Qdrant', ...others].map((_, i) => viz.palette.categorical[i]);
}

const dom = new JSDOM('');
let count = 0;

for (const c of manifest) {
  if (c.kind !== 'bar') throw new Error(`chart ${c.id}: unsupported kind ${c.kind}`);
  const data = readCsv(c.data);
  const seriesValues = [...new Set(data.map((d) => d[c.series]))];

  const node = Plot.plot({
    document: dom.window.document,
    width: c.width,
    height: c.height,
    marginLeft: 150,
    marginBottom: 44,
    style: { fontFamily: viz.type.family, fontSize: `${viz.type.tick}px`, background: 'none' },
    x: { label: `${c.label ?? c.y.replace(/_/g, ' ')} (${c.unit})`, grid: true, nice: true },
    y: { label: null },
    color: { domain: ['Qdrant', ...seriesValues.filter((v) => v !== 'Qdrant')],
             range: colorRange(seriesValues) },
    marks: [
      Plot.barX(data, { x: c.y, y: c.x, fill: c.series, sort: { y: 'x' } }),
      Plot.text(data, { x: c.y, y: c.x, text: (d) => `${d[c.y]}`,
                        dx: 14, fill: viz.surface.ink, fontSize: viz.type.label }),
      Plot.ruleX([0], { stroke: viz.surface.axis }),
    ],
  });

  // Strip the outer <svg> wrapper; viz-figure supplies it.
  const outer = node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg');
  if (!outer) throw new Error(`chart ${c.id}: Plot did not return an <svg>`);
  const inner = outer.innerHTML;

  const out = `assets/viz/${c.id}.svg`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${inner}\n`);
  console.log(`wrote ${out}`);
  count += 1;
}

console.log(`${count} chart(s) generated`);
```

- [ ] **Step 7: Generate the chart**

```bash
npm run viz:charts
```

Expected: `wrote assets/viz/diskbbq/throughput.svg` then `1 chart(s) generated`.

- [ ] **Step 8: Verify idempotency**

```bash
cp assets/viz/diskbbq/throughput.svg /tmp/chart-before.svg
npm run viz:charts
diff /tmp/chart-before.svg assets/viz/diskbbq/throughput.svg && echo "OK: generation is deterministic"
```

Expected: `OK: generation is deterministic`. If it differs, the generator is emitting non-deterministic output (usually a random id) and the CI drift check in Task 7 will be useless — fix before continuing.

- [ ] **Step 9: Run the tests to verify they pass**

```bash
node --test test/viz/
```

Expected: PASS, 11 tests.

- [ ] **Step 10: Commit**

```bash
git add scripts/viz/ data/viz-charts.json assets/viz/ test/viz/
git commit -m "feat(viz): add chart generator and extract diskbbq benchmark data to CSV"
```

---

## Task 6: `{{< chart >}}` shortcode and the benchmark retrofit

**Files:**
- Create: `layouts/shortcodes/chart.html`
- Modify: `content/blog/benchmark-elastic-diskbbq.md`
- Modify: `content/blog/viz-fixtures.md`
- Modify: `test/viz/shortcodes.test.mjs`

**Interfaces:**
- Consumes: `partial "viz-figure.html"` (Task 1); `data/viz-charts.json` and `assets/viz/<id>.svg` (Task 5).
- Produces: shortcode `chart` with params `id` (required, must match a manifest entry) and `caption` (required).

- [ ] **Step 1: Write the failing test**

Append to `test/viz/shortcodes.test.mjs`:

```javascript
test('chart shortcode inlines the committed SVG with a caption', () => {
  const html = getFixtureHtml();
  assert.match(html, /aria-labelledby="viz-title-diskbbq-throughput"/, 'chart figure missing');
  assert.match(html, /At a third the vCPU/, 'chart caption missing');
  assert.match(html, /111\.9/, 'chart data label missing from inlined SVG');
  assert.match(html, /viewBox="0 0 820 340"/, 'viewBox must come from the manifest');
});
```

Append to `test/viz/compare-validation.test.mjs`:

```javascript
test('chart fails the build for an unknown id', () => {
  const out = withPage(`{{< chart id="does/not-exist" caption="c" >}}`,
    () => buildExpectingFailure());
  assert.match(out, /does\/not-exist/, 'error must name the missing chart id');
});

test('chart fails the build when caption is missing', () => {
  const out = withPage(`{{< chart id="diskbbq/throughput" >}}`,
    () => buildExpectingFailure());
  assert.match(out, /caption/i, 'error must mention the missing caption');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test test/viz/
```

Expected: FAIL — shortcode `chart` not found.

- [ ] **Step 3: Implement the shortcode**

Create `layouts/shortcodes/chart.html`:

```go-html-template
{{- /*
  chart — inline a pre-generated, committed chart SVG.

  The SVG is produced by "npm run viz:charts" from data/viz-charts.json and is
  committed to the repo. CI verifies regeneration produces no diff, so the chart
  cannot drift from its data.

  Params:
    id       required. Must match an "id" in data/viz-charts.json.
    caption  required. One sentence stating the finding.
*/ -}}
{{- $id := .Get "id" -}}
{{- if not $id -}}
  {{- errorf "chart in %s: 'id' is required and must match an entry in data/viz-charts.json." .Position -}}
{{- end -}}
{{- $caption := .Get "caption" -}}
{{- if not $caption -}}
  {{- errorf "chart in %s: 'caption' is required. State the finding, not the chart type." .Position -}}
{{- end -}}

{{- $spec := false -}}
{{- range (index site.Data "viz-charts") -}}
  {{- if eq .id $id -}}{{- $spec = . -}}{{- end -}}
{{- end -}}
{{- if not $spec -}}
  {{- errorf "chart in %s: no chart with id %q in data/viz-charts.json." .Position $id -}}
{{- end -}}

{{- $res := resources.Get (printf "viz/%s.svg" $id) -}}
{{- if not $res -}}
  {{- errorf "chart in %s: assets/viz/%s.svg not found. Run \"npm run viz:charts\"." .Position $id -}}
{{- end -}}

{{- partial "viz-figure.html" (dict
      "svg" $res.Content
      "viewBox" (printf "0 0 %d %d" (int $spec.width) (int $spec.height))
      "caption" $caption
      "id" (replace $id "/" "-")
      "class" "viz-figure--chart") -}}
```

- [ ] **Step 4: Add the fixture**

Append to `content/blog/viz-fixtures.md`:

```markdown
{{< chart id="diskbbq/throughput" caption="At a third the vCPU, Qdrant sustained 3.5x Elasticsearch's throughput at matched recall." >}}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
node --test test/viz/
```

Expected: PASS, 14 tests.

- [ ] **Step 6: Retrofit the benchmark post**

In `content/blog/benchmark-elastic-diskbbq.md`, replace the `image1.png` reference with the shortcode, placed immediately after the results table (currently ending at line 72):

```markdown
{{< chart id="diskbbq/throughput" caption="At matched recall (0.9596 vs 0.9599), Qdrant on 3 x 2 vCPU sustained twice Elasticsearch's throughput on 3 x 7 vCPU, and 3.5x on 3 x 4 vCPU." >}}
```

Leave both markdown tables in place — they are the visible, machine-readable layer the design requires.

- [ ] **Step 7: Verify the numbers agree**

```bash
node --test test/viz/ && \
grep -oE '[0-9]+\.[0-9]' assets/viz/diskbbq/results.csv | sort -u > /tmp/csv-nums.txt && \
sed -n '70,72p' content/blog/benchmark-elastic-diskbbq.md
```

Read the table rows and confirm each throughput, latency and recall figure appears in `results.csv` exactly.

- [ ] **Step 8: Delete the superseded chart PNG**

```bash
rm static/blog/benchmark-elastic-diskbbq/image1.png
grep -c 'image1.png' content/blog/benchmark-elastic-diskbbq.md
```

Expected: `0`.

**Note:** `hero.png` in that bundle is 5.8 MB and is a separate problem — it is the post's social/preview image, not an explanatory figure. Out of scope here; flag it for a follow-up.

- [ ] **Step 9: Build and review in the browser**

```bash
hugo --baseURL http://localhost:8899/ --destination /tmp/viz-preview --logLevel error
```

Check the chart at desktop and 390px: bars legible, labels not clipped, no horizontal page overflow.

- [ ] **Step 10: Commit**

```bash
git add layouts/shortcodes/chart.html content/blog/benchmark-elastic-diskbbq.md \
        content/blog/viz-fixtures.md static/blog/benchmark-elastic-diskbbq/ test/viz/
git commit -m "feat(viz): add chart shortcode and retrofit diskbbq benchmark post"
```

---

## Task 7: CI drift check

Without this, a committed chart can silently disagree with its CSV. This is the guarantee that makes committed output safe.

**Files:**
- Create: `scripts/viz/check-charts-current.sh`
- Modify: `package.json`

**Interfaces:**
- Consumes: `npm run viz:charts` (Task 5).
- Produces: `npm run viz:check`, exit 0 when clean, 1 with a diff when stale.

- [ ] **Step 1: Write the check script**

Create `scripts/viz/check-charts-current.sh`:

```bash
#!/usr/bin/env bash
# Fail if committed chart SVGs are stale relative to their data.
# See docs/superpowers/specs/2026-08-27-blog-visual-system-design.md §5.2
set -euo pipefail

npm run --silent viz:charts

if ! git diff --quiet -- assets/viz; then
  echo "ERROR: committed chart SVGs are out of date with their source data."
  echo "Run 'npm run viz:charts' and commit the result."
  echo
  git --no-pager diff --stat -- assets/viz
  exit 1
fi

echo "OK: all chart SVGs match their source data."
```

```bash
chmod +x scripts/viz/check-charts-current.sh
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add:

```json
"viz:check": "bash scripts/viz/check-charts-current.sh"
```

- [ ] **Step 3: Verify it passes on a clean tree**

```bash
npm run viz:check
```

Expected: `OK: all chart SVGs match their source data.`

- [ ] **Step 4: Verify it actually catches drift**

```bash
sed -i 's/111.9/999.9/' assets/viz/diskbbq/results.csv
npm run viz:check; echo "exit=$?"
```

Expected: the ERROR message and `exit=1`. Then restore:

```bash
git checkout -- assets/viz/diskbbq/results.csv
npm run viz:charts
npm run viz:check
```

Expected: back to `OK`.

- [ ] **Step 5: Commit**

```bash
git add scripts/viz/check-charts-current.sh package.json
git commit -m "chore(viz): add CI check that chart SVGs match their source data"
```

- [ ] **Step 6: Wire into CI**

The repo has no `.github/workflows` directory. Wiring `npm run viz:check` into the actual deployment pipeline is a follow-up that depends on where the site is built — raise it with the person who owns the deploy rather than guessing here. Until then the check is available locally and in code review.

---

## Note on the bespoke flagship lane (spec §5.4)

The spec's third tier — hand-authored SVG for flagship posts — deliberately gets
no task. It needs no tooling: an author writes SVG by hand and pulls colors from
`data/viz.json`. The only rule is that it renders through
`partial "viz-figure.html"` so it inherits the same caption contract. Nothing to
build; recorded here so the omission is visibly intentional rather than a gap.

## Pilot outcome to report

After Task 7, report:

| | before | after |
|---|---|---|
| `articles/bulk-uploads-in-qdrant` | 2.0 MB | measure |
| `blog/qdrant-1.19.x` | 5.2 MB | measure |
| `blog/benchmark-elastic-diskbbq` | 7.1 MB | measure (hero.png dominates and stays) |
| explanatory raster images across the three | 16 | measure |
| figures with a caption stating a finding | 0 | measure |

And answer the gate question from Task 3 in one line: **did one component collapse seven diagrams without losing meaning?**
