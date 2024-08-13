---
title: "Every* embedding model might be a late interaction model if you give it a chance"
short_description: "Standard dense embedding models are surprisingly good in late interaction scenarios."
description: "Standard dense embedding models are surprisingly good in late interaction scenarios."
preview_dir: /articles_data/late-interaction-models/preview
social_preview_image: /articles_data/late-interaction-models/social-preview.png
weight: -160
author: Kacper Łukawski
author_link: https://kacperlukawski.com
date: 2024-08-13T00:00:00.000Z
---

\* At least every open-source model, because you need to access its internals.

Qdrant 1.10 introduced support for multi-vector representations, with late interaction being the most prominent example of such a model. In a nutshell, both documents and queries are represented by multiple vectors, and finding the most relevant documents requires calculating a score based on the similarity between the pairs of query and document embeddings. Our revamped [Hybrid Search](/articles/hybrid-search/) article describes, for instance, the concept of using multi-vector representations to improve retrieval quality, if you are not familiar with that paradigm.

![Late interaction](/articles_data/late-interaction-models/late-interaction.png)

There are many specialized late interaction models, such as ColBERT, but **it seems that regular dense embedding models 
can also be used in this way**.

## How does the embedding model work?

The inner workings of embedding models might be surprising to some. The model does not operate directly on the input text but requires a tokenization step to convert the text into a sequence of token identifiers. Each of these token identifiers is then passed through an embedding layer, which converts the token identifier into a dense vector. Essentially, the embedding layer is a lookup table that maps token identifiers to dense vectors. This is the input to the transformer model.

![Input token embeddings](/articles_data/late-interaction-models/input-embeddings.png)

The input token embeddings are context-free and are learned during the model’s training process. Thus, each token always receives an identical embedding, no matter where it appears in the text. At this stage, each token embedding does not know anything about the context in which it appears. It’s the job of the transformer model to contextualize the embeddings.

A lot has been said about the role of attention in transformer models, but in a nutshell, this mechanism is responsible for cross-token relationships. Each transformer module takes a sequence of token embeddings as input and produces a sequence of output token embeddings. Both sequences have the same length, as each token embedding is enriched with information from the other token embeddings at the current step.

![Output token embeddings](/articles_data/late-interaction-models/output-embeddings.png)

The final step performed by the embedding model is pooling over the output token embeddings to obtain a single vector representation of the input text.

![Pooling](/articles_data/late-interaction-models/pooling.png)

There are a few pooling strategies, but no matter which one a selected model uses, the output is a single vector representation, which inevitably loses some information about the input. It’s like giving someone a detailed step-by-step instruction on how to get to the nearest grocery store versus just pointing in the general direction. While this vague direction might be sufficient in some cases, the detailed instruction is more likely to lead to the desired outcome.

### Output token embeddings are multi-vector representations

We usually overlook the output token embeddings, but the point is—they are also multi-vector representations of the input text. So, why shouldn’t we try to use them in a multi-vector retrieval model, similar to late interaction models?

#### Experiments

We conducted a few experiments to check if the output token embeddings could be used instead of late interaction models. The results are quite promising.

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
            <td>0.70928</td>
        </tr>
        <tr>
            <td><code>colbert-ir/colbertv2.0</code></td>
            <td>late interaction model</td>
            <td>0.69579</td>
        </tr>
        <tr>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>single dense vector representation</td>
            <td>0.64508</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.70724</td>
        </tr>
        <tr>
            <td rowspan="2"><code>BAAI/bge-small-en</code></td>
            <td>single dense vector representation</td>
            <td>0.68213</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td><u>0.73696</u></td>
        </tr>
        <tr>
            <td colspan="4"></td>
        </tr>
        <tr>
            <th rowspan="6">NFCorpus</th>
            <td><code>prithvida/Splade_PP_en_v1</code></td>
            <td>sparse vectors</td>
            <td>0.34166</td>
        </tr>
        <tr>
            <td><code>colbert-ir/colbertv2.0</code></td>
            <td>late interaction model</td>
            <td>0.35036</td>
        </tr>
        <tr>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>single dense vector representation</td>
            <td>0.31594</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.35779</td>
        </tr>
        <tr>
            <td rowspan="2"><code>BAAI/bge-small-en</code></td>
            <td>single dense vector representation</td>
            <td>0.29696</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td><u>0.37502</u></td>
        </tr>
        <tr>
            <td colspan="4"></td>
        </tr>
        <tr>
            <th rowspan="6">ArguAna</th>
            <td><code>prithvida/Splade_PP_en_v1</code></td>
            <td>sparse vectors</td>
            <td>0.47271</td>
        </tr>
        <tr>
            <td><code>colbert-ir/colbertv2.0</code></td>
            <td>late interaction model</td>
            <td>0.44534</td>
        </tr>
        <tr>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>single dense vector representation</td>
            <td>0.50167</td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.45997</td>
        </tr>
        <tr>
            <td rowspan="2"><code>BAAI/bge-small-en</code></td>
            <td>single dense vector representation</td>
            <td><u>0.58857</u></td>
        </tr>
        <tr>
            <td>output token embeddings</td>
            <td>0.57648</td>
        </tr>
    </tbody>
</table>

The [source code of the experiments is open-source](https://github.com/kacperlukawski/beir-qdrant/blob/main/examples/retrieval/search/evaluate_all_exact.py) and uses [`beir-qdrant`](https://github.com/kacperlukawski/beir-qdrant), which is an integration of Qdrant with the [BeIR library](https://github.com/beir-cellar/beir). It is not an official package maintained by the Qdrant team, but it might be useful for those who want to experiment with various Qdrant configurations and see how they impact retrieval quality. All the experiments were done using Qdrant in exact search mode, so the results are not affected by approximate search.

"Even the simple `all-MiniLM-L6-v2` model can be used in a late interaction model fashion, with a positive impact on retrieval quality. However, the best results were achieved by the `BAAI/bge-small-en` model, which outperformed both sparse and late interaction models."

It's worth noting that ColBERT has not been trained on BeIR datasets, so its performance is fully out-of-domain. However, the `all-MiniLM-L6-v2` [training dataset also does not contain any BeIR data](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#training-data), and it still performs quite well.

### Pros and cons

The retrieval quality speaks for itself, but there are other aspects to consider as well.

The traditional dense embedding models we tested are less complex than the late interaction or sparse models. They have fewer parameters and, for that reason, should also be faster during inference and cheaper to maintain. Here is a comparison of the models used in the experiments:

| Model                        | Number of parameters |
|------------------------------|----------------------|
| `prithivida/Splade_PP_en_v1` | 109,514,298          |
| `colbert-ir/colbertv2.0`     | 109,580,544          |
| `BAAI/bge-small-en`          | 33,360,000           |
| `all-MiniLM-L6-v2`           | 22,713,216           |

One argument against using the output token embeddings is the increased storage requirements compared to ColBERT-like models. For example, the `all-MiniLM-L6-v2` model produces 384-dimensional output token embeddings, which is three times more than the 128-dimensional ColBERT-like models. This obviously leads to increased memory usage, but it also affects the computational cost of retrieval, as calculating the distance takes more time. It would make a lot of sense to mitigate this issue by compressing the vectors.

#### Impact of the quantization

Binary quantization is generally more suitable for high-dimensional vectors, and `all-MiniLM-L6-v2`, with its relatively low-dimensional outputs, is on the opposite side of the spectrum. However, scalar quantization still seemed like a good idea. The table below summarizes the impact of quantization on retrieval quality.

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
            <td>0.70724</td>
        </tr>
        <tr>
            <td>output token embeddings (uint8)</td>
            <td>0.70297</td>
        </tr>
        <tr>
            <td colspan="4"></td>
        </tr>
        <tr>
            <th rowspan="2">NFCorpus</th>
            <td rowspan="2"><code>all-MiniLM-L6-v2</code></td>
            <td>output token embeddings</td>
            <td>0.35779</td>
        </tr>
        <tr>
            <td>output token embeddings (uint8)</td>
            <td>0.35572</td>
        </tr>
    </tbody>
</table>

It cannot be generalized that quantization will always maintain retrieval quality at the same level, but in this case, it seems that scalar quantization does not significantly affect retrieval quality. The impact is negligible, and the memory savings are substantial.

We maintain the original quality while using four times less memory. Moreover, a quantized vector requires 384 bytes, while ColBERT requires 512. We saved 25% of the memory, and the retrieval quality remained almost the same.

### Practical considerations

If you happen to use one of the sentence transformer models, the output token embeddings are calculated regardless. While a single vector representation will be more efficient in terms of storage and computation, it’s not necessary to discard the output token embeddings. According to the experiments, they should offer a significant improvement in retrieval quality. You can store both the single vector and the output token embeddings in Qdrant, using the single vector for the initial retrieval step and then reranking the results using the output token embeddings.

![Single model reranking](/articles_data/late-interaction-models/single-model-reranking.png)

To prove this concept, we implemented a simple reranking pipeline in Qdrant, which uses a dense embedding model for initial oversampled retrieval and then relies solely on the output token embeddings for the reranking step.

#### Single model retrieval and reranking benchmarks

Our tests focused on using the same model for retrieval and reranking. The reported metric is also NDCG@10. All attempts used an oversampling factor of 5x, so the retrieval step returned 50 results, and the reranking step reduced the number of results to 10. Here are the results for some of the BeIR datasets:

<table>
    <thead>
        <tr>
            <th rowspan="2">Dataset</th>
            <th colspan="2"><code>all-miniLM-L6-v2</code></th>
            <th colspan="2"><code>BAAI/bge-small-en</code></th>
        </tr>
        <tr>
            <th>dense embeddings only</th>
            <th>dense + reranking</th>
            <th>dense embeddings only</th>
            <th>dense + reranking</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>SciFact</th>
            <td>0.64508</td>
            <td>0.70293</td>
            <td>0.68213</td>
            <td><u>0.73053</u></td>
        </tr>
        <tr>
            <th>NFCorpus</th>
            <td>0.31594</td>
            <td>0.34297</td>
            <td>0.29696</td>
            <td><u>0.35996</u></td>
        </tr>
        <tr>
            <th>ArguAna</th>
            <td>0.50167</td>
            <td>0.45378</td>
            <td><u>0.58857</u></td>
            <td>0.57302</td>
        </tr>
        <tr>
            <th>Touche-2020</th>
            <td>0.16904</td>
            <td>0.19693</td>
            <td>0.13055</td>
            <td><u>0.19821</u></td>        
        </tr>
        <tr>
            <th>TREC-COVID</th>
            <td>0.47246</td>
            <td><u>0.6379</u></td>
            <td>0.45788</td>
            <td>0.53539</td>
        </tr>
        <tr>
            <th>FiQA-2018</th>
            <td>0.36867</td>
            <td><u>0.41587</u></td>
            <td>0.31091</td>
            <td>0.39067</td>
        </tr>
    </tbody>
</table>

Again, the source code of the benchmark is publicly available, and [you can find it in the repository of the `beir-qdrant` package](https://github.com/kacperlukawski/beir-qdrant/blob/main/examples/retrieval/search/evaluate_reranking.py).

Overall, adding the reranking step using the same model usually helps to improve retrieval quality. However, the quality of different late interaction models is [often reported based on how well they perform in the reranking step when BM25 is used for the initial retrieval](https://huggingface.co/mixedbread-ai/mxbai-colbert-large-v1#1-reranking-performance). This experiment aimed to show how a single model can be used for both retrieval and reranking, and the results are still quite promising.

Now, let's see how to do it with the new Query API introduced in Qdrant 1.10.

#### Qdrant implementation

The new Query API introduced in Qdrant 1.10 allows for building even more complex retrieval pipelines. We can use the single vector created after pooling as the first retrieval step and then rerank the results using the output token embeddings.

Assume the collection is called `my-collection` and it's configured to keep two named vectors: `dense-vector` and `output-token-embeddings`. Here is how such a collection could be created in Qdrant:

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

Now, instead of calling the search API with just a single dense vector, we can build a reranking pipeline where we first retrieve 50 results using the dense vector, and then rerank them using the output token embeddings to get the top 10 results.

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
In a real-world scenario, you would probably take it a step further by calculating the token embeddings first, and then performing pooling to get the single vector representation. This way, you can do everything in a single pass.

The easiest way to start experimenting with building complex reranking pipelines with Qdrant is to use the forever-free cluster on [Qdrant Cloud](https://cloud.qdrant.io/).

## Future work

The initial experiments utilizing output token embeddings in the retrieval process have shown promising results. However, we intend to conduct further benchmarks to validate these findings and focus on incorporating sparse methods for the initial retrieval. Additionally, we aim to delve deeper into how quantization affects multi-vector representations and its consequent impact on retrieval quality. Lastly, we will examine retrieval speed, a critical factor for numerous applications.
