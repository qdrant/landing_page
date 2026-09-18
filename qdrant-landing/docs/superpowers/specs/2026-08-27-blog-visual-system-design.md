# Blog visual system — design

**Date:** 2026-08-27
**Status:** approved for pilot — implementation plan next
**Scope:** `content/blog` and `content/articles`

---

## 1. Problem

The bar for technical writing rose because AI made competent prose cheap. What
now separates a strong engineering post is whether the visuals show a real
mechanism or a real measurement — and whether a machine can read them at all.

Three reference posts were torn down in full (Cursor's *Git at Any Scale*, Exa's
*RL search outcomes*, turbopuffer's *SID-1*). Between them they contain **zero
explanatory raster images**. Every diagram and chart is DOM, SVG, or text.

Our own numbers, measured across `content/blog` + `content/articles`
(614 image references):

| what the image is | count |
|---|---|
| architecture / diagram | 146 |
| concept illustration | 90 |
| decorative banner, carries no information | 87 |
| benchmark / chart | 60 |
| UI screenshot (legitimately raster) | 34 |

Two findings drive the design:

1. **Diagrams outnumber charts about 2.4 : 1.** A chart kit alone under-serves
   the actual need.
2. **Only 13% of images have descriptive alt text** (≥60 chars). 38% have alt
   text that is empty or literally the filename slug. Converting those PNGs to
   SVG would do almost nothing for a scraper, because SVG path coordinates are
   as opaque as pixels. **The caption discipline is the real machine-readability
   win**, and it is independent of rendering technology.

A third finding sets a durability rule. `articles/tuning-qdrant-optimizer.md`
publishes eight benchmark charts whose underlying numbers exist **only inside
the PNGs** — no CSV, no JSON, no table. Those charts cannot be corrected,
restyled, or re-plotted without re-running the benchmark.

## 2. Goals

- Explanatory visuals are DOM/SVG, present in the HTML, readable without JS.
- Every figure states its own claim in text.
- Published charts remain reproducible from data in the repo.
- Routine posts get correct, on-brand visuals with no visual decisions required
  of the author.
- A flagship post can go further without forking the design language.

## 3. Non-goals

- Migrating all 614 images. This design covers a three-post pilot.
- Interactivity. Not ruled out later, ruled out as a default — client-rendered
  content is invisible to the scrapers and models we are optimising for.
- Replacing UI screenshots. Screenshots are legitimately raster.
- A domain-primitive library (embedding-space explorers, HNSW walkthroughs).
  Considered and deferred; see §11.

## 4. Decisions taken before this document

| decision | choice |
|---|---|
| differentiation | house chart + diagram kit, not domain primitives |
| authoring model | two-tier: data-driven kit for routine posts, bespoke SVG for flagship posts |
| engine | split: build-time library for charts, Hugo-native templates for diagrams |
| ASCII/UTF-8 diagrams (turbopuffer style) | **rejected** — it is their signature; adopting it reads as imitation |

## 5. Architecture

Three layers, one shared token file.

```
data/viz.json ──────────┬──────────────────────────────┐
  palette, type scale,  │                              │
  stroke weights        ▼                              ▼
                 CHART ENGINE (B)              DIAGRAM ENGINE (A)
                 Node + Observable Plot        Hugo Go templates
                 run locally, SVG committed    build-time, no deps
                        │                              │
                        └──────────┬───────────────────┘
                                   ▼
                        {{< chart >}} / {{< compare >}}
                                   │
                                   ▼
                        <figure> + inline SVG + <figcaption>
```

### 5.1 Token layer — `data/viz.json`

Single source of truth for the visual language: categorical palette, sequential
ramp, type scale, stroke weights, grid and axis colors.

Consumed by the Node generator and by Hugo diagram templates. **The viz palette
is defined here and nowhere else** — surrounding chrome (figure margins, caption
type) keeps using the existing SCSS `$neutral-*` tokens, so no color value is
duplicated across the two systems.

Emitted into SVG as CSS custom properties on the root `<svg>` rather than
hardcoded `fill=` attributes. The site has no dark mode today
(`[data-theme='dark']` is scoped to the search dialog only), so this buys
nothing now — it means a future dark mode is a token swap rather than
re-authoring every figure.

### 5.2 Chart engine (B) — build-time, committed output

Charts need real math: scales, nice tick intervals, label collision. Go
templates are the wrong tool. Observable Plot in Node produces clean, compact
SVG and the repo already requires Node ≥22 with a webpack toolchain, so this is
not a new class of dependency.

**The generator is a local dev tool and its SVG output is committed.**

Rationale:
- CI does not need the chart toolchain.
- Reviewers see the actual SVG diff in the pull request.
- The published page never depends on a generation step succeeding.

Drift is prevented by a CI check that regenerates and fails if the result
differs from what is committed, so a chart can never silently disagree with its
data.

Flow:

```
content/blog/<post>.md          table or data/<post>.csv
        │                                │
        └────────────┬───────────────────┘
                     ▼
        npm run viz:charts        (local, on demand)
                     ▼
   assets/viz/<post>/<name>.svg  ── committed ──▶ {{< chart >}} inlines it
```

### 5.3 Diagram engine (A) — Hugo-native

Diagrams are structural: boxes, lanes, arrows, before/after pairs. That needs
layout and house style, not statistics. A Go template emitting SVG at build time
keeps diagrams dependency-free and editable by anyone who can edit Hugo
templates.

### 5.4 Bespoke flagship lane

Hand-authored SVG that imports the same custom properties from `data/viz.json`.
No tooling required. The only rule is that it uses the token file, so a one-off
piece still looks like it belongs.

## 6. Components in pilot scope

Deliberately three. Everything else waits until a post needs it.

### 6.1 `{{< chart >}}` — grouped bar only

```
{{< chart
     kind="bar"
     data="benchmarks/diskbbq.csv"
     x="configuration" y="throughput" series="engine"
     unit="QPS"
     caption="At a third the vCPU, Qdrant sustained 3.5x the throughput at matched recall." >}}
```

- `caption` **required** — build fails without it
- reads a CSV in the page bundle, or a named markdown table in the post
- emits inline `<svg role="img">` with `<title>` and `<desc>` from the caption

### 6.2 `{{< compare >}}` — before/after diagram

The single highest-leverage shape in the repo: seven of the eight diagrams in
`articles/bulk-uploads-in-qdrant.md` are this exact pattern.

```
{{< compare caption="Creating the payload index before upload avoids a query-time fallback and an HNSW rebuild." >}}
{{< compare-side label="Index after upload" tone="cost" >}}
upload points -> query -> full scan fallback -> rebuild HNSW
{{< /compare-side >}}
{{< compare-side label="Index before upload" tone="win" >}}
create index -> upload points -> filtered search is fast immediately
{{< /compare-side >}}
{{< /compare >}}
```

### 6.3 Figure wrapper — shared

Both components render through one wrapper enforcing the accessibility contract
in §7.

## 7. Accessibility and machine-readability contract

Given that 87% of current images carry alt text under 60 characters and 59%
under 25, this is the part
that carries the most value and it is enforced, not encouraged.

- `caption` is a **required** parameter. A missing caption fails the build.
- The caption states the **finding**, not the object.
  Good: *"Retrieval delivered the document; ranking buried it at rank 40."*
  Bad: *"Figure 3: pipeline diagram."*
- The caption becomes the SVG `<title>`, and is rendered visibly as
  `<figcaption>`. The `<svg>` carries `role="img"` and `aria-labelledby`
  pointing at the title, so it is announced once, not twice.
- Charts additionally ship their data: the source CSV stays in the page bundle,
  or the source table remains visible in the post.

## 8. Pilot

Three posts. Each proves one thing, and each can fail independently.

### 8.1 `blog/benchmark-elastic-diskbbq.md` — proves the chart path

Recall, throughput, average and p99 latency across three configurations already
exist in a markdown results table (a second table records the test setup).
Small — three rows, four metrics — but it is the exact comparison the post
argues, and the numbers are in the repo. The chart is generated from the table, so the two cannot
drift, and the table remains the machine-readable layer.

Currently 7.2MB of static assets — one 927KB chart PNG and a **5.8MB hero image**.

*Acceptance:* chart renders from committed data; regeneration is byte-identical;
the numbers in the SVG match the table exactly.

### 8.2 `articles/bulk-uploads-in-qdrant.md` — proves the diagram path

Seven of eight diagrams share the before/after shape (`on_disk`, payload index
timing, quantization, sparse on-disk, batching, parallel workers, sharding),
totalling 1.35 MB of PNG (1.54 MB including the eighth, a decision tree).

*Acceptance:* one `{{< compare >}}` component replaces all seven with no loss of
meaning, checked against each PNG's existing alt text, which is unusually good in
this post and can serve as a statement of author intent. **If seven cannot
collapse into one component, the kit premise is wrong and we stop and rethink.**

### 8.3 `blog/qdrant-1.19.x.md` — proves the subtraction rule

Eight `section-N.png` at ~330 KB each — 2.6 MB carrying no information. Pure
deletion. The three Web UI screenshots stay.

A ninth, `section-9.png` (358 KB), sits in the bundle referenced by nothing at
all, which is its own small argument for the rule.

*Acceptance:* page weight roughly halves; nothing a reader needs is lost.

Combined current static weight across the three pilot posts: 14.4 MB
(7.1 + 2.0 + 5.2).

## 9. Verification

- Hugo builds clean with the new shortcodes.
- Build fails when `caption` is omitted (negative test).
- Chart regeneration produces no diff against committed SVG.
- Rendered figures checked in a real browser at desktop and 390px: no horizontal
  page overflow, text legible, `<title>`/`<figcaption>` present.
- Page weight measured before and after for each pilot post.

## 10. Risks

| risk | mitigation |
|---|---|
| Two engines become two half-maintained systems | Shared token file and shared figure wrapper; the split is at rendering only |
| Committed SVG goes stale against its data | CI regeneration drift check |
| Authors skip the kit and paste a PNG | Caption is required and the rule is written down; enforcement is review, not tooling, in the pilot |
| The before/after shape does not generalise past this one post | This is exactly what pilot 8.2 tests, and it is allowed to fail |
| Observable Plot output is verbose | Measure SVG size in the pilot; inline SVG is compared against the PNG it replaces, not against zero |

## 11. Deferred

- **Domain primitives** — interactive embedding-space, HNSW descent, quantization
  dial. The genuinely uncopyable idea, since our subject matter is natively
  geometric in a way git packfiles and RL rollouts are not. Deferred because the
  audit shows the everyday need is diagrams and charts, not flagship set pieces.
  Revisit after the pilot.
- Line charts, distributions, flow diagrams — add when a post needs one.
- Backfilling the remaining ~600 images.
- Recovering the lost source data behind `tuning-qdrant-optimizer`'s eight charts.

## 12. Settled

**Chart data source: extract to CSV.** `{{< chart >}}` reads a CSV from the page
bundle; it does not parse markdown tables. Decided 2026-08-27.

The CSV in the page bundle is also what satisfies the data rule in §7, so the
extraction is not overhead — it is the deliverable. For the pilot post, the two
existing markdown tables stay in place as the visible, machine-readable layer;
the CSV is extracted from them once, and the chart is generated from the CSV.

Consequence to watch: table and CSV are now two copies of the same numbers. The
regeneration drift check in §5.2 covers CSV-vs-chart, not table-vs-CSV. Keeping
the tables authoritative and the CSV derived is the reason extraction is a
one-time scripted step rather than hand-typing.
