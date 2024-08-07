---
title: "Every* embedding model might be a late interaction model if you give it a chance"
short_description: "Standard dense embedding models are surprisingly good in late interaction scenarios."
description: "Standard dense embedding models are surprisingly good in late interaction scenarios."
preview_dir: /articles_data/late-interaction-models/preview
social_preview_image: /articles_data/late-interaction-models/social-preview.png
weight: -160
author: Kacper Łukawski
author_link: https://kacperlukawski.com
date: 2024-08-05T00:00:00.000Z
---

\* At least every Open Source model, because you need to access its internals.

Qdrant 1.10 introduced support for multi-vector representations, and late interaction is the most prominent example of 
such a model. In a nutshell, both documents and queries are represented by multiple vectors, and finding the most 
relevant documents requires calculating a score based on the similarity between the pairs of query and document 
embeddings.

![Late interaction](/articles_data/late-interaction-models/late-interaction.png)

There are many specialized late interaction models, such as ColBERT, but **it seems that regular dense embedding models 
can also be used in this way**.

## How does the embedding model work?

The inner workings of the embedding models might be surprising to some. The model does not operate directly on the input
text, but requires a tokenization step to convert the text into a sequence of token identifiers. Each of these token
identifiers is then passed through an embedding layer, which converts the token identifier into a dense vector. 
Essentially, the embedding layer is a lookup table that maps token identifiers to dense vectors. This is the input to
the transformer model.

![Input token embeddings](/articles_data/late-interaction-models/input-embeddings.png)

The input token embeddings are context-free and learned during the training process of the model. Thus, each token would
always get identical embedding, no matter where it appears in the text. At this stage, each token embedding does not 
know anything about the context in which it appears. That's the job of the transformer model to contextualize the 
embeddings.

A lot has been said about the attention role in the transformer models, but in a nutshell, this mechanism is responsible 
for cross-tokens relations. Each of the transformer modules takes a sequence of token embeddings as input and produces a 
sequence of output token embeddings. Both sequences have the same length, as each token embedding is enriched with 
the information from the other token embeddings in the current step.

![Output token embeddings](/articles_data/late-interaction-models/output-embeddings.png)

The last step performed by the embedding model is a pooling over the output token embeddings to obtain a single vector 
representation of the input text. 

![Pooling](/articles_data/late-interaction-models/pooling.png)

There are a few pooling strategies, but no matter which one a selected model uses, the output is a single vector 
representation, which obviously loses some information about the input. It’s like giving someone a detailed step-by-step 
instruction on how to get to the nearest grocery store versus pointing out the direction with a finger. While this vague 
direction might be enough in some cases, the detailed instruction is more likely to lead to the desired outcome.

### Output token embeddings are multi-vector representations

We usually forget about the output token embeddings, but the point is - they are also multi-vector representations of 
the input text. Why shouldn't we try to use them in a multi-vector retrieval model, similar to the late interaction
models?

#### Experiments

We have conducted a few experiments to check if the output token embeddings can be used instead of late interaction
models. The results are quite promising.

<table>
    <thead>
        <tr>
            <th>Dataset</th>
            <th>Model</th>
            <th>Experiment</th>
            <th>NDCG@10</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th rowspan="6">SciFact</th>
            <td><code>prithvida/Splade_PP_en_v1</code></td>
            <td>sparse vectors</td>
            <td>0.69359</td>
        </tr>
        <tr>
            <td><code>colbert-ir/colbertv2.0</code></td>
            <td>late interaction model</td>
            <td>0.67462</td>
        </tr>
        <tr>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>single dense vector representation</td>
            <td>0.64594</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.68941</td>
        </tr>
        <tr>
            <td rowspan="2"><code>BAAI/bge-small-en</code></td>
            <td>single dense vector representation</td>
            <td>0.6626</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td><u>0.72436</u></td>
        </tr>
        <tr>
            <td colspan="4"></td>
        </tr>
        <tr>
            <th rowspan="6">NFCorpus</th>
            <td><code>prithvida/Splade_PP_en_v1</code></td>
            <td>sparse vectors</td>
            <td>0.34377</td>
        </tr>
        <tr>
            <td><code>colbert-ir/colbertv2.0</code></td>
            <td>late interaction model</td>
            <td>0.34461</td>
        </tr>
        <tr>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>single dense vector representation</td>
            <td>0.3078</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.35256</td>
        </tr>
        <tr>
            <td rowspan="2"><code>BAAI/bge-small-en</code></td>
            <td>single dense vector representation</td>
            <td>0.31073</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td><u>0.37405</u></td>
        </tr>
    </tbody>
</table>

TODO: clarify the discrepancy between the results achieved by Jina AI

The [source code of the experiments is 
open-source](https://github.com/kacperlukawski/beir-qdrant/blob/main/examples/retrieval/search/evaluate_all_exact.py) 
and uses [`beir-qdrant`](https://github.com/kacperlukawski/beir-qdrant), which is an integration of Qdrant with the 
[BeIR library](https://github.com/beir-cellar/beir). It is not an official package maintained by Qdrant team, but 
it might be useful for those who want to experiment with various Qdrant configurations and see how they impact the 
retrieval quality. All the experiments were done using Qdrant in the exact search mode, so the results are not affected 
by the approximate search.

Even the simple `all-MiniLM-L6-v2` model can be used in a late interaction model fashion, with a positive impact on the
retrieval quality. However, the best results were achieved by the `BAAI/bge-small-en` model, which outperformed both
sparse and late interaction models. 

### Pros and cons

The retrieval quality speaks for itself, but there are some other aspects to consider.

Traditional dense embedding models, as long as we can call any embedding model traditional, are quite often less complex
than the late interaction models. They have fewer parameters, and for that reason should also be faster during the 
inference and cheaper to maintain. Here is a comparison of the models used in the experiments:

| Model                        | Number of parameters |
|------------------------------|----------------------|
| `prithivida/Splade_PP_en_v1` | 109,514,298          |
| `colbert-ir/colbertv2.0`     | 109,580,544          |
| `BAAI/bge-small-en`          | 33,360,000           |
| `all-MiniLM-L6-v2`           | 22,713,216           |

One argument against using the output token embeddings is the increased storage requirements compared to ColBERT-like
models. For example, `all-MiniLM-L6-v2` model produces 384-dimensional output token embeddings, which is 3 times more
than the 128-dimensional ColBERT-like models. Obviously, that leads to increased memory usage, but the computational
cost of the retrieval is also affected, as calculating the distance takes more time. It would make a lot of sense to 
mitigate this issue by compressing the vectors.

#### Impact of the quantization

Binary Quantization is rather suitable for high-dimensional vectors, and `all-MiniLM-L6-v2`, with relatively 
low-dimensional outputs, is on the opposite side of the spectrum. However, Scalar Quantization still sounded like a good 
idea. The table below summarizes the impact of the quantization on the retrieval quality.

<table>
    <thead>
        <tr>
            <th>Dataset</th>
            <th>Model</th>
            <th>Experiment</th>
            <th>NDCG@10</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th rowspan="2">SciFact</th>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>output token embeddings</td>
            <td>0.68941</td>
        </tr>
        <tr>
            <td>output token embeddings with Scalar Quantization</td>
            <td>0.68941</td>
        </tr>
    </tbody>
</table>

It cannot be generalized that the quantization would always keep the retrieval quality at the same level, but in this
case, it seems that the Scalar Quantization does not affect the retrieval quality at all. We didn't use rescoring in the
evaluation, so the results are based on the initial retrieval step.

We keep the original quality, using four times less memory. Moreover, a quantized vector needs 384 bytes, while ColBERT 
requires 512. We saved 25% of the memory, and the retrieval quality remained the same.

### Practical considerations

If you happen to use one of the sentence transformer models, the output token embeddings are calculated either way.
Obviously a single vector representation will be more efficient in terms of storage and computation, but it's not
necessary to throw away the output token embeddings. According to the experiments, they should offer a significant
improvement in the retrieval quality. You can store both the single vector and the output token embeddings in Qdrant, 
and use the single vector for the initial retrieval step, and then rerank the results using the output token embeddings. 

![Single model reranking](/articles_data/late-interaction-models/single-model-reranking.png)

Let's see how to do it with the new Query API introduced in Qdrant 1.10.

#### Single model retrieval and reranking

The new Query API introduced in Qdrant 1.10 allows for building even complex retrieval pipelines. We can use the single
vector created after pooling as the first retrieval step, and then rerank the results using the output token embeddings.

Assume the collection is called `my-collection` and it's configured to keep two named vectors: `dense-vector` and
`output-token-embeddings`. Here is how such a collection could be created in Qdrant:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="my-collection",
    vectors_config={
        "dense-vector": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE,
        ),
        "output-token-embeddings": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
        ),
    }
)
```

Both vectors have the same size, as both are produced by the same `all-MiniLM-L6-v2` model.

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
```

Now, instead of calling the search API with just a single dense vector, we can build a reranking pipeline in which we 
will first get 50 results using the dense vector, and then rerank them using the output token embeddings to get just the
top 10 results.

```python
query = "What else can be done with just all-MiniLM-L6-v2 model?"

client.query_points(
    collection_name="my-collection",
    prefetch=[
        # Prefetch the dense embeddings of the top-50 documents
        models.Prefetch(
            query=model.encode(query).tolist(),
            using="dense-vector",
            limit=50,
        )
    ],
    # Rerank the top-50 documents retrieved by the dense embedding model
    # and return just the top-10. Please note we call the same model, but
    # we ask for the token embeddings by setting the output_value parameter.
    query=model.encode(query, output_value="token_embeddings").tolist(),
    using="output-token-embeddings",
    limit=10,
)
```

In a real world scenario, you would probably go even step further and calculate the token embedding first, and then 
perform pooling to get the single vector representation. This way you can do everything in a single pass.

## Future work

The initial experiments utilizing output token embeddings in the retrieval process have shown promising results. 
However, we intend to conduct further benchmarks to validate these findings. Additionally, we aim to delve deeper into 
how quantization affects multi-vector representations and its consequent impact on retrieval quality. Lastly, we will 
examine retrieval speed, as it is a critical factor for numerous applications.
