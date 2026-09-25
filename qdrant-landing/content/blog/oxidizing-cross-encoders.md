---
draft: false
title: "Oxidizing Cross-Encoders"
short_description: "Doing cross-encoder inference in Rust, and how it compares to Python"
description: "Learnings from writing a cross-encoder inference library in Rust and comparing it with existing Python packages."
date: 2026-09-25T00:00:00Z
author: Clelia Bertelli
featured: false
preview_image: /blog/oxidizing-cross-encoders/preview_image.png
social_image: /blog/oxidizing-cross-encoders/preview_image.png
tags:
  - rust
  - cross-encoders
  - fastembed
  - onnx
---

Python is a great language, and most AI development happens in it because the ecosystem is mature and advanced, thanks to libraries like PyTorch, TensorFlow, and JAX.

Python is also a fast choice in practice, because it talks directly to lower-level runtimes written in languages like C++. This is exactly why rewriting a library in Rust does not always give you the speedup you would hope for: Python is already interfacing with highly optimized code under the hood.

In this post, we will see exactly that: how we wrote an inference library for cross-encoders in Rust, how it compares with Python, and why.

## Understanding the Foundations

Before we dive into the implementation, two concepts will come up frequently:

- [**Cross-encoder**](https://www.sbert.net/examples/cross_encoder/applications/README.html): A cross-encoder is a model trained to score pairs of text (or other tokenized input), usually a query and a retrieved document that may match it. Cross-encoders are especially useful in reranking pipelines, where they select the top-K results from a larger pool of retrieved candidates. Unlike bi-encoder models, which produce one embedding for the query and one for the document, a cross-encoder treats the pair as a single input that runs through the transformer together. The cross-attention between the two texts is what makes a cross-encoder more accurate than embedding and computing cosine similarity. It is also why inference costs more: you cannot precompute document embeddings ahead of time.
- [**ONNX runtime**](https://onnxruntime.ai/docs/): The Open Neural Network eXchange (ONNX) is a framework-agnostic runtime for ML models. You can convert and run models trained with PyTorch or TensorFlow, and it stays lightweight enough for on-device or in-browser use, while still taking advantage of hardware acceleration and graph optimizations. It is not as fast as running PyTorch natively in Python, but it is well suited to cross-platform, multi-language services, which is exactly our case: running model inference in Rust. For our cross-encoder library, we used the [`ort`](https://ort.pyke.io/) crate to load, optimize, and run models.

With the fundamentals in place, let's look at how cross-encoder inference works and how we implemented it in Rust.

## How the Inference Works

Inference starts with two texts, a query and a document. These get fused into a single input built from three parallel arrays: token IDs, token types (query or document), and an attention mask marking which tokens are valid versus padding, so the cross-attention mechanism knows what to exclude.

Once the input is ready, it runs through a few layers:

1. **Embedding**: The model computes an embedding per token, position, and token type. This is how it knows which tokens belong to the query and which belong to the document. At each position, the three embeddings are summed, then passed through LayerNorm and dropout. This produces a `[seq_len, hidden_dim]` matrix per sequence, which flows into the next stage.
2. **Transformer encoder stack**: Self-attention maps the input to Query, Key, and Value matrices, splits them into multiple heads, and computes attention scores on them. Multiplying those scores by the Value matrix is exactly where the query and the document get compared. The heads are then merged and projected back down. A feed-forward network follows, with two linear layers and a nonlinearity between them (usually [GELU](https://docs.pytorch.org/docs/2.14/generated/torch.nn.GELU.html)), then LayerNorm and dropout again.
3. **Pooling**: After the transformer stack, we still have a `[seq_len, hidden_dim]` matrix, but we do not need every vector in it. A pooling layer takes the representation at the `[CLS]` position (or, depending on the model, an average of all positions). Attention let this single vector "see" the entire pair, so it works as an aggregate representation of the query and the document together.
4. **Classification**: A linear layer maps `hidden_dim` to `num_labels`. Cross-encoders almost always use `num_labels = 1`, so we apply a sigmoid to the output and get a relevance score between 0 and 1. When `num_labels = 2`, we apply softmax instead and read off the probability of the "relevant" class.

The `ort` crate abstracts away all four layers. Our job in Rust is to tokenize the query and documents, batch them, build the token IDs, token types, and attention mask, run inference with `ort`, and apply sigmoid or softmax depending on `num_labels`.

{{< island
    path="content/headless/blog/oxidizing-cross-encoders/inference"
    width="480" ratio="320 / 610"
    title="One query-document pair through cross-encoder inference: cross-encode-rs tokenizes and batches, `ort` runs the model graph, and cross-encode-rs turns the logit into a score. Tokens, IDs, and scores come from running Xenova/ms-marco-MiniLM-L-6-v2 on this batch. For the query rust programming, cargo builds rust code scores 0.8841 and iron rusts in wet air scores 0.0035."
>}}
![A query and a document are tokenized into one sequence with input IDs, token type IDs, and an attention mask. ort runs embedding, a six-layer encoder, pooling, and a classifier that returns one logit, and cross-encode-rs applies sigmoid to get the relevance score.](/blog/oxidizing-cross-encoders/cross-encoder-inference.svg)
{{< /island >}}

Here is a brief overview in pseudo-Rust:

```rust
// tokenize text
 let encodings = tokenizer.encode_batch(
     vec![
         (query, document1),
         (query, document2)
      ]
);

// turn encodings into token IDs, attention mask
// and token types
let mask = encodings.get_attention_mask();
let ids = encodings.get_ids();
let types = encoding.get_type_ids();

// Convert our flattened arrays
// into 2-dimensional tensors
// of shape [num_documents, padding_dim]
let a_ids = TensorRef::from_array_view(
    ([num_documents, padding_dim], &*ids)
)?;
// ... same with mask and types ...

// run inference
let outputs = ort_model.run(
    ort::inputs![a_ids, a_mask, a_type_ids]
)?;

// extract logits into a 2D array
let logits = outputs[0]
    .try_extract_array::<f32>()?
    .into_dimensionality::<Ix2>()
    .unwrap();

// get num_labels
(_, num_labels) = logits.dim();

if num_labels == 1 {
    // apply sigmoid
} else {
    // apply softmax
}
```

<aside role="status">
The original code can be found <a href="https://github.com/AstraBert/cross-encode-rs/blob/main/crates/cross-encode-rs/src/inference.rs">here</a>.
</aside>

That's all it takes to oxidize cross-encoder inference. The main optimization in our Rust library is batching, which happens on two levels:

- All documents are packed together and encoded in one pass, rather than sequentially one-by-one.
- Input documents are sorted by tokenized length and run in batches of similar-sized documents, so computation isn't wasted on excess padding.

We also use the newly released `tokenizers` v1, which gives a modest speedup over v0.x.

## Comparing with Python

### Inference Latency

Two libraries dominate ONNX inference in the Python ecosystem: [`sentence-transformers`](https://sbert.net) and [`fastembed`](https://github.com/qdrant/fastembed). We compared our Rust crate, `cross-encode-rs`, against both using the [`mteb/scidocs-reranking`](https://huggingface.co/datasets/mteb/scidocs-reranking) dataset (`test` split, about 3.98K queries).

The benchmark design was simple: for each query in the dataset, we combined its positive and negative documents into one array and ran inference on them (30 query-document pairs per query, on average).

We ran the benchmark against two models and measured both per-request and per-document latency:

- [`Xenova/ms-marco-MiniLM-L-6-v2`](https://huggingface.co/Xenova/ms-marco-MiniLM-L-6-v2), a small cross-encoder built to run in the browser. We benchmarked all three libraries on it.
- [`jinaai/jina-reranker-v2-base-multilingual`](https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual), a larger multilingual reranker. We benchmarked `cross-encode-rs` and `fastembed` on it.

All benchmarks ran on a MacBook M4 Max with 48 GB of RAM, using all 14 CPU cores.

<aside role="status">
Note: <code>sentence-transformers</code> uses <code>torch</code> as its backend by default. For a fair comparison against the other two libraries, we configured it to use ONNX (via the <code>optimum</code> library) instead.
</aside>

The results were mixed, and they do not fit the usual "Python is slow" narrative:

- On the MiniLM model, `sentence-transformers` performed poorly against both `fastembed` and `cross-encode-rs`, with p99 latency 10.4x higher than `cross-encode-rs` (374 ms versus 36 ms per request, 12.5 ms versus 1.2 ms per document).
- On the same model, `fastembed` performed comparably to `cross-encode-rs`. The Rust crate runs 1.1x faster at p50 and 1.4x faster at p99, but `fastembed` wins on the fastest requests (14 ms versus 17 ms minimum per request).
- On the larger Jina model, the gap widens: `cross-encode-rs` runs 1.3 to 1.4x faster than `fastembed` from minimum to p99 (131 ms versus 189 ms per request at p50, 251 ms versus 340 ms at p99). The one exception is the slowest request, where `cross-encode-rs` took 581 ms versus 480 ms for `fastembed`.

Both `fastembed` and `cross-encode-rs` use `onnxruntime`, the shared ONNX runtime API that Microsoft distributes across languages, which explains why their performance is so close on the small model. On the larger model, the gap grows to about 1.4x, so the runtime is not the whole story: how each library configures and feeds it also counts.

{{< chart id="cross-encoders/latency-minilm" caption="On MiniLM, cross-encode-rs and fastembed stay within 1.4x of each other at every percentile, while sentence-transformers takes 374 ms per request at p99 against 36 ms for cross-encode-rs." caption2="The same pattern holds: 1.20 ms for cross-encode-rs and 1.64 ms for fastembed at p99, against 12.48 ms for sentence-transformers." >}}

{{< chart id="cross-encoders/latency-jina" caption="On the larger Jina model, cross-encode-rs is 1.3 to 1.4x faster than fastembed from min to p99 (131 ms versus 189 ms at p50), and slower only on the single slowest request: 581 ms versus 480 ms." caption2="cross-encode-rs takes 4.40 ms at p50 and 8.36 ms at p99, against 6.34 ms and 11.35 ms for fastembed." >}}

### Model Load Time

Latency per request is only half of the picture. For cold starts, autoscaling, and serverless deployments, how long a library takes to load a model matters just as much. To compare the libraries rather than the Python interpreter, we timed only the step that creates the ONNX inference session, from inside each process: `init_model()` in `cross-encode-rs`, and the same session setup in `fastembed`. Starting Python, importing libraries, and loading the tokenizer are excluded on both sides. Each library got 11 warmup runs and 41 measured runs per model ([script](https://github.com/AstraBert/cross-encode-rs/blob/main/scripts/model-load-time-bench.sh)).

- On MiniLM, `fastembed` loads the model in 33.5 ms on average, versus 37.6 ms for `cross-encode-rs` (12% faster).
- On Jina, the two are effectively tied: 333.1 ms for `fastembed` versus 336.6 ms for `cross-encode-rs` on average (1% apart). One slow `cross-encode-rs` run (395 ms) pushes its p99 up; with 41 runs, p99 is effectively the slowest run.

Both libraries spend this time in the same `onnxruntime` call with the same graph optimization level, so there is little room for the language to make a difference. The gap is a few milliseconds on both models: 12% of a small model's load time, and 1% of a large one's.

When we timed the whole process instead, `fastembed` took about 134 ms longer than `cross-encode-rs` on both models, even though both loaded the tokenizer and the model. That gap comes from starting the Python interpreter (through uv) and importing the library. It says nothing against fastembed itself, but it is overhead a Python service pays on every cold start.

{{< chart id="cross-encoders/load-time" caption="fastembed creates the MiniLM session in 33.5 ms on average, 4.1 ms faster than cross-encode-rs at 37.6 ms." caption2="On Jina, the two are 1% apart on average: 336.6 ms for cross-encode-rs versus 333.1 ms for fastembed. The cross-encode-rs p99 of 395.2 ms is a single slow run out of 41." >}}

## Conclusion

The headline result is less "Rust beats Python.", and more that the runtime underneath your inference call matters more than the language wrapping it. On the small MiniLM model, `cross-encode-rs` and `fastembed` land within 10% of each other at the median, because both hand the real work to the same `onnxruntime` engine, while `sentence-transformers` pays about 10x more at p99. On the larger Jina model, `cross-encode-rs` pulls ahead by about 1.4x, so once each request carries more work, how a library drives the runtime starts to count as well.

That said, Rust still earned its keep here. A single binary with no Python runtime, no GIL, and a batching worker that we control down to the thread made it straightforward to build a server that stays fast under concurrent load, and to reason precisely about where every millisecond goes. Model loading is not where it wins, though: with Python startup out of the picture, both libraries load a model in about the same time, for the same reason their inference is close. If you are deploying a cross-encoder as its own service rather than inside a larger Python pipeline, that operational simplicity is worth as much as the raw latency numbers.

[`cross-encode-rs`](https://github.com/AstraBert/cross-encode-rs) is open source. If you are building reranking pipelines and want an ONNX-backed cross-encoder server without a Python dependency, give it a try, and tell us where it breaks.
