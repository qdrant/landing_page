---
title: "Optimize Text Embedding Efficiency with Quantization"
short_description: "Use Qdrant's Binary Quantization to enhance modern text embeddings"
description: "Explore how Qdrant's Binary Quantization can improve the efficiency and performance of modern text embedding models."
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

Modern text embedding models are powerful tools for natural language processing. However, their size poses a challenge for real-time search and retrieval. In this article, we explore how you can use quantization in Qdrant, with a focus on Binary Quantization, to improve the performance and efficiency of the latest text embeddings.

In this article, we discuss:

- The quantization methods available in Qdrant, and when to use each one
- The latest text embedding models and benchmarks such as MTEB and MIRACL
- Results of an experiment that highlights improvements in search efficiency and accuracy
- Implications of these findings for real-world applications
- How to validate the optimization with the Ranx evaluation library
- Best practices for using Binary Quantization to enhance text embeddings

If you're new to Binary Quantization, consider reading our article, which walks you through the concept and [how to use it with Qdrant](/articles/binary-quantization/).

## The Quantization Ladder in Qdrant

Qdrant supports four quantization methods, each sitting at a different point on the compression-versus-accuracy ladder:

- **[Scalar Quantization](/articles/scalar-quantization/)** is the most forgiving choice. It maps `float32` to `uint8` for a 4x reduction with little accuracy loss, so it's a reliable starting point.
- **[Binary Quantization](/articles/binary-quantization/)** reduces each value to one, 1.5, or two bits, for 32x, 24x, or 16x compression, and it's the fastest method Qdrant offers. The 1-bit encoding works best with high-dimensional embeddings: with rescoring and oversampling enabled, the accuracy gap narrows substantially (discussed in detail later). Below roughly a thousand dimensions, the 2-bit encoding handles values near zero better and recovers much of the recall that 1-bit gives up.
- **[Product Quantization](/articles/product-quantization/)** delivers the largest compression, up to 64x, but is the slowest and loses the most accuracy. Reserve it for cases where memory footprint is all that matters.
- **[TurboQuant](/articles/turboquant-quantization/)** is Qdrant's newest quantization method, a rotation-based technique from Google Research available in Qdrant 1.18 and later. It offers four operating points, 4-bit, 2-bit, 1.5-bit, and 1-bit, spanning 8x to 32x compression, so you can dial in the exact accuracy-versus-memory trade-off. The 4-bit default is a good starting point for many new collections, and at matched storage budgets it generally returns more recall than Binary Quantization, at lower throughput.

This article focuses on Binary Quantization because it's the right tool for the scenario we study: large, high-dimensional text embeddings where storage and search speed dominate your costs, and where rescoring recovers the accuracy that aggressive compression gives up. To compare all four methods in depth, check the [quantization documentation](/documentation/manage-data/quantization/).

## The Latest Text Embedding Models

Text embedding models have advanced rapidly, and the field is no longer dominated by a single provider. You can now choose from a wide range of high-quality models, both commercial and open-source, that top benchmarks such as [MTEB](https://huggingface.co/spaces/mteb/leaderboard) and [MIRACL](https://github.com/project-miracl/miracl). Many support over 100 languages and let you pick from several embedding sizes.

Rankings change constantly, and the multilingual results are reported on more than one board, so scores are not always directly comparable between models. Check the live [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) before committing. As of mid-2026, these are three of the strongest high-dimensional multilingual models, with the board each score comes from:

| Model | Dimensions | Reported Score |
|-|-|-|
| [microsoft/harrier-oss-v1-27b](https://huggingface.co/microsoft/harrier-oss-v1-27b) | 5,376 | 74.3 (MTEB v2 multilingual) |
| [tencent/KaLM-Embedding-Gemma3-12B-2511](https://huggingface.co/tencent/KaLM-Embedding-Gemma3-12B-2511) | 3,840 | 72.32 (MMTEB) |
| [nvidia/llama-embed-nemotron-8b](https://huggingface.co/nvidia/llama-embed-nemotron-8b) | 4,096 | 69.46 (MMTEB) |

What matters for this article is the dimension column. All three sit well above a thousand dimensions, which is the region where 1-bit Binary Quantization performs best.

### Choosing the Right Model for Your Use Case

The top of the leaderboard is a starting point, not a final answer. There's rarely a single best model. The right choice is the one that meets your accuracy target while respecting your constraints on speed, cost, and infrastructure. A benchmark reports an average score across many tasks, so the model that ranks first overall is rarely the model that fits your specific workload best. Before you commit, weigh the following factors against your requirements:

| Factor | What to Weigh |
|-|-|
| **Task and Domain Fit** | A model that leads a general benchmark may trail a smaller, specialized model on your domain, whether that's code, legal text, biomedical literature, or short product queries. Test candidates on your own data before you decide. |
| **Language Coverage** | If you serve a specific set of languages, a model tuned for those languages can beat a higher-ranked multilingual model. A broad "100+ languages" claim doesn't guarantee strong quality for each one. |
| **Latency and Throughput** | Larger models take longer to encode text and cost more per query. For real-time search or high query volumes, a faster mid-sized model often gives a better experience than the top-ranked one. |
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

Binary Quantization tackles this by replacing each floating-point value with a single bit: values of zero or above become `1`, and negative values become `0`. So instead of storing:

```
[0.24, -0.91, 1.32, -0.02]
```

you store:

```
[1, 0, 1, 0]
```

Each dimension now costs one bit instead of 32 bits, which gives roughly a 32x reduction in storage for the quantized representation.

![Diagram: five float32 values map to single bits by sign, then a storage comparison showing 4,096 dimensions at 16 KB per vector and 1.6 TB across 100 million documents in full precision, against 512 B per vector and 51.2 GB binary quantized](/articles_data/optimizing-embeddings-bq/2-binary-quantization-explainer.png)

### Dimension Reduction vs Accuracy with Binary Quantization

Compressing 32 bits into one is lossy: the binary vector keeps only the sign of each value and discards its magnitude, so the fast binary search can rank candidates slightly differently than a full-precision search would. Qdrant gives you three levers to recover that accuracy, and the first two only work together.

- **Oversampling** retrieves more binary candidates than the number of results you actually want. Because the binary search is approximate, the true nearest neighbors sometimes fall just outside the top results, and widening the pool gives you a chance to catch them. You set it as a multiplier, so a factor of 3 with a limit of 10 pulls roughly 30 candidates before narrowing back to 10.
- **Rescoring** takes those candidates and recomputes their distances with the original full-precision vectors, then reorders them. The final ranking of those candidates matches what a full-precision search would return.
- **Asymmetric quantization** encodes the query at higher precision than the stored vectors. Binary storage paired with an 8-bit scalar-quantized query keeps memory at the binary level while improving precision, which is useful when disk I/O rather than CPU is your constraint. Set it with the `query_encoding` parameter.

Oversampling and rescoring are worth thinking about as a single mechanism rather than two independent knobs. Recall@10 depends on *which* ten documents come back, not the order they arrive in, so rescoring a pool of exactly ten candidates reorders them without changing the set, and recall is unchanged. Rescoring only improves recall when oversampling has widened the pool first, which is why oversampling at a factor of 1 marks the no-rescore baseline in the results that follow.

Despite the lossy compression, the efficiency gains from Binary Quantization are substantial:

- **Reduced Storage Footprint**: up to 32x less memory, which matters most on large-scale datasets.
- **Faster Retrieval**: smaller vectors mean faster searches.
- **Accelerated Scoring**: distance calculations become bitwise operations, enabling real-time querying even on large databases.

The following chart compares binary-quantized search against the full-precision results it is measured against. Full precision is the reference, so it sits at 1.0 by definition rather than as a measured score. At their native dimension, Binary Quantization holds up well: `mxbai-embed-large-v1` reaches 0.9713 recall@10 at 1,024 dimensions and `nomic-embed-text-v1.5` reaches 0.9060 at 768. Accuracy falls as vectors are truncated, to 0.8007 and 0.7327 at 256 dimensions, which is where the storage-versus-precision trade-off starts to bite.

![Bar chart comparing recall@10 of binary quantized search against the full-precision reference across six configurations, from 0.9713 for mxbai-embed-large-v1 at 1,024 dimensions down to 0.7327 for nomic-embed-text-v1.5 at 256 dimensions](/articles_data/optimizing-embeddings-bq/3-recall-full-precision-vs-bq.png)

#### Matryoshka Representation Learning

Many of the latest models are trained with a technique called [Matryoshka Representation Learning](https://aniketrege.github.io/blog/2024/mrl/). Developers can generate embeddings at different sizes, then select the number of dimensions that balances accuracy and size. For example, `mxbai-embed-large-v1` produces 1,024 dimensions that can be truncated to 512 or 256, and `nomic-embed-text-v1.5` supports any size between 64 and 768.

Because Matryoshka models concentrate the most important information in the earlier dimensions, they pair well with Binary Quantization: you first trim the vector to the smallest dimension your recall target allows, then quantize each remaining dimension to a single bit. Later in this article, we measure how far accuracy holds up across different dimensions.

The following table lists popular choices that support flexible dimensions or binary embeddings, several with Matryoshka truncation. For a deeper dive, read our [how to choose an embedding model](/articles/how-to-choose-an-embedding-model/) article.

| Model | Dimensions | Max Tokens | Matryoshka |
|-|-|-|-|
| [mixedbread mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 1,024 (down to 512, 256) | 512 | Yes |
| [Nomic nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 64-768 | 8,192 | Yes |
| [EmbeddingGemma-300M](https://huggingface.co/google/embeddinggemma-300m) | 768 (down to 512, 256, 128) | 2,048 | Yes |
| [Jina Embeddings v4](https://huggingface.co/jinaai/jina-embeddings-v4) | 2,048 (down to 128) | 32,768 | Yes |
| [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | 32-1,024 (user-defined) | 32,768 | Yes |
| [BGE-M3](https://huggingface.co/BAAI/bge-m3) | 1,024 | 8,192 | No |

### Experiment Setup

Our setup breaks into three parts: the models, the datasets, and the two search parameters we vary from run to run.

#### The Models

We tested two open models, both trained with [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) so that dimension could be varied alongside the search parameters:

| Model | Native Dimensions | Truncated To |
|-|-|-|
| [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 1,024 | 512, 256 |
| [nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 768 | 512, 256 |

A high-dimensional model is where 1-bit Binary Quantization should look strongest, so we wanted to include [llama-embed-nemotron-8b](https://huggingface.co/nvidia/llama-embed-nemotron-8b), a multilingual NVIDIA retrieval model built on Llama-3.1-8B that produces a fixed 4,096-dimensional embedding. At 7.5 billion parameters it does not fit on the 16 GB machine used here, so it is not measured, and none of the results that follow describe it.

#### Datasets

We use two corpora: [AG News](https://huggingface.co/datasets/fancyzhx/ag_news), a standard collection of English news articles, and [DBpedia](https://huggingface.co/datasets/fancyzhx/dbpedia_14), a set of longer encyclopedia abstracts. Testing two domains shows whether the patterns depend on the corpus. From each we sample 1,500 passages as the searchable corpus and hold out 150 as queries.

For each query, the full-precision float results serve as ground truth, and we repeat the search with binary-quantized vectors to measure how closely the compressed search reproduces it. At this corpus size Qdrant searches exactly rather than building an HNSW graph, so these numbers isolate the error introduced by quantization itself, without any interaction with approximate indexing.

#### Independent Variables: Oversampling and Rescoring

Oversampling and rescoring are the independent variables in this experiment: the inputs we manipulate while measuring recall@10 as the outcome. Both are defined in [Dimension Reduction vs Accuracy](#dimension-reduction-vs-accuracy-with-binary-quantization); here, we cross them into a grid of runs:

- **Oversampling Factor**: swept from 1 to 4.
- **Rescoring**: run with the `rescore` flag both on and off.

Running every combination lets us isolate how much each setting contributes to accuracy, and at what computational cost.

### Results: Binary Quantization's Impact on Retrieval Accuracy

Rescoring raised recall@10 in every configuration where the candidate pool was wider than the result limit. The gain is largest at low dimensions, where more information is lost to quantization and rescoring has more ground to recover:

- `mxbai-embed-large-v1` (1,024 dimensions): 0.70 → 0.97
- `nomic-embed-text-v1.5` (768 dimensions): 0.61 → 0.91
- `mxbai-embed-large-v1` (256 dimensions): 0.48 → 0.80

The lower value in each pair is the recall you get from the binary index alone. The higher value combines rescoring with a 4x oversampling factor, since rescoring on its own cannot change which documents are returned.

![Grouped bar chart of recall@10 without rescoring against recall@10 with rescoring and 4x oversampling, across six model and dimension configurations, showing gains of roughly 30 percentage points at every setting](/articles_data/optimizing-embeddings-bq/4-rescoring-impact.png)

That makes rescoring an important feature wherever precision shapes the experience, such as semantic search, content discovery, and recommendation systems.

### Model and Dataset Combinations

To check that Binary Quantization holds up beyond a single model and a single corpus, we tested it across a grid of combinations. Each combination varies by three attributes:

1. **Model**: The embedding model that produces the vectors. We tested `mxbai-embed-large-v1` and `nomic-embed-text-v1.5`, two strong open-source models that fit in the 16 GB of memory available on our test machine.

2. **Dimensions**: The size of the vector embeddings. Both models are Matryoshka-trained, so we truncate each to several sizes. Higher dimensions tend to preserve more accuracy, at the cost of more storage and search time.

3. **Dataset**: The text corpus, either AG News or DBpedia, as described in the setup.

Testing across these combinations lets you identify the configuration that best meets your needs, and weigh search accuracy against computational resources.

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

For each combination of model, dimensions, and dataset, we load the recorded recall@10 for every setting, then summarize it: we group the runs by oversampling factor and by whether rescoring was on or off, and average the recall@10 within each group. Grouping the results this way makes the effect of each parameter easy to read.

The following table reports the best recall@10 on AG News for each configuration, achieved with rescoring enabled at an oversampling factor of 4:

| Model | Dimensions | Best Recall@10 |
|-|-|-|
| [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 1,024 | 0.9713 |
| [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 512 | 0.9013 |
| [mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 256 | 0.8007 |
| [nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 768 | 0.9060 |
| [nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 512 | 0.8573 |
| [nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 256 | 0.7327 |

On DBpedia, the same configurations land slightly lower but follow the same shape: 0.9440 for `mxbai-embed-large-v1` at 1,024 dimensions, 0.8847 for `nomic-embed-text-v1.5` at 768, and 0.8253 for `nomic-embed-text-v1.5` at 512.

Two patterns stand out. First, the result holds across both corpora: at each model's native dimension, recall@10 with rescoring stays above 0.88 on AG News and on DBpedia, so the accuracy is a property of Binary Quantization itself, not of one specific corpus. Second, dimension drives the outcome more than the choice of model or dataset. Recall rises monotonically with dimension for both models, which supports using the highest dimension your model offers.

That trend is a reason to prefer high-dimensional models, but it is not a basis for predicting a specific number at 4,096 dimensions. Recall against a full-precision reference is bounded at 1.0, so the curve has to flatten somewhere past our measurements, and we have no data on where.

#### Impact of Oversampling

The trade-off with oversampling is computational: a higher factor rescores more candidates per query, so each search costs more work. In our experiment, increasing the oversampling factor improved accuracy with diminishing returns at every setting. The first step is by far the largest, adding roughly 17 to 19 points of recall, and each subsequent step adds less.

The returns shrink but have not disappeared by the end of the sweep. Going from 3 to 4 still adds about 2 points at 1,024 dimensions and about 5 points at 256, and because the sweep stops at 4 we cannot say where the curve levels off. A factor of 3 is a reasonable default for high-dimensional vectors, where the remaining headroom is small. At lower dimensions the curve is still climbing, so tune the factor against your own recall target and latency budget rather than treating 3 as settled.

![Line chart of recall@10 against oversampling factor 1 through 4 for six model and dimension configurations, all rising steeply from factor 1 to 2 and then flattening, with higher dimensions consistently above lower ones](/articles_data/optimizing-embeddings-bq/5-oversampling-effect.png)

### Have We Optimized the Embeddings? Evaluating with Ranx

Accuracy alone doesn't tell you whether Binary Quantization is a worthwhile trade-off. To answer that question, we need to measure how close the quantized search results stay to the original, full-precision results across standard ranking metrics.

[Ranx](https://github.com/AmenRa/ranx) is a fast Python library for ranking evaluation and comparison. It computes metrics such as Recall, Mean Reciprocal Rank (MRR), and Normalized Discounted Cumulative Gain (NDCG) at a given cutoff, and it can run statistical significance tests between two result sets. This makes it a natural fit for comparing a binary-quantized run against the original-vector run.

The pattern is straightforward. Treat the results from the original `float32` vectors as the ground truth (the `Qrels`), then score each quantized configuration as a `Run`:

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

To collect the ground-truth run without maintaining a second collection, set `ignore=True` in the quantization search parameters. Qdrant then skips the quantized index and searches the original vectors, so both sides of the comparison come from one collection.

Run this way, the evaluation confirms the optimization on the models we measured. With rescoring and 4x oversampling, recall@10 reaches 0.9713 for `mxbai-embed-large-v1` at its native 1,024 dimensions, while storage for the quantized vectors drops by up to 32x. You keep most of the search quality for a fraction of the memory, with a faster search. That is the optimization we set out to validate.

### Best Practices

We recommend the following best practices for using Binary Quantization with modern text embeddings:

1. **Embedding Model**: Pick a high-dimensional model from the top of the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). Open-source models like `mxbai-embed-large-v1` work well with binary embeddings, and the 1-bit encoding suits models above roughly a thousand dimensions.
2. **Dimensions**: Use the highest dimension available for the model, to maximize accuracy. This mattered more than any other variable we tested.
3. **Bit Depth**: Below roughly a thousand dimensions, try the 2-bit encoding before ruling Binary Quantization out. It represents values near zero explicitly, at 16x compression instead of 32x.
4. **Oversampling and Rescoring**: Enable rescoring and pair it with an oversampling factor above 1, since rescoring a pool the same size as your result limit cannot change what comes back. A factor of 3 is a reasonable starting point.
5. **RAM**: Store the full vectors and payload on disk, and keep the Binary Quantization index in memory with `always_ram`. Note that rescoring reads the original vectors, so on storage with high latency the rescore step can become the bottleneck. Measure it on your own hardware, and consider asymmetric quantization or a lower oversampling factor if latency suffers.

## What's Next?

Binary Quantization works well if you need to handle large volumes of data under high recall expectations. If your embeddings are lower-dimensional, or you want to tune the compression-versus-accuracy trade-off more finely, revisit the [quantization ladder](#the-quantization-ladder-in-qdrant) and consider Scalar Quantization or TurboQuant instead. The [quantization documentation](/documentation/manage-data/quantization/) covers all four methods in detail.

You can try Binary Quantization either by spinning up a [Qdrant container image](https://hub.docker.com/r/qdrant/qdrant) locally, or by having us create one for you through a [free account](https://cloud.qdrant.io/login) in our cloud-hosted service. This article gives examples of datasets and configurations you can use to get going, and our documentation covers [adding large datasets to Qdrant](/documentation/tutorials-develop/bulk-upload/).

Want to discuss these findings and learn more about Binary Quantization? [Join our Discord community](https://discord.gg/qdrant).
