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

We rewrote cross-encoder inference in Rust, benchmarked it against Python, and on a small reranking model it came out only 1.1x faster at the median. That is not a sign of a slow Rust implementation. The Python libraries we compared against, `fastembed` and `sentence-transformers`, hand the same work to the same C++ engine, `onnxruntime`, so every library spends almost all of their time in the same compiled code.

This post covers how our Rust library, [`cross-encode-rs`](https://github.com/AstraBert/cross-encode-rs), runs inference, where it does pull ahead (about 1.4x on a larger model), and where it does not (model load time).

## Understanding the Foundations

Before we dive into the implementation, two concepts will come up frequently:

- [**Cross-encoder**](https://www.sbert.net/examples/cross_encoder/applications/README.html): A model that reads a query and a document together and returns one relevance score for the pair. Cross-encoders are typically used for reranking: a fast first stage retrieves a pool of candidates, and the cross-encoder re-sorts them so the best matches come first. An embedding model (a bi-encoder) turns the query and each document into separate vectors and compares them afterward. A cross-encoder feeds both texts into the model at once, so every word of the query is compared with every word of the document. That makes it more accurate, and also more expensive: nothing can be computed ahead of time, so every query-document pair costs a full model run.
- [**ONNX Runtime**](https://onnxruntime.ai/docs/): ONNX (Open Neural Network Exchange) is a file format for trained models. You export a model from PyTorch or TensorFlow once, and run it anywhere. ONNX Runtime is the C++ engine that runs these files, with graph optimizations, hardware acceleration, and bindings for many languages, including Rust. We used the [`ort`](https://ort.pyke.io/) crate to load and run models.

With the fundamentals in place, let's look at how cross-encoder inference works and how we implemented it in Rust.

## How the Inference Works

Inference starts with two texts: a query and a document. These get fused into a single input built from three parallel arrays: token IDs, token types (query or document), and an attention mask marking which tokens are real and which are padding, so the model ignores the padding.

Once the input is ready, it runs through a few layers:

1. **Embedding**: Each token gets three embeddings, one for the token itself, one for its position, and one for its type (query or document). They are summed and normalized into a `[seq_len, hidden_dim]` matrix.
2. **Encoder stack**: Each layer runs multi-head self-attention, where every token attends to every other token in the pair. This is where the query and the document get compared. A small feed-forward network follows in each layer.
3. **Pooling**: The model keeps a single vector, usually the one at the `[CLS]` position (some models average all positions instead). Because of attention, this vector already summarizes the whole pair.
4. **Classification**: A linear layer maps that vector to `num_labels` outputs. Most cross-encoders use `num_labels = 1` and apply a sigmoid to get a score between 0 and 1. With `num_labels = 2`, softmax gives the probability of the "relevant" class.

The `ort` crate abstracts away all four layers. Our job in Rust is to tokenize the query and documents, batch them, build the token IDs, token types, and attention mask, run inference with `ort`, and apply sigmoid or softmax depending on `num_labels`.

{{< island
    path="content/headless/blog/oxidizing-cross-encoders/inference"
    width="480" ratio="320 / 610"
    title="For the query `rust programming`, MiniLM scores `cargo builds rust code` at 0.8841 and `iron rusts in wet air` at 0.0035, although both documents contain the same `rust` token."
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

- [`Xenova/ms-marco-MiniLM-L-6-v2`](https://huggingface.co/Xenova/ms-marco-MiniLM-L-6-v2), a small cross-encoder built to run in the browser.
- [`jinaai/jina-reranker-v2-base-multilingual`](https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual), a larger multilingual reranker.

We benchmarked all three libraries on both.

All benchmarks ran on a MacBook M4 Max with 48 GB of RAM, using all 14 CPU cores.

<aside role="status">
Note: <code>sentence-transformers</code> uses <code>torch</code> as its backend by default. For a fair comparison against the other two libraries, we configured it to use ONNX (via the <code>optimum</code> library) instead, pinned to <code>CPUExecutionProvider</code>. On macOS, Optimum otherwise picks CoreML first: in our first run, that put its MiniLM p50 at 213 ms per request, against 29 ms on the CPU provider.
</aside>

The results were mixed, and they do not fit the usual "Python is slow" narrative:

- On the MiniLM model, the three libraries land close together. `cross-encode-rs` runs 1.1x faster than `fastembed` and `sentence-transformers` at p50 (25 ms versus 27 ms and 29 ms per request) and 1.4x faster at p99 (36 ms versus 49 ms and 51 ms), but both Python libraries win on the fastest requests (14 ms versus 17 ms minimum per request).
- On the larger Jina model, the gap widens: `cross-encode-rs` runs 1.3 to 1.5x faster than both Python libraries from minimum to p99 (131 ms versus 189 ms and 191 ms per request at p50, 251 ms versus 340 ms and 336 ms at p99). The one exception is the slowest request: 581 ms for `cross-encode-rs`, 480 ms for `fastembed`, and 585 ms for `sentence-transformers`.
- `fastembed` and `sentence-transformers` stay within 5% of each other from minimum to p99, on both models.

All three libraries run on `onnxruntime`, the ONNX engine that Microsoft distributes across languages, which explains why their performance is so close on the small model. On the larger model, the two Python libraries still match each other while `cross-encode-rs` pulls about 1.4x ahead, so the runtime is not the whole story: how each library configures and feeds it also counts.

{{< chart id="cross-encoders/latency-minilm" caption="On MiniLM, the three libraries stay within 1.5x of each other at every percentile: at p99, a request takes 36 ms with cross-encode-rs, 49 ms with fastembed, and 51 ms with sentence-transformers." caption2="At p99, cross-encode-rs takes 1.20 ms per document, against 1.64 ms for fastembed and 1.72 ms for sentence-transformers." >}}

{{< chart id="cross-encoders/latency-jina" caption="On the larger Jina model, cross-encode-rs is 1.3 to 1.5x faster than both Python libraries from min to p99 (131 ms versus 189 ms and 191 ms at p50). Only the single slowest request goes to fastembed: 480 ms, against 581 ms for cross-encode-rs and 585 ms for sentence-transformers." caption2="cross-encode-rs takes 4.40 ms per document at p50 and 8.36 ms at p99, against 6.34 ms and 11.35 ms for fastembed, and 6.42 ms and 11.21 ms for sentence-transformers." >}}

### Model Load Time

Latency per request is only half of the picture. For cold starts, autoscaling, and serverless deployments, how long a library takes to load a model matters just as much. To compare the libraries rather than the Python interpreter, we timed only the step that creates the ONNX inference session, from inside each process: `init_model()` in `cross-encode-rs`, and the same session setup in `fastembed`. Starting Python, importing libraries, and loading the tokenizer are excluded on both sides. Each library got 11 warmup runs and 41 measured runs per model ([script](https://github.com/AstraBert/cross-encode-rs/blob/main/scripts/model-load-time-bench.sh)).

- On MiniLM, `fastembed` loads the model in 33.5 ms on average, versus 37.6 ms for `cross-encode-rs` (12% faster).
- On Jina, the two are effectively tied: 333.1 ms for `fastembed` versus 336.6 ms for `cross-encode-rs` on average (1% apart). One slow `cross-encode-rs` run (395 ms) pushes its p99 up; with 41 runs, p99 is effectively the slowest run.

Both libraries spend this time in the same `onnxruntime` call with the same graph optimization level, so there is little room for the language to make a difference. The gap is a few milliseconds on both models: 12% of a small model's load time, and 1% of a large one's.

When we timed the whole process instead, `fastembed` took about 134 ms longer than `cross-encode-rs` on both models, even though both loaded the tokenizer and the model. That gap comes from starting the Python interpreter (through uv) and importing the library. It says nothing against fastembed itself, but it is overhead a Python service pays on every cold start.

{{< chart id="cross-encoders/load-time" caption="fastembed creates the MiniLM session in 33.5 ms on average, 4.1 ms faster than cross-encode-rs at 37.6 ms." caption2="On Jina, the two are 1% apart on average: 336.6 ms for cross-encode-rs versus 333.1 ms for fastembed. The cross-encode-rs p99 of 395.2 ms is a single slow run out of 41." >}}

## Conclusion

The headline result is less "Rust beats Python" and more that the runtime underneath your inference call matters more than the language wrapping it. On the small MiniLM model, all three libraries land within 15% of each other at the median, because they all hand the real work to the same `onnxruntime` engine. The one large gap we measured came from configuration, not language: `sentence-transformers` was several times slower until we pinned it to the CPU execution provider. On the larger Jina model, `cross-encode-rs` pulls ahead of both Python libraries by about 1.4x, so once each request carries more work, how a library drives the runtime starts to count as well.

That said, Rust still earned its keep here. A single binary with no Python runtime, no GIL, and a batching worker that we control down to the thread made it straightforward to build a server that stays fast under concurrent load, and to reason precisely about where every millisecond goes. Model loading is not where it wins, though: with Python startup out of the picture, both libraries load a model in about the same time, for the same reason their inference is close. If you are deploying a cross-encoder as its own service rather than inside a larger Python pipeline, that operational simplicity is worth as much as the raw latency numbers.

[`cross-encode-rs`](https://github.com/AstraBert/cross-encode-rs) is open source. If you are building reranking pipelines and want an ONNX-backed cross-encoder server without a Python dependency, give it a try, and tell us where it breaks.
