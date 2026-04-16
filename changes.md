Problems in Evaluation and Retrieval Quality Measurement:
No bridge from technical metrics to business outcomes. The existing tutorial covers ANN recall and precision but doesn't connect these to retrieval relevance or business impact. Brian's three-level framework (ANN recall, retrieval relevance, business impact) is not documented.

Golden query set generation at scale not covered. Ground truth construction is mentioned but no methodology for generating golden queries at scale or handling the data leakage risks that Goodnotes flagged.

No "which metric when" decision guidance. Customers use inconsistent metrics because there's no guidance on choosing K values, selecting between recall and precision, or when NDCG matters. This varies, but maybe we can provide some general direction with disclaimers

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

---

### Page 1 (new): Retrieval Quality Fundamentals

**File:** `qdrant-landing/content/documentation/tutorials-search-engineering/retrieval-quality-fundamentals.md`

**Proposed content:**

```markdown
---
title: Retrieval Quality Fundamentals
weight: 4
---

# Retrieval Quality Fundamentals

Before we start measuring, it is worth understanding what we are actually measuring. Retrieval quality operates at three distinct levels, and it is easy to optimise for the wrong one.

The first level is **ANN recall**: does the approximate search return the same results as an exact nearest-neighbour search? This is a purely algorithmic question about how faithfully HNSW approximates exhaustive search. It has nothing to do with whether those results are useful to a human.

The second level is **retrieval relevance**: of the results returned, how many are actually relevant to the query intent? This requires a labeled ground-truth dataset or human judgment. A pipeline can achieve near-perfect ANN recall and still surface irrelevant documents if the embeddings are a poor fit for the task.

The third level is **business impact**: does better retrieval lead to better outcomes — lower hallucination rates in downstream LLMs, higher task-completion rates, or improved user satisfaction scores? This is what stakeholders ultimately care about, but it is the hardest to measure directly. A practical way to start connecting these levels is to run a retrieval experiment offline — vary one parameter, measure the change in `recall@10`, and compare it against a held-out set of user tasks scored for answer quality. Even a rough correlation (e.g. "a 5-point drop in recall@10 corresponds to a 3-point drop in answer quality score on our test set") gives engineering and product teams a shared language for prioritisation.

## Quality metrics

There are various ways to quantify the quality of semantic search. Some of them, such as [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k),
are based on the number of relevant documents in the top-k search results. Others, such as [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank),
take into account the position of the first relevant document in the search results. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain)
metrics are, in turn, based on the relevance score of the documents.

If we treat the search pipeline as a whole, we could use them all. However, for the ANN algorithm itself, anything based on the relevance score or ranking is not applicable. Ranking in vector search relies on the distance between the query and the document in the vector space, and distance is not going to change due to approximation, as the function is still the same. Therefore, the right measure for the ANN algorithm is **`recall@k`**: of the true k nearest neighbours returned by exact search, how many does the approximate search recover? It is calculated as `|ANN results ∩ exact results| / k`.

### Choosing the right metric

The right choice of metric depends on what the search pipeline does with its results, and the best option will vary by use case. The table below provides a general starting point.

| Scenario | Recommended metric | Why |
|---|---|---|
| Tuning HNSW parameters | `Recall@k` vs exact search | Measures how many of the true k nearest neighbours the ANN found; ranking is unaffected by approximation |
| RAG pipeline (LLM reads top-k chunks) | `Recall@k` | The LLM can recover if a relevant doc is at position 3 vs 1; missing it entirely hurts more |
| Single-answer retrieval (FAQ, Q&A) | `MRR` or `Precision@1` | The first result is what the user acts on; lower ranks matter little |
| Re-ranking or recommendation feeds | `NDCG@k` | Order within the result list matters; a highly relevant doc at rank 5 is worse than at rank 1 |

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
---

# Building a Golden Query Set

| Time: 20 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Evaluating retrieval relevance requires a labeled dataset of queries paired with their expected relevant documents — commonly called a *golden query set* or *ground truth*. The [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) tutorial uses the test split of a pre-labeled Hugging Face dataset, which is convenient but not representative of real production traffic. Let's look at how to build one at scale from our own data.

## Generating queries

The highest-fidelity source is **real user queries mined from logs**. If the application records clicks or explicit feedback, we can sample query-document pairs and use them directly. This should be the first option we reach for before generating synthetic data. When sampling, it is worth stratifying by query type or topic cluster rather than sampling uniformly at random — a random sample will over-represent frequent queries and leave rare-but-important cases uncovered. As a rough minimum, 200–300 labeled pairs are enough to get a stable metric signal for most use cases; 1000+ is preferable when evaluating subtle ranking differences.

When logs are not available, **LLM-based synthetic generation** is a practical alternative. For each document in the corpus, we can prompt a capable LLM to generate a handful of queries that a user would plausibly ask if they were looking for that document. This scales cheaply to thousands of query-document pairs.

```python
import anthropic

client = anthropic.Anthropic()

def generate_queries_for_doc(doc_text: str, n: int = 3) -> list[str]:
    response = client.messages.create(
        model="claude-sonnet-4-6",
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

## Avoiding data leakage

Data leakage occurs when the documents used to generate queries also appear in the indexed corpus during evaluation, making retrieval artificially easy. There are two common failure modes to watch for.

The first is **query generation leakage**: if we generate synthetic queries from the same documents that are indexed, the LLM's phrasing may closely mirror the document text, inflating relevance scores compared to what real users would produce. We can avoid this by generating queries only from a held-out document split that is **not** indexed during evaluation.

The second is **train/test split leakage**: if the golden set overlaps with the data used to fine-tune the embedding model, we are measuring in-distribution performance. We should always verify that golden-set documents are absent from any embedding model fine-tuning data.

A simple safeguard for structural separation: hash document IDs and assign even hashes to the indexed corpus, odd hashes to the query-generation pool. This guarantees split integrity with no manual bookkeeping. It does not, however, protect against all forms of leakage. **Near-duplicate leakage** can occur when two documents are nearly identical — a query generated from one will trivially retrieve the other, inflating scores. We can guard against this by deduplicating the corpus with a similarity threshold (e.g. cosine similarity > 0.95) before splitting. **Temporal leakage** is a risk in time-sensitive corpora: if evaluation queries were generated from documents that post-date the indexed corpus, we are testing on data the system was never meant to retrieve. In those cases, the split should be by time rather than by hash.
```

---

### Page 3 (existing): Retrieval Quality Evaluation

**File:** `qdrant-landing/content/documentation/tutorials-search-engineering/retrieval-quality.md`

**Changes required:**
- Remove the `### Quality metrics` subsection (moving to page 1)
- Update the `weight` from `4` to `6`
- Add a brief intro sentence linking to page 1 for conceptual background
- Keep both existing aliases unchanged:
  - `/documentation/tutorials/retrieval-quality/`
  - `/documentation/beginner-tutorials/retrieval-quality/`
- Rename `avg_precision_at_k` → `avg_recall_at_k` throughout (function definition, all call sites, `print` output strings)
- Rename the `precision` variable → `recall` inside the function body
- Update the code comment `# We can calculate the precision@k` → `# We can calculate the recall@k`
- Update prose references: "calculate the `precision@5`" → "calculate the `recall@5`", "the precision of the approximate search" → "the recall of the approximate search", "we need higher precision" → "we need higher recall", "we can increase the precision" → "we can increase the recall", "The precision has obviously increased" → "The recall has obviously increased", "HNSW does a pretty good job in terms of precision" → "HNSW does a pretty good job in terms of recall"
- In `## Standard mode vs exact search`, update "so we can calculate the `precision@k` for different values of `k`" → "so we can calculate the `recall@k` for different values of `k`"
- In `## Tweaking the HNSW parameters`, "the higher the precision of the search" (appears twice) is describing HNSW graph precision in the sense of accuracy — leave these as-is since they are describing a general property of the index, not the metric name

---

### Index table update

**File:** `qdrant-landing/content/documentation/headless/content/tutorials/search-engineering.md`

Replace the single existing `Retrieval Quality Evaluation` row with three rows:

```markdown
| [Retrieval Quality Fundamentals](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/) | Understand evaluation levels and choose the right metric. | <span class="pill">Python</span> | 15m | <span class="text-yellow">Intermediate</span> |
| [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/) | Generate ground truth data at scale and avoid data leakage. | <span class="pill">Python</span> | 20m | <span class="text-yellow">Intermediate</span> |
| [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) | Measure ANN recall and tune HNSW parameters. | <span class="pill">Python</span> | 30m | <span class="text-yellow">Intermediate</span> |
```
