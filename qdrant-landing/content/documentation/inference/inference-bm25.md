---
title: BM25
weight: 20
---

# Server-side Inference: BM25

[BM25](/documentation/search/text-search/#bm25) (Best Matching 25) is a ranking function for text search. BM25 uses sparse vectors that represent documents, where each dimension corresponds to a word. Qdrant can generate these sparse embeddings from input text directly on the server.

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

Read more about full-text search with BM25 in the [text search guide](/documentation/search/text-search/#full-text-search).