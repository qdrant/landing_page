---
title: "Constella Preview: Swap Query Models Without Re-Embedding"
draft: false
slug: constella-research-preview
short_description: "Constella lets Zero, Nano, and full Stella search one document index. Try the research preview and choose your model per query."
description: "Swap query models without re-embedding documents. Explore Constella Zero, Nano, and Stella, with BEIR-15 results and CPU benchmarks."
preview_image: /blog/constella-research-preview/preview/preview.jpg
social_preview_image: /blog/constella-research-preview/preview/social_preview.jpg
title_preview_image: /blog/constella-research-preview/preview/title.jpg
preview_dir: /blog/constella-research-preview/preview
date: 2026-09-24
author: Dylan Couzon
featured: false
weight: 0
tags:
  - embeddings
  - research
  - semantic search
---

As query traffic grows, so does the compute bill for embedding it. On a low-power device, a large model may not fit in memory. A smaller query model could reduce that cost, but switching usually means re-embedding the collection.

Constella lets you make that switch. It's a [family of models on Hugging Face](https://huggingface.co/Qdrant/constella-nano) built around Stella, a 400M-parameter English embedding model. Stella encodes your documents. Zero, Nano, or Stella itself can then encode your queries, all searching the same Qdrant collection.

We're sharing Constella as a research preview, with results across 15 BEIR datasets.

## One Index, Three Query Models

A document vector can serve thousands of searches. A query vector usually serves one. Constella spends more compute on the document side, where you can reuse the result, and gives you a choice on the query side.

We trained Zero and Nano to reproduce Stella's query embeddings. That's what makes the models hot-swappable: you can change the query encoder per request while the stored document vectors stay fixed.

![Documents pass through Stella once into a Qdrant index. Zero, Nano, and full Stella can each search the same document vectors.](/blog/constella-research-preview/shared-index.svg)

| Query Model | What Runs for Each Query | Where It Fits |
|---|---|---|
| Constella Zero | Token lookup, pooling, and normalization | Minimal query compute |
| Constella Nano | A 34.5M-parameter transformer | Context-aware queries with a small model |
| Full Stella | A 400M-parameter transformer | The highest overall retrieval score in this family |

## Inside Zero and Nano

Zero is a learned bag of tokens: it looks up each token's vector, pools the vectors, and normalizes the result. That's the entire query encoder. It makes search cheap, but loses word order: the same tokens with the same counts produce the same vector, even when rearranging them changes the meaning.

Nano adds context: its transformer models how tokens relate to each other and their positions. It combines features from layers 4, 8, and 12, then projects them into Stella's 1024-dimensional space. We trained it on 199,999,721 examples to match frozen Stella embeddings, with roughly one-twelfth of Stella's parameters. Our [distillation and evaluation harness is on GitHub](https://github.com/Dylancouzon/asymmetric-dual-encoders), including the training code and experiment records.

![Zero pools learned token vectors. Nano uses a 12-layer transformer, combines layers 4, 8, and 12, and projects and pools their features. Both produce a normalized 1024-dimensional query vector in Stella’s space.](/blog/constella-research-preview/model-architecture.svg)

## The Numbers: 15 BEIR Datasets

We evaluated Zero, Nano, and full Stella across BEIR-15, a collection of search tasks covering scientific papers, questions, claims, and other text. Each query model searches the same Stella document vectors.

The table reports exact-search nDCG@10, which measures how well relevant documents rank in the first 10 results. Higher is better. Each dataset has equal weight in the averages; CQADupStack combines its 12 forums into one dataset score. Shading shows each Zero and Nano score as a share of Full Stella's.

<div style="overflow-x: auto; margin: 1.5rem 0;">
<table style="width: 100%; max-width: 640px; margin: 0 auto; border-collapse: collapse; background: #ffffff; color: #161e33; font-variant-numeric: tabular-nums;">
<thead>
<tr style="border-bottom: 2px solid #161e33;">
<th style="padding: 8px 10px; text-align: left;">Dataset</th>
<th style="padding: 8px 10px; text-align: right;">Zero</th>
<th style="padding: 8px 10px; text-align: right;">Nano</th>
<th style="padding: 8px 10px; text-align: right;">Full Stella</th>
</tr>
</thead>
<tbody>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">SciFact</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.6101</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.7211</td><td style="padding: 8px 10px; text-align: right;">0.7796</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">NFCorpus</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.3124</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.3631</td><td style="padding: 8px 10px; text-align: right;">0.4134</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">SCIDOCS</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.1677</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.2177</td><td style="padding: 8px 10px; text-align: right;">0.2395</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">TREC-COVID</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.5490</td><td style="padding: 8px 10px; text-align: right; background: #2f6ff0; color: #ffffff;">0.7871</td><td style="padding: 8px 10px; text-align: right;">0.8234</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">FiQA†</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.3728</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.4778</td><td style="padding: 8px 10px; text-align: right;">0.5536</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">ArguAna†</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.5916</td><td style="padding: 8px 10px; text-align: right; background: #2f6ff0; color: #ffffff;">0.6233</td><td style="padding: 8px 10px; text-align: right;">0.6369</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">FEVER†</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.6978</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.6231</td><td style="padding: 8px 10px; text-align: right;">0.8207</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">DBpedia-entity</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.3900</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.4190</td><td style="padding: 8px 10px; text-align: right;">0.4603</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">CQADupStack</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.3416</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.3859</td><td style="padding: 8px 10px; text-align: right;">0.4448</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">MS MARCO</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.3371</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.4063</td><td style="padding: 8px 10px; text-align: right;">0.4373</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">Natural Questions</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.5173</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.5838</td><td style="padding: 8px 10px; text-align: right;">0.6371</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">HotpotQA</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.6127</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.6102</td><td style="padding: 8px 10px; text-align: right;">0.6950</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">Touché-2020</td><td style="padding: 8px 10px; text-align: right; background: transparent; color: #161e33;">0.2288</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.2755</td><td style="padding: 8px 10px; text-align: right;">0.2980</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">Quora</td><td style="padding: 8px 10px; text-align: right; background: #2f6ff0; color: #ffffff;">0.8504</td><td style="padding: 8px 10px; text-align: right; background: #2f6ff0; color: #ffffff;">0.8805</td><td style="padding: 8px 10px; text-align: right;">0.8912</td></tr>
<tr style="border-top: 1px solid #e1e5f0;"><td style="padding: 8px 10px;">Climate-FEVER†</td><td style="padding: 8px 10px; text-align: right; background: #2f6ff0; color: #ffffff;">0.2785</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.2473</td><td style="padding: 8px 10px; text-align: right;">0.2907</td></tr>
</tbody>
<tfoot>
<tr style="border-top: 1px solid #e1e5f0; border-top: 2px solid #161e33; font-weight: 700;"><td style="padding: 8px 10px;">Average, all 15</td><td style="padding: 8px 10px; text-align: right; background: #d9e2fe; color: #161e33;">0.4572</td><td style="padding: 8px 10px; text-align: right; background: #89a9ff; color: #161e33;">0.5081</td><td style="padding: 8px 10px; text-align: right;">0.5614</td></tr>
</tfoot>
</table>
<p style="max-width: 640px; margin: 10px auto 0; font-size: 14px; color: #576280;">Share of Full Stella's score: <span style="display: inline-flex; align-items: center; gap: 6px; margin-right: 14px;"><span style="width: 14px; height: 14px; border-radius: 3px; background: #ffffff; border: 1px solid #e1e5f0;"></span>Under 80%</span><span style="display: inline-flex; align-items: center; gap: 6px; margin-right: 14px;"><span style="width: 14px; height: 14px; border-radius: 3px; background: #d9e2fe; border: 1px solid #e1e5f0;"></span>80-89%</span><span style="display: inline-flex; align-items: center; gap: 6px; margin-right: 14px;"><span style="width: 14px; height: 14px; border-radius: 3px; background: #89a9ff; border: 1px solid #e1e5f0;"></span>90-94%</span><span style="display: inline-flex; align-items: center; gap: 6px; margin-right: 14px;"><span style="width: 14px; height: 14px; border-radius: 3px; background: #2f6ff0; border: 1px solid #e1e5f0;"></span>95% and up</span></p>
</div>

† **Training-contamination caveat:** Stella reports training or evaluation exposure to these four datasets. Zero and Nano learn from Stella, so treat these scores as a comparison within the family, not a test on entirely unseen data. [Full evaluation details](https://github.com/Dylancouzon/asymmetric-dual-encoders/blob/d56f86d/results/m20_beir15_run.json).

Nano retains about 91% of full Stella's average score across all 15 datasets, with a much smaller query transformer. Zero scores lower overall, but outscores Nano on FEVER, HotpotQA, and Climate-FEVER. The tradeoff varies by workload, which is why the choice of query model is worth testing on your own data.

We recommend pairing Zero with BM25 for hybrid search. Zero gained more from the combination than Nano in our benchmarks, improving retrieval quality without adding a transformer to the query path. Our [Zero model card](https://huggingface.co/Qdrant/constella-zero) includes recommended fusion settings and practical guidance for getting started.

## How Fast Is the Query Side?

On an Apple M5 Pro CPU, full Stella encoded a warm 20-word query in **38.95 ms**. Nano took **3.13 ms**, and Zero took **0.081 ms**. That's about 12 times faster for Nano and 480 times faster for Zero than full Stella.

The table separates model loading, the first query after loading, and warm p50, the median query time.

| Query Encoder | Model Loading | First Query | Warm p50, 20 Words |
|---|---:|---:|---:|
| Zero | 0.334 s | 0.587 ms | 0.081 ms |
| Nano | 0.410 s | 3.935 ms | 3.131 ms |
| Full Stella | 1.301 s | 54.484 ms | 38.952 ms |

![Warm query-encoding latency: Zero 0.081 ms, Nano 3.131 ms, and full Stella 38.952 ms. Lower is better.](/blog/constella-research-preview/query-latency.svg)

We measured all three with FastEmbed and ONNX Runtime on CPU, using four threads and batch size one. Values are medians across three fresh processes, each with five warmups and 20 synthetic 20-word queries. Stella receives its required query instruction in addition to those 20 words. These are encoding times; Qdrant search and network time are additional.

Loading includes imports and local model initialization, with assets already downloaded and the operating system's disk cache left intact. Keep models loaded to avoid paying startup costs when switching. The [raw timings and full protocol](/blog/constella-research-preview/serving-benchmark.json) are available to inspect.

## What You Can Build With It

- **Offline search on low-power devices.** Encode manuals or a knowledge base with Stella on a server, then ship Zero or Nano with the vectors. Search locally, even without a connection.
- **High-volume retrieval APIs.** Use Zero to reduce query-encoding compute, with Nano or Stella available for workloads where their relevance gain justifies the cost. All three search the same collection.
- **Search as you type.** Use Zero for queries on each keystroke, then Nano when the user pauses or submits. Our local Pokémon demo uses this pattern.
- **Agents that search repeatedly.** An agent may retrieve repeatedly before answering. Try Zero or Nano for those intermediate searches to reduce the time spent encoding queries.
- **Hybrid search without a transformer.** Pair Zero with BM25 to find related concepts alongside exact terms across your content. Combine both result sets in Qdrant without running a transformer for each query.

## Try Constella

It's a standard Qdrant + FastEmbed setup: embed your documents, store the vectors, and query the collection. The [models are on Hugging Face](https://huggingface.co/Qdrant/constella-nano), and native FastEmbed support is available on the [research-preview branch](https://github.com/Dylancouzon/fastembed/tree/constella-research-preview).

Install the preview:

```bash
pip install "fastembed @ git+https://github.com/Dylancouzon/fastembed.git@constella-research-preview" qdrant-client
```

Create a collection and encode your documents once with Stella:

```python
from fastembed import TextEmbedding
from qdrant_client import QdrantClient, models

client = QdrantClient(":memory:")
client.create_collection(
    "documents",
    vectors_config=models.VectorParams(
        size=1024, distance=models.Distance.COSINE
    ),
)

documents = [
    "Solar panels convert sunlight into electricity.",
    "Wind turbines generate electricity from moving air.",
]
stella = TextEmbedding("Qdrant/stella-en-400M-v5-doc-onnx")
vectors = stella.embed(documents)
client.upsert(
    "documents",
    points=[
        models.PointStruct(
            id=i, vector=vector.tolist(), payload={"text": text}
        )
        for i, (text, vector) in enumerate(zip(documents, vectors))
    ],
)
```

Now choose your query model. To switch from Zero to Nano, change **one model name**:

```python
# Or use Qdrant/constella-nano.
query_model = TextEmbedding("Qdrant/constella-zero")
query = "How can we get energy from the sun?"
query_vector = next(query_model.embed([query]))

results = client.query_points(
    "documents", query=query_vector.tolist(), limit=2
).points
for result in results:
    print(result.payload["text"])
```

Same collection. Same query code. The stored document vectors stay exactly where they are. See the [model card](https://huggingface.co/Qdrant/constella-nano#usage) for the supported query paths.

## What's Next

Constella is in internal review ahead of a full release. This research preview is a chance to try the models and help shape what comes next. We'd love to hear where they work, where they fall short, and what you build with them. Share your feedback and what you build in our [Discord community](https://discord.gg/qdrant).
