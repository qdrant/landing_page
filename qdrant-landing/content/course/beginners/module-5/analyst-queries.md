---
title: "Analyst Queries"
short_description: "Module 5 of the Beginner Course: query one collection across three named vectors."
description: "Query the capstone collection the way an analyst would: across three named vectors, with filters, plus the centroid query from the clustering step."
weight: 6
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Analyst Queries

One collection, three named vectors. Two ways to ask here, plus the centroid query from [Clustering Risk Signals](/course/beginners/module-5/clustering-risk-signals/).

### Searching Images With Text

The satellite signals are searchable by what they show, with no caption needed at query time. The query text goes through CLIP's text encoder so it lands in the image vector space:

```python
def search_facility_images(query_text: str, supplier_id: str, limit: int = 10):
    return client.query_points(
        collection_name="supplier_signals",
        query=models.Document(text=query_text, model=IMAGE_TEXT_MODEL),
        using="image",
        query_filter=models.Filter(
            must=[models.FieldCondition(
                key="supplier_id", match=models.MatchValue(value=supplier_id),
            )]
        ),
        limit=limit,
        with_payload=True,
    )

smoke = search_facility_images("smoke above factory roof", supplier_id="SUP-7291")
```

Each named vector is its own space, so the query has to be embedded by the model that produced the vectors it is searching. Swap `using="text_dense"` and `DENSE_MODEL` and the same call searches article text instead.

### The Analyst Investigation Query

For a focused investigation, run hybrid retrieval over dense and sparse text, scoped to one supplier and to elevated-risk signals from the last week. Put the filter inside each `Prefetch`, as in Modules 3 and 4, so each retriever returns 50 candidates that satisfy it.

```python
def query_supplier_risk(supplier_id: str, query_text: str):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    risk_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="supplier_id",
                match=models.MatchValue(value=supplier_id),
            ),
            models.FieldCondition(
                key="risk_score",
                range=models.Range(gte=0.5),
            ),
            models.FieldCondition(
                key="published_at",
                range=models.DatetimeRange(gte=cutoff),
            ),
        ]
    )

    return client.query_points(
        collection_name="supplier_signals",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="text_dense", filter=risk_filter, limit=50,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="text_sparse", filter=risk_filter, limit=50,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=10,
    )
```

The image query in the previous section passes the same conditions as a top-level `query_filter` because it has no prefetch.

### Going Further: Cross-Language Comparison

Supply chain news often appears in Japanese, Mandarin, Korean, or Vietnamese before it reaches an English wire, and `all-MiniLM-L6-v2` cannot read any of it. Reaching those sources is one substitution: point `DENSE_MODEL` at a multilingual model such as `intfloat/multilingual-e5-large`, which covers 100 languages and projects all of them into a single vector space. It is a bigger model with different requirements, so budget for three changes rather than one: vectors are 1024-dimensional instead of 384, the collection has to be recreated at that size, and e5 expects a `query:` prefix on search text and `passage:` on stored content, which is easy to skip and lowers retrieval quality without raising an error.

Once every language shares one space, the same English query reaches sources in all of them. Run it twice, once filtered to `language: ["en"]` and once to `["ja", "zh"]`, and compare. If English coverage looks routine while local-language sources return shutdown signals, the local narrative is ahead of the English one, and that gap is where early warnings live. The mechanism is nothing new: the same query with a different `language` filter.

### Try It

Open the notebook and work through these against the collection you just built:

1. Ingest a satellite capture with its `caption` set to an empty string, then run `cluster_and_tag` for that supplier. Confirm the point never appears in a cluster, and find the line in `dense_matrix` that drops it.
2. Add a `source_type` argument to `query_supplier_risk` so an analyst can restrict an investigation to one kind of evidence, satellite captures or transcripts. Put the condition in `risk_filter`, and check the field is indexed in the collection setup before you run it.
3. Run `search_facility_images("smoke above factory roof", ...)` twice, once with `IMAGE_TEXT_MODEL` and once with `DENSE_MODEL`. Predict what the second call does before you run it, then explain the result.
