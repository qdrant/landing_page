---
draft: false
title: "Embedding at the Speed of Light"
short_description: "Static embedding models in FastEmbed: how they work, how fast they run, and the retrieval tradeoffs."
description: "How static embedding models turn tokenization into the only bottleneck, how we embedded 32.9M passages in 35 minutes on a laptop CPU with FastEmbed, and what you give up in recall."
social_preview_image: /articles_data/embedding-at-the-speed-of-light/preview/social_preview.jpg
preview_dir: /articles_data/embedding-at-the-speed-of-light/preview
weight: 1
author: Clelia Bertelli, Stephan Tulkens
date: 2026-11-04T00:00:00Z
keywords:
  - static embeddings
  - fastembed
  - model2vec
  - potion
  - miracl
category: embedding-research
---
Anyone who has worked with vector search knows how slow embedding inference can be: transformer-based models capture semantics very well, but they are heavy on CPU, so you either wait days for a large corpus to be embedded or pay for a costly GPU.

Static embedding models were designed to solve exactly this problem. They are usually trained or distilled from transformer-based models, but the result is very different: a lookup table that associates each token in the model's vocabulary with an embedding, with no neural network to run at inference time. Later in the article, we look at how much faster this makes inference.

Inspired by the work of the team at [MinishLabs](https://minish.ai/), the makers of [model2vec](https://github.com/minishlab/model2vec) and of the [`potion`](https://huggingface.co/collections/minishlab/potion) series of static embedding models, we added static embedding support to [FastEmbed](https://github.com/qdrant/fastembed). In this article, we cover what static embeddings are, how fast we can make them run, and which tradeoffs come with them.

## So: What _Is_ a Static Embedding Model?

At first glance, a static embedding model does not look very different from a transformer-based one: both ship their weights as long arrays of bytes, often saved in the same format ([`safetensors`](https://github.com/huggingface/safetensors)). The difference, as we briefly touched upon above, is the meaning of those weights: in a transformer-based model they encode the neural network, while in a static one they encode the embedding associated with each token in the model's vocabulary.

To see how this works, start with datatypes: like every other model, a static embedding model stores its weights with a given datatype (`f32`, `f16`, [`bf16`](https://en.wikipedia.org/wiki/Bfloat16_floating-point_format), all the way down to `u8`), which determines how many bits (the precision) represent each number. In our example, we use the mainstream choice: `f32`, a full-precision floating point number that takes 32 bits (4 bytes). When we read the model tensor from the `safetensors` file, we decode each weight by taking 4 contiguous bytes and reading them as an `f32` (in Rust, you would use [`f32::from_le_bytes`](https://doc.rust-lang.org/std/primitive.f32.html#method.from_le_bytes)).

Decoding a single weight is not enough, though: embeddings usually have hundreds of dimensions, so we need to read as many weights as the model's output dimension (let's assume 256). At this point we know how to read weights into a vector, but we still need to associate vectors with tokens and produce a final 256-dimensional vector for the whole text.

To do that, we use a [tokenizer](https://github.com/huggingface/tokenizers), which transforms text into token IDs; we then use each ID to locate the embedding of that token within the model bytes. The position of the embedding is `DATATYPE_BYTES x DIMENSIONS x TOKEN_ID`, so a token with ID 73 starts at byte `4 x 256 x 73 = 74,752` of the tensor. Given a token ID, we can therefore decode its embedding by reading `DIMENSIONS x DATATYPE_BYTES` bytes into `f32` values.

A text can contain hundreds of tokens: if each of them gets its own embedding, how do we get to a single vector? You guessed it: mean pooling, which means averaging the token vectors position by position. We can then apply an optional [L2 normalization](https://en.wikipedia.org/wiki/Norm_(mathematics)#Euclidean_norm) step, which scales the vector to unit length, and that is all it takes to produce the final embedding.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/inference"
    width="760" ratio="760 / 330"
    title="From text to one vector: tokenize, read one embedding row per token ID, mean pool, and normalize. Token IDs are illustrative, except ID 73 from the example above. Select a token to see where its row starts."
>}}
![A static embedding model tokenizes "vector search is fast" into four token IDs, reads one embedding row per ID from the weight table at the offset 4 bytes x 256 dimensions x ID, averages the four rows into one vector with mean pooling, and scales it to unit length.](/articles_data/embedding-at-the-speed-of-light/inference.svg)
{{< /island >}}

## Making Static Models Go Brr

As the previous section suggests, static embedding models are much faster than transformer-based ones: locating a token, decoding its weights into an `f32` vector, and mean pooling the results are all cheap operations, to the point where tokenization itself is often the bottleneck.

In our previous FastEmbed implementation, we ran static models through [ONNX Runtime](https://onnxruntime.ai/), the same way we run transformer-based models. ONNX Runtime is an excellent runtime for neural networks, but the graph optimizations it applies under the hood add substantial overhead to an inference step that only performs a table lookup.

Inspired by `model2vec` and by some [experiments with Rust](https://github.com/AstraBert/statembed), we decided to port the inference to pure `numpy` operations. A few optimizations are worth calling out:

- **Custom tensor reading, with no `safetensors` dependency:** we read the header size from the first 8 bytes of the file, parse the header as JSON to find the region that holds the weights and their datatype, and then load that region, optionally through [`mmap`](https://en.wikipedia.org/wiki/Mmap), all with `numpy`.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/safetensors-layout"
    width="760" ratio="760 / 250"
    title="A safetensors file is three regions: the header size, a JSON header, and the weight bytes. Select a step to see which region it reads."
>}}
![A safetensors file holds 8 bytes with the header size N, then N bytes of JSON header, then the raw weight bytes.](/articles_data/embedding-at-the-speed-of-light/safetensors-layout.svg)
{{< /island >}}

- **No padding:** ONNX models generally pad every batch to its longest text, while here we keep the token IDs in one flat array plus a lengths array, built from numpy views over the tokenizer output, which avoids that extra work.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/batching"
    width="760" ratio="760 / 240"
    title="The same three texts as a padded batch and as a flat array with a lengths array. Select a layout to compare the slots each one uses."
>}}
![Three texts of 5, 3, and 2 tokens take 15 slots when padded, 5 of them padding, and 10 slots in a flat array.](/articles_data/embedding-at-the-speed-of-light/batching.svg)
{{< /island >}}

- **Pooling as a single matrix product:** we build a `documents x distinct tokens` count matrix and multiply it with the embedding rows of those tokens (`counts @ embeddings[distinct_rows]`), which means one matrix multiplication per batch instead of a loop over documents; each distinct token row is fetched once per batch, and the temporary memory is capped to avoid out-of-memory errors.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/pooling"
    width="760" ratio="760 / 310"
    title="Mean pooling for a whole batch as one matrix product. Select a text to see which embedding rows it uses."
>}}
![A count matrix of documents by distinct tokens multiplied by the embedding rows of those tokens gives one summed vector per document, which is divided by the text length.](/articles_data/embedding-at-the-speed-of-light/pooling.svg)
{{< /island >}}


But the main speedup did not come from `numpy` itself: as mentioned, static embedding inference is so cheap that tokenization becomes the bottleneck. In [an experimental branch](https://github.com/qdrant/fastembed/pull/807), we migrated from `tokenizers` v0.x to the v1 pre-release and, according to [Hugging Face's own benchmarks](https://huggingface-tokenizers-v1.static.hf.space/index.html), v1 is substantially faster; as you can read in the PR, it more than doubled throughput (from 18K to 40K docs/s on FiQA with [`potion-base-8M`](https://huggingface.co/minishlab/potion-base-8M)) and cut the p50 latency of a single query by more than half (from 39 µs to 14 µs, also on FiQA).

These numbers are nice, but FiQA is a relatively small dataset (57K documents), and we promised at the beginning that static embeddings could help with _massive_ datasets, so we tested that too.

### 32.9M Embeddings in 35 Minutes

We chose the English corpus of [MIRACL](https://huggingface.co/datasets/miracl/miracl-corpus), which contains 32,893,221 passages. To give a sense of how long a transformer-based model would need, we tested [`stella_en_400M_v5`](https://huggingface.co/NovaSearch/stella_en_400M_v5) through its [ONNX export](https://huggingface.co/Qdrant/stella-en-400M-v5-doc-onnx) in FastEmbed: it delivered 7 docs/s on a MacBook Pro with an M4 Max, 14 cores, and 48 GiB of unified memory, so it would have needed about 53 days to embed the entire dataset.

To load the entire dataset into Qdrant with static embeddings on the same hardware, we needed 9 to 11 hours in total, but the share of that time spent on embedding was remarkably low: 35 minutes for `potion-base-8M`, 38 for `potion-retrieval-32M`, and 47 for `potion-multilingual-128M`, which corresponds to roughly 11K to 15K docs/s. The rest was mostly network transfer and ingestion time.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/time-breakdown"
    width="760" ratio="760 / 350"
    title="Where the loading time went for 32,893,221 passages: embedding is under 9% of the total, upload through the network and Qdrant ingestion is the rest. Select a view to switch between hours and share of total."
>}}
![Stacked bars of embedding time and upload and ingestion time for three potion models: embedding takes 35, 38, and 47 minutes out of 8.9, 10.8, and 9.2 hours.](/articles_data/embedding-at-the-speed-of-light/time-breakdown.svg)
{{< /island >}}

These numbers are fantastic but, before you add a static embedding model to your search pipeline, stay with us for one more section: as always in computer science, there are tradeoffs.

## Tradeoffs, and Maybe a Solution?

The recall@10 numbers for static embedding models are not particularly high:

{{< chart id="static-embeddings/recall-at-10" caption="Recall@10 on MIRACL English: potion-retrieval-32M reaches 39.9%, and adding BM25 lifts potion-base-8M from 15.8% to 30.9%." >}}

The best model, `potion-retrieval-32M`, which was tuned for retrieval, scores 39.9%, which is not acceptable for many production settings. These numbers represent dense retrieval only, and a hybrid pipeline can help (with `potion-base-8M` plus [BM25](https://en.wikipedia.org/wiki/Okapi_BM25), recall@10 rose from 15.8% to 30.9%), but the distance to an acceptable recall of 90% or more is still large.

While static embedding models will likely improve, we have been working on an interesting alternative at Qdrant: [`constella`](https://huggingface.co/Qdrant/constella-nano), a family of models derived from the [`stella_en_400M_v5`](https://huggingface.co/NovaSearch/stella_en_400M_v5) encoder mentioned above, which brings zero compute at query time. A larger model like stella creates the document embeddings, and a much smaller one, [`constella-zero`](https://huggingface.co/Qdrant/constella-zero), produces query embeddings from a lookup table, which is essentially the same mechanism as static embeddings. This does not solve the problem of re-embedding massive datasets, but it significantly speeds up query serving, so you can think of it as a middle ground. You can read more about constella [here](https://qdrant.tech/blog/constella-research-preview/).

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/constella"
    width="760" ratio="760 / 430"
    title="Two ways to embed text: stella runs a transformer on every text, constella-zero reads rows from a lookup table. Select a model to highlight its path."
>}}
![Schematic: stella_en_400M_v5 passes the tokens of every text through a neural network to produce a vector, while constella-zero reads one row per token from a lookup table and pools them.](/articles_data/embedding-at-the-speed-of-light/constella.svg)
{{< /island >}}


## Should You Go Static?

Static embedding models turn the embedding step from the slowest part of an indexing pipeline into a rounding error: we embedded 32.9 million passages in 35 to 47 minutes on a laptop CPU, against the roughly 53 days a transformer-based model would have needed, and most of the time that remained went into moving vectors over the network. That speed comes at a price in retrieval quality, so they are not a drop-in replacement for a good transformer-based model; they shine when embedding volume or hardware is the real constraint.

They are a good fit if you have to embed tens of millions of documents, if you re-embed often (to compare models, for example), or if you run on CPU-only machines, ideally as a cheap first-stage retriever paired with hybrid search. If quality comes first, a transformer on the document side is still the safer choice, and `constella-zero` can keep your query path cheap while you pay the embedding cost once, offline.

If you want to try this on your own data, static embedding models are available in [FastEmbed](https://github.com/qdrant/fastembed): start with `potion-base-8M` for the fastest run, move to `potion-retrieval-32M` if retrieval quality matters more, and add BM25 for hybrid search. All the code and raw results behind the numbers in this article are in the [miracl-static-embeddings repository](https://github.com/qdrant-labs/miracl-static-embeddings), and we would love to hear how static embeddings work (or don't) for your use case.
