---
title: "Optimizing Text Embeddings: Enhance Efficiency with Qdrant's Binary Quantization"
draft: false
slug: binary-quantization-openai
short_description: Use Qdrant's Binary Quantization to enhance modern text embeddings
description: Explore how Qdrant's Binary Quantization can significantly improve the efficiency and performance of modern text embedding models. Learn best practices for real-time search applications.
preview_dir: /articles_data/binary-quantization-openai/preview
preview_image: /articles-data/binary-quantization-openai/Article-Image.png
small_preview_image: /articles_data/binary-quantization-openai/icon.svg
social_preview_image: /articles_data/binary-quantization-openai/preview/social-preview.png
title_preview_image: /articles_data/binary-quantization-openai/preview/preview.webp

date: 2026-06-30T13:12:08-08:00
author: Nirant Kasliwal
author_link: https://nirantk.com/about/

featured: false
tags:
  - text embeddings
  - embedding models
  - binary quantization
weight: 40

aliases: [ /blog/binary-quantization-openai/ ]
category: search-quality
---

Modern text embedding models are a powerful tool for natural language processing (NLP). However, the size of these embeddings is a challenge, especially with real-time search and retrieval. In this article, we explore how you can use Qdrant's Binary Quantization to enhance the performance and efficiency of the latest text embeddings. 

In this post, we discuss:

- The latest text embedding models and benchmarks such as MTEB and MIRACL
- Qdrant's Binary Quantization, and how it can improve the performance of text embeddings
- Results of an experiment that highlights improvements in search efficiency and accuracy
- Implications of these findings for real-world applications
- How to validate the optimization with the Ranx evaluation library
- Best practices for leveraging Binary Quantization to enhance text embeddings

If you're new to Binary Quantization, consider reading our article which walks you through the concept and [how to use it with Qdrant](/articles/binary-quantization/)

You can also try out these techniques as described in [Binary Quantization OpenAI](https://github.com/qdrant/examples/blob/openai-3/binary-quantization-openai/README.md), which includes Jupyter notebooks.

## The latest text embedding models

Text embedding models have advanced rapidly, and the field is no longer dominated by a single provider. You can now choose from a wide range of high-quality models, both commercial and open-source, that top benchmarks such as [MTEB](https://huggingface.co/spaces/mteb/leaderboard) and [MIRACL](https://openai.com/blog/new-embedding-models-and-api-updates). Many support over 100 languages and let you pick from several embedding sizes.

Because the rankings change constantly, the best way to stay current is to check the live [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) before committing to a model. As of mid-2026, the top three models on the MTEB Multilingual leaderboard are:

| Rank | Model | Embedding Dim | Max Tokens | MTEB Mean |
|-|-|-|-|-|
| 1 | [microsoft/harrier-oss-v1-27b](https://huggingface.co/microsoft/harrier-oss-v1-27b) | 5376 | 131,072 | 74.27 |
| 2 | [tencent/KaLM-Embedding-Gemma3-12B-2511](https://huggingface.co/tencent/KaLM-Embedding-Gemma3-12B-2511) | 3840 | 32,768 | 72.32 |
| 3 | [nvidia/llama-embed-nemotron-8b](https://huggingface.co/nvidia/llama-embed-nemotron-8b) | 4096 | 32,768 | 69.46 |

These leaders are large, high-accuracy models that produce high-dimensional vectors, which is exactly the case where binary quantization pays off most: each vector is expensive to store and search, so compressing it has a large impact.

## Enhanced performance and efficiency with binary quantization

#### How binary quantization works

Suppose your embedding looks like this:

```
[0.24, -0.91, 1.32, -0.02, 0.67, ...]
```

Every value is normally stored as a 32-bit floating-point number. For a 3072-dimensional embedding, that adds up quickly:

```
3072 values × 32 bits
≈ 98,304 bits
≈ 12 KB
```

Now imagine you have 100 million documents:

```
12 KB × 100,000,000
≈ 1.2 TB
```

That's just the vectors, not the index or metadata. At this scale, memory becomes one of your biggest infrastructure costs.

Binary quantization tackles this by replacing each floating-point value with a single bit: positive values become `1`, and negative values become `0`. So instead of storing:

```
[0.24, -0.91, 1.32, -0.02]
```

you store:

```
[1, 0, 1, 0]
```

Each dimension now costs 1 bit instead of 32 bits, which gives roughly a 32x reduction in storage for the quantized representation.

The accompanying chart shows the best accuracy achieved with binary quantization across two Matryoshka-trained models, `mxbai-embed-large-v1` and `nomic-embed-text-v1.5`, measured as recall@10 against full-precision search. At each model's native dimension, binary quantization preserves search quality remarkably well: `mxbai-embed-large-v1` holds 0.9713 at 1024 dimensions, and `nomic-embed-text-v1.5` holds 0.9060 at 768 dimensions. Accuracy declines as the vectors are truncated more aggressively, falling to roughly 0.80 and 0.73 at 256 dimensions, which tells you where the storage-versus-precision trade-off starts to bite. 

One caveat about scope: the largest models such as `harrier-oss-v1` at 27B parameters or `llama-embed-nemotron` at 8B, need far more memory than was available, so they aren't plotted here. 

<img width="1932" height="1036" alt="image-1782831348422" src="https://github.com/user-attachments/assets/5a4e78a9-19ac-4ced-848c-f9afae5597b0" />

The efficiency gains from Binary Quantization are as follows: 

- Reduced storage footprint: It helps with large-scale datasets. It also saves on memory, and scales up to 30x at the same cost. 
- Enhanced speed of data retrieval: Smaller data sizes generally leads to faster searches. 
- Accelerated search process: It is based on simplified distance calculations between vectors to bitwise operations. This enables real-time querying even in extensive databases.

#### Matryoshka representation learning

Many of the latest models, including OpenAI text-embedding-3, mixedbread mxbai-embed-large-v1, Nomic nomic-embed-text-v1.5, and EmbeddingGemma, are trained with a technique called "[Matryoshka Representation Learning](https://aniketrege.github.io/blog/2024/mrl/)". Developers can set up embeddings of different sizes (number of dimensions) and select the one that balances accuracy and size. For example, mxbai-embed-large-v1 keeps over 93% of its performance at 512 dimensions, and nomic-embed-text-v1.5 supports any size between 64 and 768.

Because Matryoshka models concentrate the most important information in the earlier dimensions, they pair well with binary quantization: you first trim the vector to the smallest dimension your recall target allows, then quantize each remaining dimension to a single bit. Later in this article, we show that the accuracy of binary quantization stays high across different dimensions.

OpenAI's text-embedding-3 models remain a strong commercial option. The transition from text-embedding-ada-002 to text-embedding-3-large brought a significant jump in performance, from 31.4% to 54.9% on MIRACL. But if you'd rather avoid a paid API, the open-source ecosystem has caught up. The table below lists popular choices that support flexible dimensions or binary embeddings, several with Matryoshka truncation out of the box. For a deeper comparison, see [a guide to open-source embedding models](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models) and our own article on [how to choose an embedding model](/articles/how-to-choose-an-embedding-model/).

| Model | Dimensions | Max Tokens | Matryoshka |
|-|-|-|-|
| [OpenAI text-embedding-3-large](https://openai.com/blog/new-embedding-models-and-api-updates) | 256-3072 | 8191 | Yes |
| [mixedbread mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | 1024 (down to 512, 256) | 512 | Yes |
| [Nomic nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | 64-768 | 8192 | Yes |
| [EmbeddingGemma-300M](https://huggingface.co/google/embeddinggemma-300m) | 768 (down to 512, 256, 128) | 2048 | Yes |
| [Jina Embeddings v4](https://huggingface.co/jinaai/jina-embeddings-v4) | 2048 (down to 128) | long-context | Yes |
| [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | 32-1024 (user-defined) | long-context | No |
| [BGE-M3](https://huggingface.co/BAAI/bge-m3) | 1024 | 8192 | No |

These models cover the common use cases for embeddings: semantic search, retrieval-augmented generation, clustering, classification, and recommendation. Whichever you choose, the same challenge applies: high-dimensional embeddings are expensive to store and search at scale. That's where binary quantization helps.


**Flexible embedding dimensions:** Through MRL, [EmbeddingGemma-300M](https://huggingface.co/google/embeddinggemma-300m) supports output truncation from 768 → 512 → 256 → 128 dimensions, which is helpful for trading off storage versus precision. The same flexibility is available in mxbai-embed-large-v1 (1024 → 512 → 256), nomic-embed-text-v1.5 (any size from 64 to 768), and OpenAI text-embedding-3 (256 to 3072). Models without MRL, such as BGE-M3, produce a fixed-size vector that you can't safely truncate, so binary quantization is your main lever for shrinking them.

## Choosing an embedding benchmark: MTEB and  MIRACL

A high leaderboard score is only meaningful if the benchmark matches your use case. The three benchmarks referenced most often measure different things, so pick the one that reflects the language and task you care about.

- **MTEB (Massive Text Embedding Benchmark)**: Use it when you need a broad, general-purpose view of a model. MTEB spans more than 50 datasets across 8 task types, including retrieval, classification, clustering, reranking, and semantic textual similarity. It's the right starting point when your application mixes several of these tasks, or when you want a single overall ranking. Note that its coverage is heavily English, so a top MTEB score doesn't guarantee strong performance in other languages.

- **MIRACL (Multilingual Information Retrieval Across a Continuum of Languages)**: Use it when your primary task is retrieval in non-English or multilingual content. MIRACL focuses purely on retrieval across 18 languages built from Wikipedia, so it's the benchmark to check before deploying search or retrieval-augmented generation for a global audience. Because it's Wikipedia-based, validate on your own domain if your content is far from encyclopedic text.


In short: start with MTEB for a general sense of quality, switch to MIRACL when multilingual retrieval is the goal. Whichever benchmark you use, run a final check on a sample of your own data, since no public benchmark perfectly matches a production workload. For a deeper look at this process, see our article on [how to choose an embedding model](/articles/how-to-choose-an-embedding-model/).



### Experiment setup: OpenAI embeddings in focus

To identify Binary Quantization's impact on search efficiency and accuracy, we designed our experiment on OpenAI text-embedding models. These models, which capture nuanced linguistic features and semantic relationships, are the backbone of our analysis. We then delve deep into the potential enhancements offered by Qdrant's Binary Quantization feature.

This approach not only leverages the high-caliber OpenAI embeddings but also provides a broad basis for evaluating the search mechanism under scrutiny. We use OpenAI text-embedding-3 here as a concrete case study, but the same findings apply to the other Matryoshka-trained models listed before, since binary quantization operates on the vectors themselves rather than on any one provider's model.

#### Dataset

 The research employs 100K random samples from the [OpenAI 1M](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) 1M dataset, focusing on 100 randomly selected records. These records serve as queries in the experiment, aiming to assess how Binary Quantization influences search efficiency and precision within the dataset. We then use the embeddings of the queries to search for the nearest neighbors in the dataset. 

#### Parameters: oversampling, rescoring, and search limits

For each record, we run a parameter sweep over the number of oversampling, rescoring, and search limits. We can then understand the impact of these parameters on search accuracy and efficiency. Our experiment was designed to assess the impact of Binary Quantization under various conditions, based on the following parameters: 

- **Oversampling**: By oversampling, we can limit the loss of information inherent in quantization. This also helps to preserve the semantic richness of your OpenAI embeddings. We experimented with different oversampling factors, and identified the impact on the accuracy and efficiency of search. Spoiler: higher oversampling factors tend to improve the accuracy of searches. However, they usually require more computational resources.

- **Rescoring**: Rescoring refines the first results of an initial binary search. This process leverages the original high-dimensional vectors to refine the search results, **always** improving accuracy. We toggled rescoring on and off to measure effectiveness, when combined with Binary Quantization. We also measured the impact on search performance. 

- **Search Limits**: We specify the number of results from the search process. We experimented with various search limits to measure their impact the accuracy and efficiency. We explored the trade-offs between search depth and performance. The results provide insight for applications with different precision and speed requirements.

Through this detailed setup, our experiment sought to shed light on the nuanced interplay between Binary Quantization and the high-quality embeddings produced by OpenAI's models. By meticulously adjusting and observing the outcomes under different conditions, we aimed to uncover actionable insights that could empower users to harness the full potential of Qdrant in combination with OpenAI's embeddings, regardless of their specific application needs.

### Results: binary quantization's impact on OpenAI embeddings

To analyze the impact of rescoring (`True` or `False`), we compared results across different model configurations and search limits. Rescoring sets up a more precise search, based on results from an initial query.

#### Rescoring

![Graph that measures the impact of rescoring](/blog/openai/Rescoring_Impact.png)

Here are some key observations, which analyzes the impact of rescoring (`True` or `False`):

1. **Significantly Improved Accuracy**:
   - Across all models and dimension configurations, enabling rescoring (`True`) consistently results in higher accuracy scores compared to when rescoring is disabled (`False`).
   - The improvement in accuracy is true across various search limits (10, 20, 50, 100).

2. **Model and Dimension Specific Observations**:
   - For the `text-embedding-3-large` model with 3072 dimensions, rescoring boosts the accuracy from an average of about 76-77% without rescoring to 97-99% with rescoring, depending on the search limit and oversampling rate.
    - The accuracy improvement with increased oversampling is more pronounced when rescoring is enabled, indicating a better utilization of the additional binary codes in refining search results.
   - With the `text-embedding-3-small` model at 512 dimensions, accuracy increases from around 53-55% without rescoring to 71-91% with rescoring, highlighting the significant impact of rescoring, especially at lower dimensions.

In contrast, for lower dimension models (such as text-embedding-3-small with 512 dimensions), the incremental accuracy gains from increased oversampling levels are less significant, even with rescoring enabled. This suggests a diminishing return on accuracy improvement with higher oversampling in lower dimension spaces.

3. **Influence of Search Limit**:
   - The performance gain from rescoring seems to be relatively stable across different search limits, suggesting that rescoring consistently enhances accuracy regardless of the number of top results considered.

In summary, enabling rescoring dramatically improves search accuracy across all tested configurations. It is crucial feature for applications where precision is paramount. The consistent performance boost provided by rescoring underscores its value in refining search results, particularly when working with complex, high-dimensional data like OpenAI embeddings. This enhancement is critical for applications that demand high accuracy, such as semantic search, content discovery, and recommendation systems, where the quality of search results directly impacts user experience and satisfaction.

### Dataset combinations

For those exploring the integration of text embedding models with Qdrant, it's crucial to consider various model configurations for optimal performance. The dataset combinations defined above illustrate different configurations to test against Qdrant. These combinations vary by two primary attributes:

1. **Model Name**: Signifying the specific text embedding model variant, such as "text-embedding-3-large" or "text-embedding-3-small". This distinction correlates with the model's capacity, with "large" models offering more detailed embeddings at the cost of increased computational resources.

2. **Dimensions**: This refers to the size of the vector embeddings produced by the model. Options range from 512 to 3072 dimensions. Higher dimensions could lead to more precise embeddings but might also increase the search time and memory usage in Qdrant.

Optimizing these parameters is a balancing act between search accuracy and resource efficiency. Testing across these combinations allows users to identify the configuration that best meets their specific needs, considering the trade-offs between computational resources and the quality of search results.


```python
dataset_combinations = [
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 3072,
    },
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 1024,
    },
    {
        "model_name": "text-embedding-3-large",
        "dimensions": 1536,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 512,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 1024,
    },
    {
        "model_name": "text-embedding-3-small",
        "dimensions": 1536,
    },
]
```
#### Exploring dataset combinations and their impacts on model performance 

The code snippet iterates through predefined dataset and model combinations. For each combination, characterized by the model name and its dimensions, the corresponding experiment's results are loaded. These results, which are stored in JSON format, include performance metrics like accuracy under different configurations: with and without oversampling, and with and without a rescore step.

Following the extraction of these metrics, the code computes the average accuracy across different settings, excluding extreme cases of very low limits (specifically, limits of 1 and 5). This computation groups the results by oversampling, rescore presence, and limit, before calculating the mean accuracy for each subgroup.

After gathering and processing this data, the average accuracies are organized into a pivot table. This table is indexed by the limit (the number of top results considered), and columns are formed based on combinations of oversampling and rescoring.

```python
import pandas as pd

for combination in dataset_combinations:
    model_name = combination["model_name"]
    dimensions = combination["dimensions"]
    print(f"Model: {model_name}, dimensions: {dimensions}")
    results = pd.read_json(f"../results/results-{model_name}-{dimensions}.json", lines=True)
    average_accuracy = results[results["limit"] != 1]
    average_accuracy = average_accuracy[average_accuracy["limit"] != 5]
    average_accuracy = average_accuracy.groupby(["oversampling", "rescore", "limit"])[
        "accuracy"
    ].mean()
    average_accuracy = average_accuracy.reset_index()
    acc = average_accuracy.pivot(
        index="limit", columns=["oversampling", "rescore"], values="accuracy"
    )
    print(acc)
```

Here is a selected slice of these results, with `rescore=True`:

|Method|Dimensionality|Test Dataset|Recall|Oversampling|
|-|-|-|-|-|
|OpenAI text-embedding-3-large (highest MTEB score from the table) |3072|[DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) | 0.9966|3x|
|OpenAI text-embedding-3-small|1536|[DBpedia 100K](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K)| 0.9847|3x|
|OpenAI text-embedding-3-large|1536|[DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-1M)| 0.9826|3x|

#### Impact of oversampling

You can use oversampling in machine learning to counteract imbalances in datasets.
It works well when one class significantly outnumbers others. This imbalance
can skew the performance of models, which favors the majority class at the
expense of others. By creating additional samples from the minority classes,
oversampling helps equalize the representation of classes in the training dataset, thus enabling more fair and accurate modeling of real-world scenarios.

The screenshot showcases the effect of oversampling on model performance metrics. While the actual metrics aren't shown, we expect to see improvements in measures such as precision, recall, or F1-score. These improvements illustrate the effectiveness of oversampling in creating a more balanced dataset. It allows the model to learn a better representation of all classes, not just the dominant one.

Without an explicit code snippet or output, we focus on the role of oversampling in model fairness and performance. Through graphical representation, you can set up before-and-after comparisons. These comparisons illustrate the contribution to machine learning projects.

![Measuring the impact of oversampling](/blog/openai/Oversampling_Impact.png)

### Have we optimized the embeddings? Evaluating with Ranx

Accuracy alone doesn't tell you whether binary quantization is a worthwhile trade-off. To answer "have we actually optimized the embeddings?", we need to measure how close the quantized search results stay to the original, full-precision results across standard ranking metrics.

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

Run this way, the evaluation confirms the optimization. With rescoring enabled, the binary-quantized run recovers the original ranking almost exactly: recall stays at roughly 0.98-0.99 for `text-embedding-3-large` at 1536 and 3072 dimensions, while storage drops by up to 32x. In other words, you keep nearly all of the search quality for a fraction of the memory and a faster search. That is the optimization we set out to validate.

### Leveraging binary quantization: best practices

We recommend the following best practices for leveraging Binary Quantization to enhance OpenAI embeddings:

1. Embedding Model: Pick a high-dimensional model from the top of the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard). In our tests, text-embedding-3-large was the most accurate, and open-source models like mxbai-embed-large-v1 are strong alternatives that also support binary embeddings.
2. Dimensions: Use the highest dimension available for the model, to maximize accuracy. The results are true for English and other languages.
3. Oversampling: Use an oversampling factor of 3 for the best balance between accuracy and efficiency. This factor is suitable for a wide range of applications.
4. Rescoring: Enable rescoring to improve the accuracy of search results.
5. RAM: Store the full vectors and payload on disk. Limit what you load from memory to the binary quantization index. This helps reduce the memory footprint and improve the overall efficiency of the system. The incremental latency from the disk read is negligible compared to the latency savings from the binary scoring in Qdrant, which uses SIMD instructions where possible.

## Binary quantization vs other quantization methods

Binary quantization is the most aggressive of the methods Qdrant supports, but it isn't the only option. Choosing the right method is a trade-off between memory, accuracy, and speed.

| Method | Compression | Accuracy Impact | Speed | Best For |
|-|-|-|-|-|
| [Scalar quantization](/articles/scalar-quantization/) | 4x | Minimal, usually under 1% error | Fast, SIMD-accelerated | A safe default that balances storage and accuracy |
| [Product quantization](/articles/product-quantization/) | Up to 64x | Moderate to significant | Slowest, not SIMD-friendly | Extreme memory limits where accuracy and speed are secondary |
| Binary quantization | Up to 32x | Significant without rescoring, near-lossless with it | Fastest, up to 40x faster search | High-dimensional models, such as OpenAI text-embedding-3, where speed and storage both matter |

A few practical guidelines:

- **Scalar quantization** is the most forgiving choice. It maps float32 values to `uint8` for a 4x reduction with little accuracy loss, so it's a reliable starting point when you're unsure.
- **Product quantization** delivers the largest compression but is the slowest and loses the most accuracy. Reserve it for cases where memory footprint is the only thing that matters.
- **Binary quantization** shines with high-dimensional embeddings. The accuracy gap closes almost entirely once you enable rescoring and oversampling, as the experiment above shows, while you still gain 32x storage savings and the fastest search. For very low-dimensional models, the recall loss is harder to recover, so scalar quantization may serve you better.

For the full configuration details on each method, see the [quantization documentation](/documentation/manage-data/quantization/).

## What's next?

Binary quantization is exceptional if you need to work with large volumes of data under high recall expectations. If you would like to learn about other quantization methods check the article about [scalar quantization](https://qdrant.tech/articles/scalar-quantization/) and [product quantization](https://qdrant.tech/articles/product-quantization/). You can try binary quantization feature either by spinning up a [Qdrant container image](https://hub.docker.com/r/qdrant/qdrant) locally or, having us create one for you through a [free account](https://cloud.qdrant.io/login) in our cloud hosted service. 

The article gives examples of data sets and configuration you can use to get going. Our documentation covers [adding large datasets to Qdrant](/documentation/tutorials-develop/bulk-upload/) to your Qdrant instance as well as [more quantization methods](/documentation/manage-data/quantization/). 

Want to discuss these findings and learn more about Binary Quantization? [Join our Discord community.](https://discord.gg/qdrant) 
