---
title: "Module 6: Beyond Similarity (Bonus)"
short_description: "Bonus module of the Beginners course: the Qdrant features that fix ranking when vector similarity alone puts the wrong results first."
description: "Map search problems to Qdrant features beyond similarity: score boosting, MMR diversity, two-stage reranking, grouping, relevance feedback, and discovery."
isLesson: true
weight: 70
---

{{< date >}} Module 6 {{< /date >}}

<!--
NOTE: this bonus module intentionally ships with no video and no knowledge
check. It is optional further reading, not a taught module. Module 4 currently
promises "the course's closing video" points readers to these topics, so
module-4/_index.md line 274 needs to name Module 6 instead.
-->

<!--
TODO (diagram): one diagram for The Map section, showing where each feature
runs inside a query: prefetch stage, rescore stage, selection over retrieved
candidates, and next-query traversal. Build from the Docs/Diagrams library
using Text-Boxes and Connectors, N98 fills with N30 text, P50 for the brand
accent and Teal 50 for the second stage, Mona Sans labels and Geist Mono for
parameter names.
-->

# Beyond Similarity

Every feature on this page fixes one class of problem: ranking by vector similarity alone either puts the wrong document first, or puts eight versions of the right document first. Modules 1 through 3 gave you the parts, and Module 4 turned them into a design. This is the map of what sits past that, and none of it is required to finish the course.

## How to Use This Module

Read by symptom from the table, then follow the link for code in each client language. The entries after it add only the parameter to reach for and the trap that costs people an afternoon, since the docs already hold the mechanics. MMR is the exception and gets a worked example, because its defaults make it look broken.

## The Map

Each row is a failure you can hit with what the course already taught, the feature that addresses it, and where in the query that feature runs.

| Symptom | Feature | Runs |
|---------|---------|------|
| Right documents, wrong order | [Score boosting](/documentation/search/search-relevance/#score-boosting) with a Formula Query, v1.14 | Rescoring step over a prefetch |
| Ranking should account for recency or distance | [Decay functions](/documentation/search/search-relevance/#decay-functions) inside the formula | Same rescoring step |
| Ranking is good but the accurate model is too slow to run over everything | [Multi-stage query](/documentation/search/hybrid-queries/#multi-stage-queries) | Cheap prefetch, accurate rescore |
| Top results are near-identical | [MMR](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr), v1.15 | Selection over retrieved candidates |
| One document fills the page with its own chunks | [Grouping](/documentation/search/search/#grouping-api) | Server-side grouping of hits |
| A better model, or user clicks, disagree with the retriever | [Relevance feedback](/documentation/search/search-relevance/#relevance-feedback), v1.17 | Vector space traversal on the next query |
| There is no query, only examples of good and bad | [Recommendation and Discovery](/documentation/search/explore/#recommendation-api) | Replaces the query vector |
| You cannot tell whether any of the above helped | [Golden set evaluation](/documentation/improve-search/retrieval-relevance/) | Offline, outside Qdrant |

Start with the last row, because every other row changes ranking and can make it worse. A golden set, meaning queries paired with the documents that should come back for them, turns that into a number: Precision@K counts how many of the top K results are relevant, Recall@K how many relevant documents reached the top K, and NDCG (Normalized Discounted Cumulative Gain) also rewards ordering.

## Ranking: Score Boosting and Two-Stage Retrieval

Module 4 introduced formula queries and the optional cross-encoder rerank stage, so this entry covers what it left out. A formula runs only as a rescoring step, so it needs a prefetch under it. Results sort descending, so Euclidean scores have to be negated, and every `$score[i]` past the first needs an entry in `defaults` or a missing value errors. Module 4's multi-shard constraint still holds: one query cannot be both a fusion and a formula.

Decay functions carry their own calibration trap. Linear, exponential, and Gaussian decay clamp an age or a distance into the range 0 to 1, while fused RRF scores are sums of `1/(k+rank)` terms and are much smaller than that. An unweighted decay term will dominate the fused score, so wrap it in a multiplication with a coefficient sized to your own scores.

For two-stage retrieval, the cheap first stage can be quantized vectors, a truncated Matryoshka vector, or a plain dense vector, with full precision, the full-length vector, or a late-interaction model such as ColBERT doing the rescore. Each prefetch needs a `limit` of at least the outer query's `limit` plus `offset`, or results come back empty. A vector used only for rescoring can set `m=0` in its HNSW config, skipping a graph nothing will traverse.

- [Multi-Stage Queries](/documentation/search/hybrid-queries/#multi-stage-queries)
- [Reranking for Better Search](/documentation/search-precision/reranking-semantic-search/), including which reranker types fit which budget
- [Late Interaction Retrieval with Dense Token Embeddings](/articles/late-interaction-models/)

## Diversity: MMR, Measured

MMR picks results one at a time, each time taking the candidate with the best combination of similarity to the query and distance from what it already picked. In Qdrant it is a parameter on a nearest neighbors query, and both of its parameters have defaults that surprise people: `diversity` defaults to 0.5, and `candidates_limit` defaults to the query's `limit`.

That second default is the one worth running. This fixture holds five near-duplicate headlines about one event and three unrelated shipping stories.

```bash
pip install "qdrant-client[fastembed]"
```

```python
from qdrant_client import QdrantClient, models

MODEL = "sentence-transformers/all-MiniLM-L6-v2"
client = QdrantClient(":memory:")

headlines = [
    "Port congestion worsens at Singapore as container backlog grows",
    "Container backlog grows at Singapore port amid worsening congestion",
    "Singapore port congestion deepens as containers pile up on the docks",
    "Vessel queues lengthen outside Singapore as port congestion continues",
    "Congestion at Singapore port leaves containers waiting for berths",
    "Dockworker strike in Rotterdam halts container handling",
    "Bunker fuel prices climb across Asian shipping hubs",
    "Carriers reroute Asia-Europe services away from the Red Sea",
]

client.create_collection(
    "headlines",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)
client.upsert(
    "headlines",
    points=[
        models.PointStruct(
            id=i,
            vector=models.Document(text=text, model=MODEL),
            payload={"headline": text},
        )
        for i, text in enumerate(headlines)
    ],
)

query = models.Document(text="port congestion in Southeast Asia", model=MODEL)

# candidates_limit=8 is the whole fixture here; in production set it well above limit
runs = [
    ("plain nearest neighbors", None),
    ("mmr, diversity=0.5, default candidates_limit", models.Mmr(diversity=0.5)),
    ("mmr, diversity=0.5, candidates_limit=8", models.Mmr(diversity=0.5, candidates_limit=8)),
    ("mmr, diversity=0.9, candidates_limit=8", models.Mmr(diversity=0.9, candidates_limit=8)),
]

for label, mmr in runs:
    q = query if mmr is None else models.NearestQuery(nearest=query, mmr=mmr)
    results = client.query_points("headlines", query=q, limit=4).points
    print(label)
    for point in results:
        print(f"  {point.score:.3f}  {point.payload['headline']}")
```

Real output:

```text
plain nearest neighbors
  0.710  Vessel queues lengthen outside Singapore as port congestion continues
  0.694  Port congestion worsens at Singapore as container backlog grows
  0.633  Singapore port congestion deepens as containers pile up on the docks
  0.623  Congestion at Singapore port leaves containers waiting for berths
mmr, diversity=0.5, default candidates_limit
  0.710  Vessel queues lengthen outside Singapore as port congestion continues
  0.694  Port congestion worsens at Singapore as container backlog grows
  0.623  Congestion at Singapore port leaves containers waiting for berths
  0.633  Singapore port congestion deepens as containers pile up on the docks
mmr, diversity=0.5, candidates_limit=8
  0.710  Vessel queues lengthen outside Singapore as port congestion continues
  0.514  Carriers reroute Asia-Europe services away from the Red Sea
  0.382  Bunker fuel prices climb across Asian shipping hubs
  0.694  Port congestion worsens at Singapore as container backlog grows
mmr, diversity=0.9, candidates_limit=8
  0.710  Vessel queues lengthen outside Singapore as port congestion continues
  0.104  Dockworker strike in Rotterdam halts container handling
  0.382  Bunker fuel prices climb across Asian shipping hubs
  0.514  Carriers reroute Asia-Europe services away from the Red Sea
```

**What to look for:**

- The default run returns the same four near-duplicates as plain search, reordered. With `candidates_limit` equal to `limit`, MMR chooses among exactly the four results it was asked for, so reordering is all it can do. Most reports of MMR having no effect are this.
- Raising `candidates_limit` to 8 changes the result set: two duplicates give way to the rerouting and fuel stories at 0.514 and 0.382, against the top result's 0.710. Whether that trade is worth it is a question for your golden set.
- At `diversity=0.9` a Rotterdam strike enters at 0.104, for a query about Southeast Asia. Diversity has no notion of topical relevance, so past some point it buys spread by giving up the query.
- No MMR run descends by score, and row four of the second run outscores row three. Points come back in selection order, and each score is similarity to the query rather than MMR's objective, so do not sort or threshold them as ranked scores.

Local mode searches all eight points here, so a server returns this same order. On a large collection the candidates come from approximate search, so `candidates_limit` sets both how much diversity is available and how much extra retrieval you pay for.

## Grouping

Chunking creates the neighboring problem: one long document becomes many points, and a strong match on that document can fill the whole first page with its own chunks. `query_points_groups` groups hits by a payload field and returns a set number of groups, so one document takes one slot. If the parent records live in their own collection, `lookup_from` fetches them alongside the groups.

The trap is the index. Strict mode is on by default in Qdrant Cloud, so grouping on a field with no payload index returns a 400, and `document_id` is the index people forget. Create it before ingestion, so the filterable HNSW graph is built with it rather than needing a rebuild.

- [Grouping API](/documentation/search/search/#grouping-api)
- [Multi-Representation Search](/documentation/tutorials-search-engineering/multi-representation-search/)

## Feedback: Relevance Feedback, Recommendation, and Discovery

Sometimes a stronger model or a click log knows more about relevance than the embedding model does. A `RelevanceFeedbackQuery` takes the original query as `target`, plus `feedback`: three to five results, each carrying a score from a relevance oracle, meaning any model that judges relevance. Qdrant turns the disagreement between oracle and retriever into a change in how it traverses the vector space on the next query, across the whole collection rather than only the shortlist.

Two traps. The `naive` strategy's `a`, `b`, and `c` weights are specific to your combination of retriever, oracle, and collection, and the `qdrant-relevance-feedback` package fits them. A point passed by ID as `target` or `example` is excluded from the results, so pass its raw vector to keep it eligible.

When there is no query text at all, the Recommendation API searches from positive and negative examples using `average_vector`, `best_score`, or `sum_scores`, and the Discovery API adds context pairs that steer results toward one region of the vector space and away from another.

- [Relevance Feedback](/documentation/search/search-relevance/#relevance-feedback)
- [Relevance Feedback Retrieval in Qdrant](/documentation/tutorials-search-engineering/using-relevance-feedback/), the tutorial that fits the weights and evaluates the result
- [Recommendation API](/documentation/search/explore/#recommendation-api) and [Discovery API](/documentation/search/explore/#discovery-api)

## Smaller Things Worth Knowing

These solve narrower problems, and each one is a page rather than a lesson.

| Feature | What It Does |
|---------|--------------|
| [Facet counts](/documentation/manage-data/payload/#facet-counts) | Counts how many points hold each unique value of a payload field, for sidebar counts and for checking how selective a filter would be. |
| [Distance matrix](/documentation/search/explore/#distance-matrix) | Samples points and returns their pairwise distances as a sparse matrix, the input for clustering and visualization. |
| [Random sampling](/documentation/search/search/#random-sampling) | Returns a random subset of a collection, for spot-checking ingested data and drawing evaluation sets. |
| [Quantization](/documentation/manage-data/quantization/) | Shrinks stored vectors to cut memory and cost, with a rescoring step to recover the precision compression loses. |
| [miniCOIL and SPLADE++](/documentation/search/text-search/full-text-search/#minicoil) | Sparse retrievers that learn contextual term weights instead of using raw frequency, dropped into the same hybrid slot as BM25 and needing the same `IDF` modifier. |
| [Matryoshka models](/documentation/inference/matryoshka-models/) | Embeddings that stay usable when truncated, so a cheap first stage and an accurate second stage can share one model. |
| [Low-latency search](/documentation/search/low-latency-search/) | Replica scaling, delayed fan-outs, and `indexed_only` for holding tail latency flat while data is still being indexed. |

## References & Further Reading

**Papers and deep dives:**

- [The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf)
  - The 1998 paper the `diversity` parameter implements.
- [Relevance Feedback in Information Retrieval](/articles/search-feedback-loop/)
  - Feedback loops as a family of methods, before narrowing to Qdrant's implementation.
- [Relevance Feedback in Qdrant](/articles/relevance-feedback/)
  - What the naive strategy does to vector space traversal, and how its weights behave.
- [Hybrid Search with Qdrant's Query API](/articles/hybrid-search/)
  - Fusion and reranking as competing designs, with the reasoning behind the Query API.

## Where to Go After the Course

- [Qdrant Essentials](/course/essentials/) goes deeper on indexing, quantization, large-scale ingestion, and multitenancy.
- [Multi-Vector Search](/course/multi-vector-search/) covers ColBERT and ColPali properly, including MaxSim scoring, pooling, and MUVERA indexing.
- [Qdrant Cloud](https://cloud.qdrant.io/) gives you a free cluster, where payload indexes, strict mode, and approximate search behave the way this module describes and local mode cannot.
