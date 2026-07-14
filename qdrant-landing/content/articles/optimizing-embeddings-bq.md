---
title: "Optimize Text Embedding Efficiency with Quantization"
short_description: "Use Qdrant's Binary Quantization to enhance modern text embeddings"
description: "Explore how Qdrant's Binary Quantization can significantly improve the efficiency and performance of modern text embedding models."
social_preview_image: /articles_data/optimizing-embeddings-bq/preview/social_preview.jpg
preview_dir: /articles_data/optimizing-embeddings-bq/preview
slug: optimize-embeddings-quantization
weight: 30
author: Ewa Szyszka
author_link: https://github.com/ESzyszka
date: 2026-07-15T10:00:00+02:00
draft: false
tags:
  - text embeddings
  - embedding models
  - quantization
category: search-quality
keywords:
  - binary quantization
  - vector quantization
  - embedding optimization
  - text embeddings
---

Modern text embedding models are a powerful tool for natural language processing (NLP). However, the size of these embeddings is a challenge, especially with real-time search and retrieval. In this article, we explore how you can use quantization in Qdrant, with a focus on Binary Quantization, to enhance the performance and efficiency of the latest text embeddings.

In this post, we discuss:

- The quantization methods available in Qdrant, and when to use each one
- The latest text embedding models and benchmarks such as MTEB and MIRACL
- Results of an experiment that highlights improvements in search efficiency and accuracy
- Implications of these findings for real-world applications
- How to validate the optimization with the Ranx evaluation library
- Best practices for leveraging Binary Quantization to enhance text embeddings

If you're new to Binary Quantization, consider reading our article which walks you through the concept and [how to use it with Qdrant](/articles/binary-quantization/)

## The Quantization Ladder in Qdrant

Qdrant supports four quantization methods, each sitting at a different point on the compression-versus-accuracy ladder:

- **[Scalar Quantization](/articles/scalar-quantization/)** is the most forgiving choice. It maps `float32` to `uint8` for a 4x reduction with little accuracy loss, so it's a reliable starting point.
- **[Binary Quantization](/articles/binary-quantization/)** replaces each value with a single bit, for up to 32x compression and the fastest search. It shines with high-dimensional embeddings: with rescoring and oversampling enabled, the accuracy gap nearly closes. For low-dimensional models the recall loss is harder to recover.
- **[Product Quantization](https://qdrant.tech/articles/product-quantization/)** delivers the largest compression, up to 64x, but is the slowest and loses the most accuracy. Reserve it for cases where memory footprint is all that matters.
- **[TurboQuant](/articles/turboquant-quantization/)** is Qdrant's newest quantization method, a rotation-based technique from Google Research available in Qdrant 1.18 and later. It offers four operating points, 4-bit, 2-bit, 1.5-bit, and 1-bit, spanning 8x to 32x compression, so you can dial in the exact accuracy-versus-memory trade-off. It's the recommended default for new collections.

This article focuses on Binary Quantization because it's the right tool for the scenario we study: large, high-dimensional text embeddings, where storage and search speed dominate your costs, and where rescoring recovers the accuracy that aggressive compression gives up. To compare all four methods in depth, check the [quantization documentation](/documentation/manage-data/quantization/).

## The Latest Text Embedding Models

Text embedding models have advanced rapidly, and the field is no longer dominated by a single provider. You can now choose from a wide range of high-quality models, both commercial and open-source, that top benchmarks such as [MTEB](https://huggingface.co/spaces/mteb/leaderboard) and [MIRACL](https://github.com/project-miracl/miracl). Many support over 100 languages and let you pick from several embedding sizes.

Because the rankings change constantly, the best way to stay current is to check the live [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) before committing to a model. As of mid-2026, the top three models on the MTEB Multilingual leaderboard are:

| Rank | Model | Embedding Dim | Max Tokens | MTEB Mean |
|-|-|-|-|-|
| 1 | [microsoft/harrier-oss-v1-27b](https://huggingface.co/microsoft/harrier-oss-v1-27b) | 5376 | 131,072 | 74.27 |
| 2 | [tencent/KaLM-Embedding-Gemma3-12B-2511](https://huggingface.co/tencent/KaLM-Embedding-Gemma3-12B-2511) | 3840 | 32,768 | 72.32 |
| 3 | [nvidia/llama-embed-nemotron-8b](https://huggingface.co/nvidia/llama-embed-nemotron-8b) | 4096 | 32,768 | 69.46 |

### Choosing the Right Model for Your Use Case

The top of the leaderboard is a starting point, not a final answer. There's rarely a single best model. The right choice is the one that meets your accuracy target while respecting your constraints on speed, cost, and infrastructure. A benchmark reports an average score across many tasks, so the model that ranks first overall is rarely the model that fits your specific workload best. Before you commit, weigh the following factors against your requirements:

| Factor | What to Weigh |
|-|-|
| **Task and Domain Fit** | A model that leads a general benchmark may trail a smaller, specialized model on your domain, whether that's code, legal text, biomedical literature, or short product queries. Test candidates on your own data before you decide. |
| **Language Coverage** | If you serve a specific set of languages, a model tuned for those languages can beat a higher-ranked multilingual model. A broad "100+ languages" claim doesn't guarantee strong quality for each one. |
| **Latency and Throughput** | Larger models take longer to encode text and cost more per query. For real-time search or high query volumes, a faster mid-sized model often delivers a better experience than the top-ranked one. |
| **Memory and Cost** | A 27-billion-parameter model needs far more RAM and compute to run than an open model you can host yourself. The largest models in our own experiment didn't fit on a 16 GB machine, which shaped what we could measure. |
| **Context Length** | Match the maximum token limit to your documents. A model with a huge context window adds no value if your passages are short, and a short window forces you to chunk longer documents. |


## Enhanced Performance and Efficiency with Binary Quantization

Suppose your embedding looks like this:

```
[0.24, -0.91, 1.32, -0.02, 0.67, ...]
```

Every value is normally stored as a 32-bit floating-point number. For a 4,096-dimensional embedding, that adds up quickly:

```
4,096 values × 32 bits
≈ 131,072 bits
≈ 16 KB
```

Now imagine you have 100 million documents:

```
16 KB × 100,000,000
≈ 1.6 TB
```

That's just the vectors, not the index or metadata. At this scale, memory becomes one of your biggest infrastructure costs.

Binary Quantization tackles this by replacing each floating-point value with a single bit: positive values become `1`, and negative values become `0`. So instead of storing:

```
[0.24, -0.91, 1.32, -0.02]
```

you store:

```
[1, 0, 1, 0]
```

Each dimension now costs 1 bit instead of 32 bits, which gives roughly a 32x reduction in storage for the quantized representation.

![Binary Quantization explainer diagram](/articles_data/optimizing-embeddings-bq/2-binary-quantization-explainer.png)

### Dimension Reduction vs Accuracy with Binary Quantization
 
Compressing 32 bits into one is lossy: the binary vector keeps only the sign of each value and discards its magnitude, so the fast binary search can rank candidates slightly differently than a full-precision search would. Qdrant gives you two levers to recover that accuracy:
 
- **Oversampling** retrieves more binary candidates than the number of results you actually want. Because the binary search is approximate, the true nearest neighbors sometimes fall just outside the top results, and widening the pool gives you a chance to catch them. You set it as a multiplier, so a factor of 3 with a limit of 10 pulls roughly 30 candidates before narrowing back to 10.
- **Rescoring** takes those candidates and recomputes their distances with the original full-precision vectors, then reorders them. The final ranking matches what a full-precision search would return, which is why rescoring always improves accuracy. It pairs naturally with oversampling, since the wider candidate pool is exactly what it reorders.
Despite the lossy compression, the efficiency gains from Binary Quantization are substantial:
 
- **Reduced storage footprint**: up to 32x less memory, which matters most on large-scale datasets.
- **Faster retrieval**: smaller vectors mean faster searches.
- **Accelerated scoring**: distance calculations become bitwise operations, enabling real-time querying even on extensive databases.
The chart below shows recall@10 against full-precision search for two Matryoshka-trained models. At their native dimension, Binary Quantization holds up well: `mxbai-embed-large-v1` scores 0.9707 at 1024 dimensions and `nomic-embed-text-v1.5` scores 0.9067 at 768. Accuracy drops as vectors are truncated further, to roughly 0.80 and 0.73 at 256 dimensions, which is where the storage-versus-precision trade-off starts to bite.
 
![Recall@10 for full-precision search vs Binary Quantization](/articles_data/optimizing-embeddings-bq/3-recall-full-precision-vs-bq.png)

#### Matryoshka Representation Learning

Many of the latest models are trained with a technique called "[Matryoshka Representation Learning](https://aniketrege.github.io/blog/2024/mrl/)". Developers can set up embeddings of different sizes (number of dimensions) and select the one that balances accuracy and size. For example, `mxbai-embed-large-v1` keeps over 93% of its performance at 512 dimensions, and nomic-embed-text-v1.5 supports any size between 64 and 768.

Because Matryoshka models concentrate the most important information in the earlier dimensions, they pair well with Binary Quantization: you first trim the vector to the smallest dimension your recall target allows, then quantize each remaining dimension to a single bit. Later in this article, we show that the accuracy of Binary Quantization stays high across different dimensions.

The table below lists popular choices that support flexible dimensions or binary embeddings, several with Matryoshka truncation. For a deeper dive read [how to choose an embedding model](/articles/how-to-choose-an-embedding-model/) article.

| Model | Dimensions | Max Tokens | Matryoshka |
|-|-|-|-|
| [mixedbread mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 1024 (down to 512, 256) | 512 | Yes |
| [Nomic nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 64-768 | 8192 | Yes |
| [EmbeddingGemma-300M](https://huggingface.co/google/embeddinggemma-300m) | 768 (down to 512, 256, 128) | 2048 | Yes |
| [Jina Embeddings v4](https://huggingface.co/jinaai/jina-embeddings-v4) | 2048 (down to 128) | long-context | Yes |
| [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | 32-1024 (user-defined) | long-context | No |
| [BGE-M3](https://huggingface.co/BAAI/bge-m3) | 1024 | 8192 | No |

### Experiment Setup
 
Our setup breaks into three parts: the model, the dataset, and the two search parameters we vary from run to run.
 
#### The Model: llama-embed-nemotron-8b
 
We built the experiment around [llama-embed-nemotron-8b](https://huggingface.co/nvidia/llama-embed-nemotron-8b), a retrieval model from NVIDIA. Unlike the Matryoshka models, it produces a single fixed embedding size rather than truncatable dimensions, so we hold the dimension constant at 4,096 and isolate the effect of Binary Quantization itself.
 
| Property | Value |
|-|-|
| Base model | Llama-3.1-8B |
| Parameters | 7.5 billion |
| Embedding dimensions | 4,096 (fixed) |
| Max context | 32,768 tokens |
| Languages | 1,000+ (multilingual retrieval) |
 
#### Dataset
 
We use [AG News](https://huggingface.co/datasets/fancyzhx/ag_news), a standard collection of English news articles. We sample 1,500 passages as the searchable corpus and hold out 150 as queries. For each query, the full-precision float results serve as ground truth, and we repeat the search with binary-quantized vectors to measure how closely the compressed search reproduces it.
 
#### Independent Variables: Oversampling and Rescoring
 
Oversampling and rescoring are the independent variables in this experiment: the inputs we manipulate while measuring recall@10 as the outcome. Both are defined in [Dimension Reduction vs Accuracy](#dimension-reduction-vs-accuracy-with-binary-quantization); here, we cross them into a grid of runs:
 
- **Oversampling factor**: swept from 1 to 4.
- **Rescoring**: run with the `rescore` flag both on and off.
Running every combination lets us isolate how much each setting contributes to accuracy, and at what computational cost.

### Results: Binary Quantization's Impact on Retrieval Accuracy

To understand how Binary Quantization behaves in practice, we examined the two settings that most affect the trade-off between accuracy and speed: rescoring and oversampling.

#### Impact of Rescoring

![Impact of rescoring on recall@10](/articles_data/optimizing-embeddings-bq/4-rescoring-impact.png)

A few consistent patterns emerge:

1. **Rescoring reliably improves accuracy**:
   - Across every model and dimension we tested, enabling rescoring produces higher recall@10 than leaving it off.
   - The gain is substantial. For `mxbai-embed-large-v1` at 1,024 dimensions, recall@10 rises from 0.70 to 0.97, and for `nomic-embed-text-v1.5` at 768 dimensions it rises from 0.61 to 0.91.

2. **Model and Dimension Specific Observations**:
   - Lower effective dimensions lose more information to quantization, so rescoring has more ground to recover, and its impact is largest there. At 256 dimensions, rescoring lifts `mxbai-embed-large-v1` from 0.48 to 0.80.
   - At high dimensions, the binary search already tracks the float ranking closely, so rescoring closes a smaller, but still meaningful, gap.

For a high-dimensional model like `llama-embed-nemotron-8b` at 4,096 dimensions, the binary sign pattern preserves most of the geometry, so we expect it to sit at the strong end of this range once rescoring is enabled. In short, rescoring is a crucial feature for applications where precision matters, such as semantic search, content discovery, and recommendation systems, where result quality directly shapes the user experience.

### Model and Dataset Combinations

To check that Binary Quantization holds up beyond a single model and a single corpus, we tested it across a grid of combinations. Each combination varies by three attributes:

1. **Model**: The embedding model that produces the vectors. We tested `mxbai-embed-large-v1` and `nomic-embed-text-v1.5`, two strong open-source models that fit in this machine's memory. The high-capacity `llama-embed-nemotron-8b` is the target we reason toward, but at 7.5 billion parameters it cannot be encoded on a 16 GB machine, so it is not measured here.

2. **Dimensions**: The size of the vector embeddings. Both models are [Matryoshka-trained](https://arxiv.org/abs/2205.13147), so we truncate each to several sizes. Higher dimensions tend to preserve more accuracy, at the cost of more storage and search time.

3. **Dataset**: The text corpus. We used [AG News](https://huggingface.co/datasets/fancyzhx/ag_news), a collection of English news articles, and [DBpedia](https://huggingface.co/datasets/fancyzhx/dbpedia_14), a set of longer encyclopedia abstracts. Testing two domains shows whether the patterns depend on the corpus.

Testing across these combinations lets you identify the configuration that best meets your needs, weighing search accuracy against computational resources.

```python
combinations = [
    {"model_name": "mixedbread-ai/mxbai-embed-large-v1", "dimensions": 1024},
    {"model_name": "mixedbread-ai/mxbai-embed-large-v1", "dimensions": 512},
    {"model_name": "mixedbread-ai/mxbai-embed-large-v1", "dimensions": 256},
    {"model_name": "nomic-ai/nomic-embed-text-v1.5", "dimensions": 768},
    {"model_name": "nomic-ai/nomic-embed-text-v1.5", "dimensions": 512},
    {"model_name": "nomic-ai/nomic-embed-text-v1.5", "dimensions": 256},
]
datasets = ["ag_news", "dbpedia"]
```

#### Exploring Combinations and Their Impact on Accuracy

For each combination of model, dimensions, and dataset, we load the recorded recall@10 for every setting, then summarize it: we group the runs by oversampling factor and by whether rescoring was on or off, and average the recall@10 within each group. Laying the results out this way, with the oversampling factor down the side and rescoring on versus off across the top, makes the effect of each parameter easy to read at a glance.

The following table shows the real measured results from our reproducible experiment, reporting the best recall@10 achieved with rescoring enabled across oversampling factors of 1 to 4. These open models stand in for the higher-capacity llama-embed-nemotron-8b, which is expected to land at the strong end of this range thanks to its 4,096 dimensions:

|Model|Dimensions|Test Dataset|Best Recall@10|
|-|-|-|-|
|[mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1)|1024|[AG News](https://huggingface.co/datasets/fancyzhx/ag_news)|0.9707|
|[mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1)|1024|[DBpedia](https://huggingface.co/datasets/fancyzhx/dbpedia_14)|0.9440|
|[nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)|768|[AG News](https://huggingface.co/datasets/fancyzhx/ag_news)|0.9067|
|[nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)|768|[DBpedia](https://huggingface.co/datasets/fancyzhx/dbpedia_14)|0.8847|
|[mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1)|512|[AG News](https://huggingface.co/datasets/fancyzhx/ag_news)|0.8973|
|[nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)|512|[DBpedia](https://huggingface.co/datasets/fancyzhx/dbpedia_14)|0.8253|

Two patterns stand out. First, the result holds across both datasets: at each model's native dimension, recall@10 with rescoring stays above 0.88 on both AG News and DBpedia, so the accuracy is a property of Binary Quantization itself, not of one specific corpus. Second, dimension drives the outcome more than the choice of model or dataset. Both models lose accuracy as they're truncated toward 256 dimensions, which reinforces the guidance to use the highest dimension available, exactly where a fixed 4,096-dimension model like llama-embed-nemotron-8b is positioned to do well.

#### Impact of Oversampling

The trade-off with oversampling is computational: a higher factor rescores more candidates per query, so each search costs more work. In our experiment, increasing the oversampling factor improved accuracy with diminishing returns. The largest gains came from the first few multiples, after which the curve flattened. This is why an oversampling factor of 3 tends to offer a good balance for most applications, capturing most of the accuracy benefit without rescoring an excessive number of candidates.

![Effect of oversampling factor on recall@10](/articles_data/optimizing-embeddings-bq/5-oversampling-effect.png)

### Have We Optimized the Embeddings? Evaluating with Ranx

Accuracy alone doesn't tell you whether Binary Quantization is a worthwhile trade-off. To answer "have we actually optimized the embeddings?", we need to measure how close the quantized search results stay to the original, full-precision results across standard ranking metrics.

[Ranx](https://github.com/AmenRa/ranx) is a fast Python library for ranking evaluation and comparison. It computes metrics such as Recall, Mean Reciprocal Rank (MRR), and Normalized Discounted Cumulative Gain (NDCG) at a given cutoff, and it can run statistical significance tests between two result sets. This makes it a natural fit for comparing a binary-quantized run against the original-vector run.

The pattern is straightforward. Treat the results from the original float32 vectors as the ground truth (the `Qrels`), then score each quantized configuration as a `Run`:

```python
from ranx import Qrels, Run, compare

# Ground truth: nearest neighbors from the original float32 vectors
qrels = Qrels(original_results)

# Candidate runs: one per quantized configuration
runs = [
    Run(binary_no_rescore, name="binary"),
    Run(binary_with_rescore, name="binary+rescore"),
]

report = compare(
    qrels,
    runs=runs,
    metrics=["recall@10", "mrr@10", "ndcg@10"],
    max_p=0.05,  # paired statistical significance test
)
print(report)
```

Run this way, the evaluation confirms the optimization. With rescoring enabled, the binary-quantized run recovers the original ranking closely: in our reproducible experiment, recall@10 reaches 0.9707 for mxbai-embed-large-v1 at its native 1,024 dimensions, while storage drops by up to 32x. A higher-dimensional model like llama-embed-nemotron-8b, at 4,096 dimensions, is expected to retain even more of the original ranking, since each vector carries more information for the binary sign pattern to preserve. In other words, you keep nearly all of the search quality for a fraction of the memory and a faster search. That is the optimization we set out to validate.

### Leveraging Binary Quantization: Best Practices

We recommend the following best practices for leveraging Binary Quantization with modern text embeddings:

1. **Embedding Model**: Pick a high-dimensional model from the top of the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). High-capacity models like llama-embed-nemotron-8b at 4,096 dimensions are well suited to Binary Quantization, and open-source models like mxbai-embed-large-v1 are strong alternatives that also work well with binary embeddings.
2. **Dimensions**: Use the highest dimension available for the model, to maximize accuracy.
3. **Oversampling**: Use an oversampling factor of 3 for the best balance between accuracy and efficiency. This factor is suitable for a wide range of applications.
4. **Rescoring**: Enable rescoring to improve the accuracy of search results.
5. **RAM**: Store the full vectors and payload on disk. Limit what you load from memory to the Binary Quantization index. This helps reduce the memory footprint and improve the overall efficiency of the system. The incremental latency from the disk read is negligible compared to the latency savings from the binary scoring in Qdrant, which uses SIMD instructions where possible.

## What's Next?

Binary Quantization is exceptional if you need to work with large volumes of data under high recall expectations. If your embeddings are lower-dimensional, or you want to tune the compression-versus-accuracy trade-off more finely, revisit the [quantization ladder](#the-quantization-ladder-in-qdrant) and consider Scalar Quantization or TurboQuant instead. The [quantization documentation](/documentation/manage-data/quantization/) covers all four methods in detail.

You can try Binary Quantization either by spinning up a [Qdrant container image](https://hub.docker.com/r/qdrant/qdrant) locally or, having us create one for you through a [free account](https://cloud.qdrant.io/login) in our cloud hosted service. The article gives examples of data sets and configuration you can use to get going, and our documentation covers [adding large datasets to Qdrant](/documentation/tutorials-develop/bulk-upload/).

Want to discuss these findings and learn more about Binary Quantization? [Join our Discord community.](https://discord.gg/qdrant)
