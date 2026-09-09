---
title: "Filtering: Works with Any Retrieval Method"
short_description: "Module 3 of the Beginner Course: payload filters apply to dense, sparse, and hybrid alike."
description: "Payload filters are not a hybrid-only feature. Apply the same conditions to dense, sparse, and hybrid retrieval, evaluated during the search."
weight: 7
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Filtering: Works with Any Retrieval Method

Payload filters are not a hybrid-only feature. The same conditions apply to dense-only, sparse-only, and hybrid retrieval, and Qdrant evaluates them during the search rather than after it, so a filtered search still returns a full result set. What changes is *where* the filter goes.

Take the constraints a real shopper has: in stock, and available in their size.

```python
shopper_filter = models.Filter(
    must=[
        models.FieldCondition(key="in_stock", match=models.MatchValue(value=True)),
        models.FieldCondition(key="sizes",    match=models.MatchValue(value=11)),
    ]
)
```

`sizes` is a list on each point, and `MatchValue` on a list matches when any element matches, so this reads as "size 11 is among the sizes stocked".

### Filtering a Hybrid Query

Put the filter inside every `Prefetch`, so each retriever searches only the valid subset:

```python
def filtered_hybrid_search(query_text, query_filter, limit=4):
    return client.query_points(
        collection_name="products",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="dense",
                # The filter goes here, not at the top level, so this
                # retriever spends its 20 candidates on eligible points
                filter=query_filter,
                limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse",
                # The same filter, repeated for the second retriever
                filter=query_filter,
                limit=20,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    ).points

for r in filtered_hybrid_search("Nike Pegasus 40", shopper_filter):
    print(f"{r.score:.4f}  {r.payload['title']}")
```

Real output:

```text
1.0000  Nike Pegasus 40 running shoes
0.6667  Nike Pegasus 41 running shoes
0.5000  Nike Invincible 3 road running shoes
0.2000  Brooks Ghost 15 neutral running shoes
```

The women's Pegasus 40 was second in the unfiltered run and is gone: out of stock, and it stops at size 8. The Trail 4 is gone too, since it stops at size 10. Neither was retrieved and discarded; they never entered a candidate list.

### Filtering a Dense or Sparse Query

With no prefetch, the filter belongs at the top level as `query_filter`:

```python
results = client.query_points(
    collection_name="products",
    query=models.Document(text="Nike Pegasus 40", model=DENSE_MODEL),
    using="dense",
    query_filter=shopper_filter,
    limit=4,
).points
```

Swap `DENSE_MODEL` for `SPARSE_MODEL` and `using="sparse"` for the sparse equivalent. The placement is identical because there is no prefetch for the filter to belong to.

Whichever retriever you use, the filter admits the same four products, the ones in stock and stocked in size 11: the Pegasus 40 and 41, the Invincible 3, and the Ghost 15. Eligibility does not depend on the retriever. Only the order they come back in does, which is the whole reason the choice of retriever still matters after filtering.

### Try It

Open the notebook and work through these against the catalog from [Setting Up Hybrid Search in Qdrant](/course/beginners/module-3/hybrid-search-in-qdrant/):

1. Query `Nike Pegasus 41` and compare the dense-only, sparse-only, and hybrid rankings. Which retriever separates 41 from 40 more decisively, and by how much?
2. Add a `models.FieldCondition` on `price` with `models.Range(lte=140)` to `shopper_filter` and rerun. Two products should drop out. Predict which before you run it.
3. Query `comfortable shoes for long runs`, a phrase no title contains in full. Sparse can only score the titles that share `shoes` or `running`, and it orders them by how rare each token is and how long the title is, not by how well the shoe answers the question. Decide which retriever you would put in front of a shopper typing this, then run the hybrid version and see whether fusion changes your answer.

<aside role="status">
The same primitive extends beyond text: images with CLIP or SigLIP, video as sampled frames, audio as spectrogram embeddings, stored as named vectors exactly as this module stored dense and sparse together. Module 5 builds a full multimodal search system as the capstone.
</aside>
