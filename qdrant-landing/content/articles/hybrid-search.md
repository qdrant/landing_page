---
title: "Hybrid Search in Qdrant"
short_description: "Run dense and sparse retrieval together: the queries each one gets wrong, what the second index costs, and how to tell if it helped."
description: "Decide whether to add hybrid search in Qdrant: the queries dense and sparse retrieval each get wrong, and how to measure the gain."
preview_dir: /articles_data/hybrid-search/preview
social_preview_image: /articles_data/hybrid-search/preview/social_preview.jpg
weight: -215
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-24T09:00:00+03:00
draft: false
keywords:
  - hybrid search
  - sparse vectors
  - BM25
  - reciprocal rank fusion
  - search relevance
category: search-quality
---

A search result can look plausible and still miss the product. Dense retrieval can return something from the right category but miss the exact model a customer pasted in. Sparse retrieval can miss a product when the customer describes it with words the catalog doesn't use. Either way, your logs record a successful query.

Hybrid search runs a second retriever beside the dense one and merges their result lists. The second retriever finds documents based on the query's literal terms, which dense retrieval can miss.

It also costs a vector per point, an index, and an extra search on every query. Measure whether the gain is worth the cost instead of guessing.

## Dense and Sparse Retrieval Miss Different Things

Dense retrieval embeds the query and each document, then ranks the documents by vector similarity. The model can place paraphrases near each other, but exact strings may lose influence when several products have similar meanings.

Sparse retrieval represents text as weighted terms and scores the overlap between the query and document. BM25 sets those weights from term frequency, inverse document frequency, and document length. It requires no model inference.

In each of the following examples, one retriever ranks a relevant product first, while the other ranks an irrelevant product first.

| Query | Dense Retrieval | Sparse Retrieval |
|---|---|---|
| french molding | french curves 6'' h x 6'' w x 1'' d rosette applique (Relevant) | french bread mold toast tray non-stick tray baking tray (Irrelevant) |
| wayfair comforters | wayfair basics comforter set (Relevant) | wayfair basics peva shower curtain liner (Irrelevant) |
| bathroom vanity knobs | carran 30'' single bathroom vanity set (Irrelevant) | damask mushroom knob (Relevant) |
| farmhouse cabinet | rustic storage cabinet (Irrelevant) | farmhouse 2 door accent cabinet (Relevant) |

For "french molding," sparse retrieval follows the terms "french" and "mold" to the wrong product. For "bathroom vanity knobs," dense retrieval finds the right category, while sparse retrieval follows "knobs" to the relevant product.

Learned sparse models change what the sparse side matches. [miniCOIL](/documentation/fastembed/fastembed-minicoil/) keeps BM25's term matching but reweights each term according to its context, so "bat" in a sports listing and "bat" in a wildlife guide no longer share one weight. [SPLADE](/documentation/fastembed/fastembed-splade/) adds related terms that the text never used, recovering synonyms and moving sparse retrieval closer to what the dense retriever already covers. Start with BM25, which needs no model at query time, then measure a learned model against it before adopting one.

## Fusion Merges Two Rankings Into One

In Qdrant, a prefetch is a search that passes its candidates to the main query. Hybrid search uses one prefetch for dense retrieval and another for sparse retrieval, then fusion combines their candidate lists into one ordering.

Reciprocal Rank Fusion, or RRF, reads only where each document landed in each list. That lets it combine a cosine similarity of 0.7 with a BM25 score of 12.4 without comparing the values directly. [Cormack, Clarke, and Buettcher](https://dl.acm.org/doi/10.1145/1571941.1572114) introduced the method in 2009, and it remains a standard way to combine ranked lists.

Distribution-Based Score Fusion, or DBSF, rescales each list using its average score and score spread, then adds the rescaled scores. This preserves the size of score gaps, so a strong lead from one retriever can affect the final ranking.

A fixed weighted sum of the two raw scores looks simpler than either method. Plotting BM25 score against dense similarity for relevant and non-relevant products shows the problem: the two groups occupy the same region, so no single pair of weights separates them. RRF avoids the comparison by reading ranks, while DBSF rescales each list per query instead of applying one global weight.

![A scatter plot with dense similarity from 0.2 to 1.0 on the horizontal axis and BM25 score from 5 to 85 on the vertical axis. Red points marked relevant and blue points marked non-relevant are interleaved throughout the same central cluster, with no line or curve separating the two groups.](/articles_data/hybrid-search/linear-combination.png)

_Relevant and non-relevant products occupy the same region of the score space, so a fixed pair of weights cannot separate them._

Raw signals are useful in a Formula Query. It ranks candidates with an expression you write over the prefetch scores and the payload, letting a value such as recency or stock status enter the score after retrieval rather than compete with it. [Custom scoring](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) covers the expression syntax.

Fusion only reorders. It works on the union of what the two prefetches returned, so a document neither one found cannot appear anywhere in the results.

![A collection drawn as a field of documents with two overlapping oval regions over it. Documents inside the left oval are red and labeled dense prefetch, documents inside the right oval are blue and labeled sparse prefetch, documents in the overlap are dark, and roughly a third of the documents sit outside both ovals in pale grey. A note reading candidate union passed to fusion points into the retrieved region.](/articles_data/hybrid-search/candidate-boundary.png)

_The pale documents were never retrieved. If the right answer is one of them, no fusion method reaches it._

## What a Second Retriever Costs

A second retriever adds a sparse vector per point, a second index, and another search on every query. On one container serving one request at a time, that extra search raised median query latency by 0.60 to 1.47 ms. Measure the cost under your own concurrency and shard layout.

Adding a sparse vector to an existing dense-only collection requires a new collection and a full reindex because the vector configuration is fixed at collection creation.

The new collection declares both vector types, and the sparse one needs the IDF modifier. IDF gives rare terms more weight than common ones, and leaving it off lets a common word count as much as a part number.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.create_collection(
    collection_name="products",
    vectors_config={
        # size matches your dense model's output dimensions.
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE)
    },
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)
    },
)
```

With Cloud Inference, Qdrant builds the BM25 vector from the text you send, so the second retriever costs an index rather than a second model. At upsert, send each field as a `models.Document` and set `options={"avg_len": ...}` to the average token count of that text after stopword removal and stemming. WANDS product text averaged 39.61 tokens. Qdrant defaults to 256, which distorts scores on shorter fields. The [hybrid search documentation](/documentation/search/text-search/hybrid-search/) covers the collection and query setup in every supported language.

A hybrid request runs both retrievers as prefetches and hands their candidates to fusion.

```python
from your_embedding_model import embed

query_text = "rosette applique"

results = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(
            # The same query, embedded for the dense retriever.
            query=embed(query_text),
            using="dense",
            limit=100,
        ),
        models.Prefetch(
            # The same query again, sent as text for BM25 to score.
            query=models.Document(text=query_text, model="qdrant/bm25"),
            using="bm25",
            limit=100,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    # Results returned to the caller.
    limit=10,
)
```

`using` selects the named vector for each prefetch, and `FusionQuery` merges the two lists. Both prefetch limits start at 100. [Candidate depth](/articles/candidate-depth/) covers how far to raise them.

## Measure Whether It Helps

Across five public datasets, default RRF beat the stronger individual retriever on four.

![A grouped bar chart of nDCG@10 across five datasets, with three bars per dataset for dense only, sparse only, and both fused. SciFact reads 0.6239, 0.6886, and 0.7175. ArguAna reads 0.4905, 0.4224, and 0.5216. WANDS reads 0.6921, 0.7098, and 0.7254. CodeSearchNet reads 0.6299, 0.5126, and 0.6555. DBPedia-entity reads 0.4677, 0.3857, and 0.4638, the one dataset where the fused bar sits below the dense bar.](/articles_data/hybrid-search/fusion-vs-single.png)

_Fusion clears the better single retriever on four datasets. On DBPedia-entity it trails dense retrieval, which is the outcome that makes this worth measuring before you commit to it._

Run the same labeled queries with dense retrieval, sparse retrieval, and fusion. Keep the models and candidate limits unchanged, then score each run with nDCG@10, which gives more credit to relevant documents near the top.

First, check whether fusion beats both retrievers. Review the queries where their rankings differ, then see whether the wins and losses cluster around important query types in your workload.

If one retriever finds relevant results that fusion ranks too low, tune the fusion method or weights. [How to Tune Hybrid Search](/articles/how-to-tune-hybrid-search/) covers those settings. If both retrievers miss a result, fusion has no candidate to promote.

Recheck the winning setup on held-out queries. [Building a labeled set](/articles/before-tuning-a-qdrant-collection/) covers query selection and held-out evaluation.

If all your queries are fluent natural language with no identifiers, codes, or proper nouns, you can rule out hybrid search before testing it. The dense retriever already covers what the sparse one catches, so the second index adds cost without fixing a corresponding failure.

Keep the sparse retriever when the relevance gain justifies its measured indexing and latency cost.

## What to Test Next

- **Add more stages.** [Multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) retrieve with a cheap representation and rescore with an expensive one. Cross-encoder reranking puts the query and chunk into a model together. [When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/) measures that approach against a tuned first stage.
- **Tune what you have.** The fusion method, the RRF constant, and the per-retriever weights can all move relevance without adding a stage. [How to Tune Hybrid Search](/articles/how-to-tune-hybrid-search/) measures each one across the same five datasets.

Clone the collection, index the sparse vectors there, and score the three variants on the same queries. Ship the second retriever only if it fixes searches your users are losing today.
