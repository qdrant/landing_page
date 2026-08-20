---
title: "When Is a Reranker Worth It?"
short_description: "Rerank 10 candidates, compare with your tuned first stage on held-out queries, and raise the count only after the win holds."
description: "Test whether a cross-encoder reranker beats your tuned first stage in Qdrant, then choose the model and candidate count from measured results."
preview_dir: /articles_data/when-a-reranker-is-worth-it/preview
social_preview_image: /articles_data/when-a-reranker-is-worth-it/preview/social_preview.jpg
weight: -210
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-12T00:00:00+03:00
draft: false
keywords:
  - cross-encoder reranker
  - reranking
  - MMR
  - search relevance
  - FastEmbed
category: search-quality
---

Before you tune a reranker, use the [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) to verify index state and set a labeled baseline.

Your candidate list can already contain documents your ranking never shows. Score those candidates as if they were perfectly ordered, then compare that with the score your pipeline returns today. The gap between the two is everything a better ranking stage could recover, so measure it before you reach for a model. Use `nDCG@10`, which grades the top 10 results and gives more credit to relevant documents near the top.

A wide gap means a better order is worth chasing. At 200 candidates, that `nDCG@10` gap ran from 0.247 to 0.487 across the five datasets in this article, and [candidate depth](/articles/candidate-depth/) shows how to measure it on your own collection.

A cross-encoder reranker reads the query and candidate together as a single sequence, with a classification head that returns one relevance score for the pair. Joint reading lets it model token interactions that separately encoded query and document vectors miss. Every candidate takes a forward pass at query time, which rules the model out as a first stage and keeps it in the reranking slot.

<aside role="status">
<strong>Note:</strong> These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with <code>all-MiniLM-L6-v2</code> for dense retrieval and Qdrant's core BM25 for sparse retrieval. Four cross-encoders reranked the fused candidates at counts from 10 through 200, scored on 200 queries per dataset. The held-out column comes from a split-half check repeated 200 times: pick the reranker and fusion setting on one half, compare them on the other. <a href="/articles/before-tuning-a-qdrant-collection/#check-the-winner-on-fresh-queries">Held-out validation</a> explains the split, and <a href="/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain">building a labeled set</a> explains the labels.
</aside>

## Test a Reranker in Three Steps

1. Establish the baseline the reranker has to beat: [tuned fusion](/articles/how-to-tune-hybrid-search/) if you run hybrid search, your current ranking if you run dense-only or sparse-only. Confirm the documents your labels mark relevant reach the candidate list. A reranker only reorders what it receives; missing documents are a [candidate depth](/articles/candidate-depth/) or retrieval problem.
2. Rerank 10 candidates with the model you would actually serve, since model choice moved our results more than any other setting. [Reranking with FastEmbed](/documentation/fastembed/fastembed-rerankers/) shows the cross-encoder workflow and the available models. Compare the result with the first-stage baseline on held-out labeled queries.
3. Raise the candidate count only if the reranker wins. Measure throughput on your document lengths before making it part of the serving path.

Step 2 starts from the request your service already sends. Request the payload fields the reranker reads and your labels key on, and keep the fusion settings you serve today.

```python
from qdrant_client import QdrantClient, models

# Both prefetches use the models the collection was indexed with.
from your_embedding_setup import dense_query, sparse_query

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
)
query_text = "the query text"

fused = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(query=dense_query, using="dense", limit=200),
        models.Prefetch(query=sparse_query, using="bm25", limit=200),
    ],
    # Your tuned fusion settings; k=2 with equal weights is the default.
    # RrfQuery needs Qdrant v1.17 or later and a client release that exposes it.
    query=models.RrfQuery(rrf=models.Rrf(k=2, weights=[1.0, 1.0])),
    limit=10,
    with_payload=["text", "doc_id"],
).points
```

Then score the same 10 candidates with a cross-encoder and sort them by that score. Any [FastEmbed cross-encoder](/documentation/fastembed/fastembed-rerankers/) works here, so name the model you plan to serve. `Xenova/ms-marco-MiniLM-L-6-v2` appears in the examples because it is the quickest to download.

```python
from fastembed.rerank.cross_encoder import TextCrossEncoder

encoder = TextCrossEncoder(model_name="Xenova/ms-marco-MiniLM-L-6-v2")
scores = list(encoder.rerank(query_text, [point.payload["text"] for point in fused]))

# Sort by position so tied scores never compare the points themselves.
order = sorted(range(len(fused)), key=lambda i: scores[i], reverse=True)
reranked = [fused[i] for i in order]
```

You now have two orderings of the same 10 candidates. Score both with the `nDCG@10` function from the [pre-tuning article](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain).

```python
# relevance holds this query's labels, keyed by doc_id.
before = ndcg_at_k([point.payload["doc_id"] for point in fused], relevance)
after = ndcg_at_k([point.payload["doc_id"] for point in reranked], relevance)
```

Run that over your labeled queries, average the per-query difference, then check the interval around it before you trust the direction.

## Compare with the Best First Stage

Compare the reranker against the strongest first stage you can build. Qdrant's default reciprocal rank fusion (RRF) is already a solid baseline, and fusion tuned on your own labels is stronger. A reranker measured against the default can look like a win that tuning would have delivered for far less work at query time.

If reranking beats default RRF, [tune fusion](/articles/how-to-tune-hybrid-search/) next. Add reranking only when it improves the strongest first-stage ranking on held-out labeled queries.

Each row in the following table reports the best of four cross-encoders on that dataset. The deltas show the `nDCG@10` change over default RRF and over fusion tuned on the same candidates. `MiniLM-L-6`, `MiniLM-L-12`, and `bge-reranker-base` truncate each pair at 512 tokens. `jina-reranker-v2` reads up to 1024 and was trained on a broader mix, including code.

The held-out column is the one that decides. It holds the share of 200 split-half draws where the gain survived on queries it was not selected on.

<aside role="status">
Every collection was built in one batch on one shard, unquantized, and queried unfiltered, so a graph shaped by continuous upserts and optimizer merges can return different candidates, and these deltas will not transfer to your collection.
</aside>

| Dataset | Best Model | vs. Default RRF | vs. Tuned Fusion | Held Out |
|---|---|---|---|---|
| SciFact | `jina-reranker-v2` @ 200 | +0.057 | +0.033 | no, 37% |
| ArguAna | `jina-reranker-v2` @ 25 | +0.031 | +0.017 | no, 2.5% |
| WANDS | `MiniLM-L-6` @ 200 | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | `jina-reranker-v2` @ 200 | +0.169 | +0.135 | yes, 100% |
| DBPedia-entity | `jina-reranker-v2` @ 200 | +0.137 | +0.115 | yes, 100% |

Ship a reranker gain only when it survives held-out validation. The two confirmed wins here held in 100% of the split-half draws, while the three unconfirmed results held in under half of them. When a positive result fails the split, add queries or keep fusion, and use [the label-count table in the pre-tuning article](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) to size that confirmation.

Keep fusion when the reranker loses to the tuned first stage. WANDS gained +0.039 over default RRF and still lost to fusion tuned on the same candidates.

Both confirmed wins came from the model whose window and training data fit the corpus, scoring the same candidates the other three saw. Even those wins closed part of the gap: 0.135 of a 0.293 gap on CodeSearchNet, and 0.115 of a 0.487 gap on DBPedia-entity.

On DBPedia-entity, the query "John Lennon Yoko Ono album Starting Over" is answered by the page for "(Just Like) Starting Over", and every query term sits in that page's first two sentences. Fusion still left it at rank 49 of 200, because the prefetches scored the query and page separately and fusion sees only their ranks. The cross-encoder read the pair as one sequence and put it first.

## Diagnose a Loss Before You Stop

If the reranker loses at 10 candidates, check model fit before you change anything else. The first check is the context window. Tokenize a sample of your query-document pairs with the model's tokenizer, and compare the 95th percentile length against the model's window: a longer pair gets truncated, and the model scores a document it only partly read. The second is the training data, so read the model card for its languages and domains.

Both checks explain every loss in the table. None of the three older models was trained on code, and `jina-reranker-v2` turned CodeSearchNet from a 0.032 loss into a 0.135 held-out win over the same candidates. On ArguAna, the window was the problem: 168-word queries leave little space for the document inside a 512-token truncation. The 1024-token model moved it from a loss to +0.017, though at 2.5% of held-out splits the label set cannot confirm the gain.

If you find a mismatch, swap in a model whose window and training data fit your documents and rerun the 10-candidate test. If the model fits and still loses, keep the tuned first stage and spend the tuning effort elsewhere: on WANDS, tuned fusion beat all four models at every candidate count.

## Set Candidate Count After a Win

Start with 10 candidates. Raise the count only after the reranker beats the tuned first stage at 10. Stop when the gain on your labels flattens or queries get slower than you can serve.

{{< figure src="/articles_data/when-a-reranker-is-worth-it/reranker-gain-by-candidate-count.png" alt="Five small line charts, one per dataset, showing the best nDCG@10 change over tuned fusion at candidate counts 10, 25, 50, 100, and 200. SciFact, CodeSearchNet, and DBPedia-entity stay above the zero line, WANDS stays below it at every count, and ArguAna peaks at 25 then falls to zero by 200." caption="The best nDCG@10 change over tuned fusion among the four models, by candidate count. A line above zero is a reranker win; WANDS never crosses it." width="100%" >}}

Each dataset stopped climbing at a different point, which is why the count is measured rather than assumed. DBPedia-entity reached 0.111 of its eventual 0.115 by 50 candidates, so going to 200 quadrupled the reranking work for 0.003 more. CodeSearchNet kept climbing through 200. ArguAna peaked at 25 and became a loss by 200, so more candidates can also hurt.

A higher count refines a win, and it rescued no loss here: every configuration behind tuned fusion at 10 was still behind it at 200.

## Size Reranking for Production

Once relevance has settled the candidate count and the model, measure query-candidate pairs per second and tail latency on the hardware you plan to deploy, using representative document lengths and concurrency.

The table shows CPU throughput for the four [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), listed by their full model IDs and measured in one process on an Apple M5 Pro with 15 threads. The last column converts that rate to whole queries at 100 candidates each.

| Model | Size | Docs per Second | Queries per Second |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |
| `jinaai/jina-reranker-v2-base-multilingual` | 1.11 GB | under 2 | under 0.02 |

Document length explains each range. DBPedia-entity has short entity abstracts, while SciFact has full paper abstracts.

Weigh those rates against the held-out gain. At 100 candidates, one CPU process spends between half a second and five seconds per query with the three smaller models, where the second prefetch behind [tuned fusion](/articles/how-to-tune-hybrid-search/) added 0.6 to 1.5 ms in the same setup. The 10-candidate test itself stays fast even on CPU, at 47 to 156 ms per query with the smallest model, so run it before you plan any serving work.

Pick the model on fit rather than size. `bge-reranker-base` and `jina-reranker-v2` are nearly the same size, and only the second ever beat tuned fusion. Training data and context window separated them.

Some models only reach a usable rate on a GPU. The `jina-reranker-v2` ONNX export runs one CPU thread at a time through an attention kernel, which is why its row reads under 2. On a GPU through PyTorch it ran at 32 to 310 documents per second, and the quality numbers here come from that run. It ships under a CC-BY-NC-4.0 license, so check the terms first.

## Use Other Stages for Different Problems

Match the stage to the symptom you see in your results.

| Symptom | Stage |
|---|---|
| Relevant candidates ranked below weaker ones | A cross-encoder or ColBERT as a reranker |
| Results are repetitive or near-duplicates | [Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) |
| One document's chunks fill the first page | [Grouping](/documentation/search/search/#grouping-api) |
| Recency, popularity, or other payload signals should shape the order | [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) |

Maximal marginal relevance trades relevance for diversity, and `nDCG` does not reward the diversity it adds, so measure the direction on your own labels before shipping it.

Grouping fits collections that store each chunk of a document as its own point. `query_points_groups` with `group_by` on the document ID field returns the best chunk per document, so one long document cannot fill the first page. The grouped field needs a [payload index](/documentation/manage-data/indexing/#payload-index); without one on `document_id`, Qdrant Cloud returns a 400.

Formula Query rescores the same candidates with an expression over payload fields, such as recency or popularity, and needs a payload index on each field the formula references.

Test [ColBERT](https://arxiv.org/abs/2004.12832) when a cross-encoder is too slow for your queries. It moves the reranking work from query time to ingest: document vectors are built once, so only the query goes through the model per request, and storage grows to a vector per token. Reranking needs those vectors but never traverses a graph over them, so set [`m=0`](/documentation/search/hybrid-queries/#multi-stage-queries) on the multivector and Qdrant stores it unindexed. ColBERT rescoring also runs inside Qdrant, in the same multi-stage query, while a cross-encoder runs as its own service after Qdrant returns candidates.

## What to Tune Next

After a win, the work moves to throughput, where the candidate count you can serve decides how much of the gain survives. After a loss, the gap is still there and the candidates are what to change, so revisit retrieval and [candidate depth](/articles/candidate-depth/) before adding another ranking stage.

Next, if memory is the constraint, [measure what memory placement and rescoring add to query latency](/articles/when-your-collection-outgrows-ram/).
