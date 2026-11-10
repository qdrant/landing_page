---
draft: false
title: "Embedding at the Speed of Light"
short_description: "Static embedding models in FastEmbed: how they work, how fast they run, and the retrieval tradeoffs."
description: "How static embedding models turn tokenization into the only bottleneck, how we embedded 32.9M passages in 35 minutes on a laptop CPU with FastEmbed, and what you give up in recall."
social_preview_image: /articles_data/embedding-at-the-speed-of-light/preview/social_preview.jpg
preview_dir: /articles_data/embedding-at-the-speed-of-light/preview
weight: 1
author: Clelia Bertelli, Minish
date: 2026-11-04T00:00:00Z
keywords:
  - static embeddings
  - fastembed
  - model2vec
  - potion
  - miracl
category: embedding-research
---
Embedding a large corpus is usually the slowest part of building a vector search pipeline: transformer-based models capture semantics very well, but they are heavy on CPU, so you either wait days for the embeddings or pay for a costly GPU.

Static embedding models avoid that cost by skipping the neural network altogether. A static model is a lookup table that associates each token in the model's vocabulary with an embedding: to embed a text, you tokenize it, look up the vector of each token, and average them. With `potion-base-8M`, this let us embed 32.9 million passages on a laptop CPU in 35 minutes, where a transformer-based model would have needed about 53 days. The tradeoff is retrieval quality, because without layers the tokens never influence each other.

The [`potion`](https://huggingface.co/collections/minishlab/potion) models series and the [model2vec](https://github.com/minishlab/model2vec) library behind it come from [Minish](https://minish.ai/), and we built on their work to add static embedding support to [FastEmbed](https://github.com/qdrant/fastembed). In this article, we cover how static embeddings work, how fast we can make them run, and which tradeoffs come with them.

## So: What _Is_ a Static Embedding Model?

A static embedding model gives every token in its vocabulary one fixed vector. To embed a text, you split it into tokens, look up the vector of each token, and average those vectors (mean pooling) into a single embedding. Nothing else happens between the text and the vector: there are no layers in which tokens influence each other, which is what makes a static model so cheap to run, and also why it is less capable than a transformer.

Static model weights are saved like those of any other model, often in the [`safetensors`](https://github.com/huggingface/safetensors) format, but they hold the token embeddings rather than the parameters of a network. To see how this works, start with datatypes: like every other model, a static embedding model stores its weights with a given datatype (`f32`, `f16`, [`bf16`](https://en.wikipedia.org/wiki/Bfloat16_floating-point_format), all the way down to `u8`), which determines how many bits (the precision) represent each number. In our example, we use the mainstream choice: `f32`, a full-precision floating point number that takes 32 bits (4 bytes). When we read the model tensor from the `safetensors` file, we decode each weight by taking 4 contiguous bytes and reading them as an `f32` (in `numpy`, you would use [`np.frombuffer`](https://numpy.org/doc/stable/reference/generated/numpy.frombuffer.html) with `dtype="<f4"`).

Decoding a single weight is not enough, though: embeddings usually have hundreds of dimensions, so we need to read as many weights as the model's output dimension (let's assume 256). At this point we know how to read weights into a vector, but we still need to associate vectors with tokens and produce a final 256-dimensional vector for the whole text.

To do that, we use a [tokenizer](https://github.com/huggingface/tokenizers), which transforms text into token IDs; we then use each ID to locate the embedding of that token within the model bytes. The position of the embedding is `DATATYPE_BYTES x DIMENSIONS x TOKEN_ID`, so a token with ID 73 starts at byte `4 x 256 x 73 = 74,752` of the tensor. Given a token ID, we can therefore decode its embedding by reading `DIMENSIONS x DATATYPE_BYTES` bytes into `f32` values.

A text can contain hundreds of tokens: if each of them gets its own embedding, how do we get to a single vector? You guessed it: mean pooling, which means averaging the token vectors position by position. We can then apply an optional [L2 normalization](https://en.wikipedia.org/wiki/Norm_(mathematics)#Euclidean_norm) step, which scales the vector to unit length, and leads to better performance in practice. This is all it takes to produce the final embedding.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/inference"
    width="760" ratio="760 / 330"
    title="From text to one vector: tokenize, read one embedding row per token ID, mean pool, and normalize. Token IDs are illustrative, except ID 73 from the example above. Select a token to see where its row starts."
>}}
![A static embedding model tokenizes "vector search is fast" into four token IDs, reads one embedding row per ID from the weight table at the offset 4 bytes x 256 dimensions x ID, averages the four rows into one vector with mean pooling, and scales it to unit length.](/articles_data/embedding-at-the-speed-of-light/inference.svg)
{{< /island >}}

## Making Static Models Go Brr

As the previous section suggests, static embedding models are much faster than transformer-based ones: locating a token, decoding its weights into an `f32` vector, and mean pooling the results are all cheap operations, to the point where tokenization itself is often the bottleneck.

In our previous FastEmbed implementation, we ran static models through [ONNX Runtime](https://onnxruntime.ai/), the same way we run transformer-based models. ONNX is an excellent runtime for neural networks, but the graph optimizations it applies under the hood add substantial overhead to an inference step that only performs a table lookup.

Inspired by `model2vec` and by some [experiments with Rust](https://github.com/AstraBert/statembed), we decided to port the inference to pure `numpy` operations. A few optimizations are worth calling out:

- **Custom tensor reading, with no `safetensors` dependency:** we read the header size from the first 8 bytes of the file, parse the header as JSON to find the region that holds the weights and their datatype, and then load that region, optionally through [`mmap`](https://en.wikipedia.org/wiki/Mmap), all with `numpy`.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/safetensors-layout"
    width="760" ratio="760 / 220"
    title="A safetensors file is three regions: the header size, a JSON header, and the weight bytes."
>}}
![A safetensors file holds 8 bytes with the header size N, then N bytes of JSON header, then the raw weight bytes.](/articles_data/embedding-at-the-speed-of-light/safetensors-layout.svg)
{{< /island >}}

- **No padding:** ONNX models generally pad every batch to its longest text, while here we keep the token IDs in one flat array plus a lengths array, built from numpy views over the tokenizer output, which avoids that extra work.

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/batching"
    width="760" ratio="760 / 210"
    title="The same three texts as a padded batch and as a flat array with a lengths array."
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


But the main speedup did not come from `numpy` itself. To see where the time goes, we profiled the three stages of the static path (tokenization, lookup, and pooling) on 2,048 documents of about 150 tokens each. Tokenization dominated, taking about 61% of the wall time for [`potion-base-8M`](https://huggingface.co/minishlab/potion-base-8M) and 54% for `potion-retrieval-32M`: as we said above, static embedding inference is so cheap that tokenization becomes the bottleneck, so the fix was to speed up the tokenizer.

In [an experimental branch](https://github.com/qdrant/fastembed/pull/807), we migrated from `tokenizers` v0.x to the v1 pre-release, which [Hugging Face's own benchmarks](https://huggingface-tokenizers-v1.static.hf.space/index.html) show to be substantially faster. With v1, tokenization drops to about 14% and 12% of the wall time, the total time per batch roughly halves, and pooling becomes the largest stage. End to end on FiQA with `potion-base-8M`, throughput more than doubled, from 18K to 40K docs/s, and the p50 latency of embedding a single query fell by more than half, from 39 µs to 14 µs. The PR has the full details.

{{< chart id="static-embeddings/stage-profile" caption="Wall time per stage for potion-base-8M (8M) and potion-retrieval-32M (32M) on 2,048 documents, with tokenizers v0 (0.23.3) and v1 (1.0.0rc2), abbreviated as tok: tokenization drops from 54% to 61% of the time to 12% to 14%, and the total time per batch roughly halves." caption2="The same runs as a share of total wall time: with tokenizers v1, pooling is the largest stage at 53% to 55%." >}}

The FiQA throughput numbers are nice, but FiQA is a relatively small dataset (57K documents), and we promised at the beginning that static embeddings could help with _massive_ datasets, so we tested that too.

### 32.9M Embeddings in 35 Minutes

We chose the English corpus of [MIRACL](https://huggingface.co/datasets/miracl/miracl-corpus), which contains 32,893,221 passages. To give a sense of how long a transformer-based model would need, we tested [`stella_en_400M_v5`](https://huggingface.co/NovaSearch/stella_en_400M_v5) through its [ONNX export](https://huggingface.co/Qdrant/stella-en-400M-v5-doc-onnx) in FastEmbed: it delivered 7 docs/s on a MacBook Pro with an M4 Max, 14 cores, and 48 GiB of unified memory, so it would have needed about 53 days to embed the entire dataset.

To load the entire dataset into Qdrant with static embeddings on the same hardware, we needed 9 to 11 hours in total, but the share of that time spent on embedding was remarkably low: 35 minutes for `potion-base-8M`, 38 for `potion-retrieval-32M`, and 47 for `potion-multilingual-128M`, which corresponds to roughly 11K to 15K docs/s. The rest was mostly network transfer and ingestion: the data went to a Qdrant Cloud cluster over the network, so the share spent on transfer and ingestion would likely be smaller on a local instance.

{{< chart id="static-embeddings/embedding-vs-ingestion" caption="Loading 32,893,221 passages into a Qdrant Cloud cluster: embedding takes 35, 38, and 47 minutes, out of 8.9, 10.8, and 9.2 hours in total." >}}

These numbers are fantastic but, before you add a static embedding model to your search pipeline, stay with us for one more section: as always in computer science, there are tradeoffs.

## Tradeoffs, and Maybe a Solution?

The recall@10 numbers for static embedding models are not particularly high:

{{< chart id="static-embeddings/recall-at-10" caption="Recall@10 on MIRACL English for the potion models, with dense search alone and with BM25 added." >}}

Two things stand out when choosing a model. The first is that **size does not decide the ranking**: `potion-retrieval-32M`, which was tuned for retrieval, is the strongest dense model, while `potion-multilingual-128M`, which is the largest of the three, is built to cover many languages, and on this English corpus it scores below even `potion-base-8M`. How well a model's training fits your language and task, in this case, matters more than its parameter count.

The second is that **hybrid search is worth testing**. In our hybrid setup, Qdrant retrieves the top 50 results with the static model's dense vectors and the top 50 with a [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) sparse vector for the same query, then fuses the two lists with reciprocal rank fusion (RRF) and returns the top 10. BM25 roughly doubled recall for `potion-base-8M` and added a few points to `potion-retrieval-32M`, so the weaker the dense model, the more it helped.

For reference, the published [MTEB](https://github.com/embeddings-benchmark/results) results for transformer-based dense models on the English portion of MIRACL sit between 53.7% (`stella_en_400M_v5`) and 63.5% (`snowflake-arctic-embed-m`). The tradeoff is concrete: the best static model gives up roughly 10 to 24 points of recall@10, depending on the transformer and on whether BM25 is added, in exchange for embedding speed. If recall is more important for your pipeline, a transformer is the safer choice, while, if you're working with constrained resources, a static model with hybrid search makes a cheap first-stage retriever.

{{< chart id="static-embeddings/recall-vs-transformers" caption="Dense recall@10 on MIRACL English: static models from our runs (potion-32M is potion-retrieval-32M, potion-8M is potion-base-8M) against transformer-based models from published MTEB results." >}}

While static embedding models will likely improve, we have been working on an interesting alternative at Qdrant: [`constella`](https://huggingface.co/Qdrant/constella-nano), a family of models derived from the [`stella_en_400M_v5`](https://huggingface.co/NovaSearch/stella_en_400M_v5) encoder mentioned above, which needs no neural network at query time. A larger model like stella creates the document embeddings, and a much smaller one, [`constella-zero`](https://huggingface.co/Qdrant/constella-zero), produces query embeddings from a lookup table, which is essentially the same mechanism as static embeddings. This does not solve the problem of re-embedding massive datasets, but it significantly speeds up query serving, so you can think of it as a middle ground. You can read more about constella [here](https://qdrant.tech/blog/constella-research-preview/).

{{< island
    path="content/articles/headless/embedding-at-the-speed-of-light/constella"
    width="760" ratio="760 / 340"
    title="Documents are embedded once by stella, queries by constella-zero from a lookup table, and both kinds of vectors meet in Qdrant. Schematic."
>}}
![Documents go through stella_en_400M_v5, a neural network, into document vectors stored in Qdrant. Queries go through constella-zero, a lookup table, into query vectors that Qdrant searches with.](/articles_data/embedding-at-the-speed-of-light/constella.svg)
{{< /island >}}


## Should You Go Static?

Static embedding models turn the embedding step from the slowest part of an indexing pipeline into a rounding error: we embedded 32.9 million passages in 35 to 47 minutes on a laptop CPU, against the roughly 53 days a transformer-based model would have needed, and most of the time that remained went into moving vectors over the network. That speed comes at a price in retrieval quality, so they are not a drop-in replacement for a good transformer-based model; they shine when embedding volume or hardware is the real constraint.

They are a good fit if you have to embed tens of millions of documents, if you re-embed often (to compare models, for example), or if you run on CPU-only machines, ideally as a cheap first-stage retriever paired with hybrid search. If quality comes first, a transformer on the document side is still the safer choice, and `constella-zero` can keep your query path cheap while you pay the embedding cost once, offline.

If you want to try this on your own data, static embedding models are available in [FastEmbed](https://github.com/qdrant/fastembed): start with `potion-base-8M` for the fastest run, move to `potion-retrieval-32M` if retrieval quality matters more, and add BM25 for hybrid search. All the code and raw results behind the numbers in this article are in the [miracl-static-embeddings repository](https://github.com/qdrant-labs/miracl-static-embeddings), and we would love to hear how static embeddings work (or don't) for your use case.
