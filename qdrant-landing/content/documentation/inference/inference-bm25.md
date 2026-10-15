---
title: BM25
weight: 20
---

# Server-side Inference: BM25

<aside role="status">
We recommend running <a href="/documentation/search/text-search/full-text-search/#bm25">BM25 on a full-text index</a> rather than with the BM25 model. A <a href="/documentation/manage-data/indexing/#bm25-scoring">full-text index with scoring enabled</a> works on text already stored in the payload and doesn't require generating embeddings.
</aside>

[BM25](https://en.wikipedia.org/wiki/Okapi_BM25) (Best Matching 25) is a ranking function for text search. While we recommend running [BM25 on a full-text index](/documentation/search/text-search/full-text-search/#bm25), you can also run BM25 on sparse vectors, where each dimension corresponds to a word. Qdrant can generate these sparse vectors from input text directly on the server with the `qdrant/bm25` model.

While upserting points, provide the text and the `qdrant/bm25` embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/ingest/" >}}

Qdrant uses the model to generate the embeddings and stores the point with the resulting vector. Retrieving the point shows the embeddings that were generated:

```json
    ....
      "my-bm25-vector": {
        "indices": [
          112174620,
          177304315,
          662344706,
          771857363,
          1617337648
        ],
        "values": [
          1.6697302,
          1.6697302,
          1.6697302,
          1.6697302,
          1.6697302
        ]
      }
    ....
]
```

Similarly, use the BM25 model at query time by providing the query string and the `qdrant/bm25` embedding model:

{{< code-snippet path="/documentation/headless/snippets/inference/query/" >}}

Read more about the sparse vector BM25 model in [Sparse Vector Search](/documentation/search/text-search/sparse-vector-search/#bm25).