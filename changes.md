Problems in Evaluation and Retrieval Quality Measurement:
No bridge from technical metrics to business outcomes. The existing tutorial covers ANN recall and precision but doesn't connect these to retrieval relevance or business impact. Brian's three-level framework (ANN recall, retrieval relevance, business impact) is not documented.

Golden query set generation at scale not covered. Ground truth construction is mentioned but no methodology for generating golden queries at scale or handling the data leakage risks that Goodnotes flagged.

No "which metric when" decision guidance. Customers use inconsistent metrics because there's no guidance on choosing K values, selecting between recall and precision, or when NDCG matters. This varies, but maybe we can provide some general direction with disclaimers.

---

## Proposed Changes

### Architecture: split into 3 pages

The existing `retrieval-quality.md` is too long and mixes conceptual framing, ground truth methodology, and hands-on HNSW tuning into a single page. Customers searching for metric guidance or ground truth construction have no way to land directly on the relevant content. The three problems map cleanly onto three distinct pages.

| New page | Slug | Addresses |
|---|---|---|
| Retrieval Quality Fundamentals | `retrieval-quality-fundamentals` | Problems 1 and 3 |
| Building a Golden Query Set | `retrieval-quality-golden-set` | Problem 2 |
| Retrieval Quality Evaluation *(existing)* | `retrieval-quality` *(unchanged)* | Existing HNSW tuning content |

The existing `retrieval-quality.md` keeps its path and both aliases so no redirects break. The `### Quality metrics` subsection moves from the existing page into page 1, since it is conceptual context rather than hands-on instruction.

A note on `precision@k` vs `recall@k` in the ANN-only section: when exact and approximate search each return exactly `k` results, `|ANN ∩ exact| / k` is numerically identical whether you call it precision or recall. The ANN-benchmarks literature standardises on **recall**, and we are aligning with that convention — but we should commit to the rename consistently across the page (see Page 3 changes) rather than mixing the two terms in the same document.

---

### Page 1 (new): Retrieval Quality Fundamentals

**File:** `qdrant-landing/content/documentation/tutorials-search-engineering/retrieval-quality-fundamentals.md`

**Proposed content:**

```markdown
---
title: Retrieval Quality Fundamentals
weight: 4
aliases:
  - /documentation/tutorials/retrieval-quality-fundamentals/
---

# Retrieval Quality Fundamentals

| Time: 15 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Before we start measuring, it is worth understanding what we are actually measuring. Retrieval quality operates at three distinct levels, and it is easy to optimise for the wrong one.

The first level is **ANN recall**: does the approximate search return the same results as an exact nearest-neighbour search? This is a purely algorithmic question about how faithfully HNSW approximates exhaustive search. It has nothing to do with whether those results are useful to a human.

The second level is **retrieval relevance**: of the results returned, how many are actually relevant to the query intent? This requires a labeled ground-truth dataset or human judgment. A pipeline can achieve near-perfect ANN recall and still surface irrelevant documents if the embeddings are a poor fit for the task.

The third level is **business impact**: does better retrieval lead to better outcomes — lower hallucination rates in downstream LLMs, higher task-completion rates, or improved user satisfaction scores? This is what stakeholders ultimately care about, but it is the hardest to measure directly. The causal chain from a vector match to a user outcome is long and easily dominated by generator behaviour, UI, and other confounders, so no single offline metric is a reliable proxy for a KPI. The next section describes how teams bridge this gap in practice.

## Connecting the levels in practice

The three levels are not measured in isolation. Teams that successfully connect retrieval work to business outcomes tend to build an **evaluation ladder** that runs each layer at a different cadence and cost, and uses the result of each layer to decide whether to invest effort at the next:

| Layer | Question it answers | Cadence | Cost |
|---|---|---|---|
| `Recall@k` vs exact kNN | Is the ANN plumbing sound? | Every CI run | ~free |
| `Recall@k` / `NDCG@k` vs labeled golden set | Are the right documents surfacing? | Weekly | cheap (pre-built set) |
| End-to-end answer quality on golden set, scored by LLM-as-judge or human rating | Does the user actually get a correct answer? | Weekly | moderate |
| Online A/B behind a flag | Does the business KPI move? | Per release | expensive |

Each layer is necessary but not sufficient. A win at layer 2 that does not carry through to layer 3 usually means the generator or the prompt is the bottleneck, not retrieval — this is the single most useful diagnostic the ladder provides, and the reason teams should not collapse layers 2 and 3 into a single score.

**Isolate the component under test.** When end-to-end quality moves, hold one side fixed: evaluate retrieval with the generator frozen, and evaluate the generator with retrieval frozen. Without this, attribution collapses into guesswork and the ladder stops being diagnostic.

**Proxy KPIs for teams without A/B infrastructure.** Most teams do not have the traffic or tooling to run a proper A/B. Cheap production signals that correlate with business value — click position on surfaced results, answer copy or share rate, session-level task completion, thumbs-up/down — can be instrumented long before a formal experimentation platform exists, and sit usefully between the golden-set layer and the full A/B.

**Pre-register the decision rule.** Before running the A/B, write down what constitutes a win and what constitutes a no-ship, in terms of both the retrieval metric and the KPI. This is the highest-leverage discipline for avoiding "recall improved but the KPI didn't — the KPI is noisy, let's ship anyway" rationalisation.

**Tooling.** Qdrant owns layers 1 and 2 directly. For layer 3, the ecosystem has mature tooling — [Ragas](https://docs.ragas.io/), [Phoenix](https://phoenix.arize.com/), [DeepEval](https://docs.confident-ai.com/) — that handles LLM-as-judge scoring and offline answer-quality eval. Use those rather than rebuilding the scoring harness in-house.

## Quality metrics

There are various ways to quantify the quality of semantic search. Some of them, such as [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k),
are based on the number of relevant documents in the top-k search results. Others, such as [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank),
take into account the position of the first relevant document in the search results. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain)
metrics are, in turn, based on the relevance score of the documents.

If we treat the search pipeline as a whole, we could use them all. However, for the ANN algorithm itself, anything based on the relevance score or ranking is not applicable. Ranking in vector search relies on the distance between the query and the document in the vector space, and distance is not going to change due to approximation, as the function is still the same. Therefore, the right measure for the ANN algorithm is **`recall@k`**: of the true `k` nearest neighbours returned by exact search, how many does the approximate search recover? It is calculated as `|ANN results ∩ exact results| / k`. Note that when both ANN and exact search return exactly `k` items, `recall@k` and `precision@k` are numerically identical — we use "recall" to stay aligned with the ANN-benchmarks convention and to make it clear the ground truth is the exact top-k set.

### Choosing the right metric

The right choice of metric depends on what the search pipeline does with its results, and on what ground truth is available. The table below is a starting point, not a prescription — pick the metric that matches your ground truth and your user-visible behaviour.

| Scenario | Recommended metric | Ground truth | Why |
|---|---|---|---|
| Tuning HNSW parameters | `Recall@k` | Exact kNN search | Measures how many of the true `k` nearest neighbours the ANN recovered; ranking within that set is unaffected by approximation |
| RAG pipeline (LLM reads top-k chunks) | `Recall@k` | Labeled relevant chunks | The LLM can recover if a relevant doc is at position 3 vs 1; missing it entirely hurts more |
| Single-answer retrieval (FAQ, Q&A) | `MRR` or `Hits@1` | Labeled correct answer | The first result is what the user acts on; lower ranks matter little |
| Re-ranking or recommendation feeds | `NDCG@k` | Graded relevance labels (e.g. 0/1/2) | Order within the result list matters; a highly relevant doc at rank 5 is worse than at rank 1 |

Note that `Recall@k` appears twice with different ground truths: against exact kNN when tuning the index, against labeled data when evaluating the pipeline end-to-end. They share a formula but answer different questions.

On choosing `k`: it is worth setting it to match actual usage. If the application shows 5 results to the user, we should measure `@5`. If a RAG pipeline passes 10 chunks to the LLM, we should measure `@10`. Reporting `@100` for a UI that surfaces 5 results will make the metric look artificially good.

`NDCG` is worth the added complexity only when we have **graded relevance labels** — for example 0/1/2 scores per query-document pair rather than binary relevant/not-relevant — and when the downstream system actually benefits from fine-grained ranking. Without multi-grade annotations, the simpler metrics will give us a cleaner signal with less labeling overhead.

## Next steps

To build a labeled dataset for relevance evaluation, see [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/). To measure and tune the ANN recall of a Qdrant collection in practice, see [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/).
```

---

### Page 2 (new): Building a Golden Query Set

**File:** `qdrant-landing/content/documentation/tutorials-search-engineering/retrieval-quality-golden-set.md`

**Proposed content:**

```markdown
---
title: Building a Golden Query Set
weight: 5
aliases:
  - /documentation/tutorials/retrieval-quality-golden-set/
---

# Building a Golden Query Set

| Time: 20 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Evaluating retrieval relevance requires a labeled dataset of queries paired with their expected relevant documents — commonly called a *golden query set* or *ground truth*. The [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) tutorial measures **ANN recall** against exact kNN, which needs no relevance labels at all. This page covers the separate task of building labeled data to measure **retrieval relevance** against real user intent.

## Generating queries

The highest-fidelity source is **real user queries mined from logs**. If the application records clicks or explicit feedback, we can sample query-document pairs and use them directly. This should be the first option we reach for before generating synthetic data. When sampling, it is worth stratifying by query type or topic cluster rather than sampling uniformly at random — a random sample will over-represent frequent queries and leave rare-but-important cases uncovered. As a rough heuristic, a few hundred labeled pairs is usually enough to detect large metric differences; detecting small ranking differences or slicing by query type requires substantially more. The right number depends on your effect size and query-level variance, so treat any specific number as a starting point and widen confidence intervals if the signal is noisy.

When logs are not available, **LLM-based synthetic generation** is a practical alternative. For each document in the corpus, we can prompt a capable LLM to generate a handful of queries that a user would plausibly ask if they were looking for that document. This scales cheaply to thousands of query-document pairs.

```python
import os

import anthropic

client = anthropic.Anthropic()

def generate_queries_for_doc(doc_text: str, n: int = 3) -> list[str]:
    response = client.messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": (
                f"Generate {n} short, realistic search queries that would lead a user to the "
                f"following document. Return only the queries, one per line.\n\n{doc_text}"
            ),
        }],
    )
    return response.content[0].text.strip().splitlines()
```

For high-stakes applications, **human annotation** is the cleanest approach. Domain experts rate query-document pairs on a 3–5 point relevance scale, which is expensive but produces the signal needed for NDCG-based evaluation.

## Pitfalls to watch for (data leakage and friends)

The term **data leakage** is often used loosely to cover any situation where evaluation scores come out higher than real-world performance would justify. Unlike classical ML train/test leakage, the failure modes for golden query sets are more subtle — the document that a query was generated from **must** be indexed (it is the relevant answer the evaluation expects to find), so "hold out the labeled docs from the index" is *not* the right fix. The real risks are the following.

**Synthetic-query unrealism.** LLMs tend to paraphrase the source document's wording. The resulting queries are much easier to retrieve than what real users type, which are typically shorter, vaguer, and use different vocabulary. Offline scores on synthetic queries therefore overstate production quality. Two practical mitigations: (1) prompt the LLM to write queries "as a user who has not seen this document", and (2) anchor a sample of synthetic queries against any real queries you do have, and verify the distributions of length and specificity are comparable.

**Embedding-model contamination.** If the embedding model was fine-tuned on (query, document) pairs that overlap with the golden set, the evaluation measures in-distribution performance and overstates real-world behaviour. When using an off-the-shelf model, check its training mixture if published; when fine-tuning in-house, keep a strict split between fine-tuning data and evaluation data.

**Near-duplicate documents.** If two documents are nearly identical, a query generated from one will retrieve the other, but the other won't be in the labels — so **precision is under-reported** because the labeled relevant set is incomplete. Deduplicate the corpus before generating labels (e.g. drop documents with cosine similarity > 0.95 to an earlier document), or label near-duplicate clusters jointly.

**Temporal drift.** If the corpus evolves over time, evaluating with queries generated from documents that post-date the index version under test is unfair — those documents simply aren't there to retrieve. Pin the corpus snapshot, generate queries from that snapshot, and re-generate the golden set when the corpus changes materially.

**Reviewer reproducibility.** Whatever approach you pick, pin the data: the corpus snapshot, the query-generation prompt, the LLM model version, and any deduplication threshold. Without this, a later "the score got worse" investigation cannot tell whether the retrieval regressed or the evaluation set changed underneath it.
```

---

### Page 3 (existing): Retrieval Quality Evaluation

**File:** `qdrant-landing/content/documentation/tutorials-search-engineering/retrieval-quality.md`

**Changes required:**
- Remove the `### Quality metrics` subsection (moving to page 1)
- Update the `weight` from `4` to `6`
- Add a brief intro sentence linking to page 1 for conceptual background (e.g. "For the conceptual framing and a 'which metric when' guide, see [Retrieval Quality Fundamentals](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/).")
- Keep both existing aliases unchanged:
  - `/documentation/tutorials/retrieval-quality/`
  - `/documentation/beginner-tutorials/retrieval-quality/`
- **Commit fully to the precision → recall rename throughout the page** — a partial rename is worse than either full option, since a reader who just finished the Fundamentals page being told "we measure recall for ANN" will hit residual "precision" prose a few paragraphs later and get whiplash. Specifically:
  - Rename `avg_precision_at_k` → `avg_recall_at_k` (function definition, all call sites, `print` output strings)
  - Rename the `precision` variable → `recall` inside the function body
  - Update the code comment `# We can calculate the precision@k` → `# We can calculate the recall@k`
  - Update prose references: "calculate the `precision@5`" → "calculate the `recall@5`", "the precision of the approximate search" → "the recall of the approximate search", "we need higher precision" → "we need higher recall", "we can increase the precision" → "we can increase the recall", "The precision has obviously increased" → "The recall has obviously increased", "HNSW does a pretty good job in terms of precision" → "HNSW does a pretty good job in terms of recall"
  - In `## Standard mode vs exact search`, update "so we can calculate the `precision@k` for different values of `k`" → "so we can calculate the `recall@k` for different values of `k`"
  - In `## Tweaking the HNSW parameters`, the two occurrences of "the higher the precision of the search" should be rewritten to "the higher the recall of the search" (or "the higher the search quality" if we want to avoid committing to the metric). The earlier proposal to leave these as-is — on the grounds that they describe a general property of the index rather than the metric — creates exactly the mixed-terminology problem we are trying to avoid.
- Acknowledge in prose, once, that `recall@k` and `precision@k` coincide in the ANN-vs-exact setting (a one-line parenthetical is enough) so a reader who has seen the old version is not confused by the rename.
- Fix pre-existing bug: the code uses `range(60000)` while the surrounding prose says "first 50000 items for training". Reconcile these — update the prose to 60000 to match the code (safer than changing the code, which affects reproducibility for anyone who ran the old version).

---

### Index table updates

Two index files reference `retrieval-quality`. Both need to be updated — updating only the headless partial leaves the overview page stale.

**File 1:** `qdrant-landing/content/documentation/headless/content/tutorials/search-engineering.md`

Replace the single existing `Retrieval Quality Evaluation` row with three rows:

```markdown
| [Retrieval Quality Fundamentals](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/) | Understand evaluation levels and choose the right metric. | <span class="pill">Python</span> | 15m | <span class="text-yellow">Intermediate</span> |
| [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/) | Generate ground truth data at scale and avoid data leakage. | <span class="pill">Python</span> | 20m | <span class="text-yellow">Intermediate</span> |
| [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) | Measure ANN recall and tune HNSW parameters. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |
```

**File 2:** `qdrant-landing/content/documentation/tutorials-lp-overview.md`

The same `Retrieval Quality Evaluation` row appears in the Search Engineering table on this page (currently line 71). Apply the same three-row replacement here so both indexes stay in sync.

---

### Open questions / deliberate non-goals

- **Fundamentals page placement.** This page is almost entirely conceptual — no hands-on Qdrant code. Keeping it under `tutorials-search-engineering/` matches where readers currently land when searching for this content, but it stretches the definition of "tutorial". Moving it to `/concepts/` is an alternative; we are not doing that in this PR to avoid a redirect sprawl, but it's worth revisiting if the folder grows more concept pages.
- **Weight values.** `weight: 4` on Fundamentals collides with `pdf-retrieval-at-scale.md` (also weight 4). The folder already has several weight collisions, so in practice this does not affect ordering, but if any template in the future orders strictly by weight this will need to be resolved.
- **Sample-size guidance.** We intentionally avoid naming a specific minimum in the golden-set page (previous draft said "200–300 labeled pairs"). Required sample size depends on the detectable effect size and query-level variance, and hard-coding a number invites a reasonable customer objection. The current wording gives a qualitative direction instead.
