---
draft: false
title: "How to Run an Embedding Model on Bare Metal"
slug: embeddings-on-bare-metal
short_description: "How to shrink your embedding stack to fit in 16MB of flash memory"
description: "A guide on how you can run a small static embedding model on an ESP32 chip with 16MB of flash memory using `no_std` Rust"
preview_image: /blog/embeddings-on-bare-metal/hero.jpg
social_preview_image: /blog/embeddings-on-bare-metal/preview/social_preview.jpg
date: 2026-11-11T00:00:00-01:00
author: Clelia Bertelli
author_profile: clelia-bertelli
featured: false
tags:
  - embeddings
  - rust
  - bare-metal
  - edge
---

Everyone's dream is to get vector search running on the edge. OK, maybe not *everyone* *everyone*, but it's definitely a dream we've been working towards here at Qdrant.

The main problem is that vector search is resource-hungry, starting with the embedding step: [EmbeddingGemma-2](https://huggingface.co/unsloth/embeddinggemma-2-GGUF), a small modern model, takes up 310MB of memory when quantized to 8 bits, while [Qwen3 Embedding 4B](https://huggingface.co/Qwen/Qwen3-Embedding-4B-GGUF), a larger one, needs 4.28GB. Size is just one side of the coin: transformer-based inference involves expensive computations and often relies on heavy dependencies like [PyTorch](https://pytorch.org/get-started/locally/) (or [libtorch](https://docs.pytorch.org/cppdocs/installing.html)).

You might still be fine on embedded devices that have an operating system, a few cores, and gigabytes of RAM and storage, like [Reachy Mini](https://pollen-robotics.com/reachy-mini/). But you're out of luck on boards with just a few megabytes of flash memory, no disk, and no operating system. In short: you can't really run an embedding model on bare metal.

Or can you?

> For this blog post we used an [ESP32-S3](https://documentation.espressif.com/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf) board with 16MB of flash memory and 8MB of PSRAM, so everything (model and code) is sized for it. Find the repository [here](https://github.com/qdrant-labs/static-models-bm).

## A Static Model Is All You Need

As we just said, two things block embedding models from running on bare metal: size and inference. That holds for transformer-based models, but there is a class of models that are small and whose inference boils down to a table lookup plus a few mathematical operations: static embedding models.

We did [a proper deep dive on static models](/articles/embedding-at-the-speed-of-light/), but here's a quick recap: their weights encode a lookup table that associates an embedding with each token in their vocabulary, and inference consists of three steps:

- For each token, find its embedding in the table
- Mean-pool all the token vectors (that is, take the average value for each dimension)
- Perform [L2 normalization](https://en.wikipedia.org/wiki/Norm_(mathematics)#Euclidean_norm), scaling the vector to unit length. This step is optional but improves retrieval quality

As you can see, there's no torch required. In fact, we can express all of this in a few hundred lines of plain code, with no need for optimized matrix multiplications and the like.

{{< island
    path="content/headless/blog/embeddings-on-bare-metal/inference"
    width="760" ratio="760 / 330"
    title="Static embedding inference: tokenize, read one embedding row per token ID, mean pool, and normalize. Token IDs are illustrative, except ID 7555 for hug. Select a token to see where its row starts."
>}}
![A static embedding model tokenizes "hugs are nice" into four token IDs, reads one embedding row per ID from the weight table at the offset 4 bytes x DIM x ID, averages the four rows into one vector with mean pooling, and scales it to unit length.](/blog/embeddings-on-bare-metal/inference.svg)
{{< /island >}}

With the inference complexity out of the way, all that's left is choosing a model small enough to fit on our 16MB chip. Luckily, the [potion](https://huggingface.co/collections/minishlab/potion) series by [Minish](https://minish.ai/) has just the right candidate: [`potion-base-2M`](https://huggingface.co/minishlab/potion-base-2M), a tiny model that takes up just 7.5MB.

But how do we get the model (and its [tokenizer](https://huggingface.co/docs/transformers/en/main_classes/tokenizer)) onto the ESP32 board? To find out, we have to get our hands dirty with some Rust.

## How Do You Embed an Embedding Model?

Rust is a great language [for embedded systems](https://rust-lang.org/what/embedded/), but there is one big catch on bare metal: there is no OS to provide the services the standard library relies on, so we can't use it. We call this [`no_std` Rust](https://docs.rust-embedded.org/book/intro/no-std.html): code that talks directly to the hardware and only relies on the types and functionality guaranteed by [`core`](https://doc.rust-lang.org/core/).

This context matters for what we want to do. We can't use third-party dependencies that require the standard library (like `tokenizers`). We can't read files from anywhere either: there is no disk, and the filesystem API belongs to the standard library anyway. On top of that, we lose types like `Vec` and `HashMap`, which makes mapping tokens and storing the embedding lookup table trickier.

But there's a solution to everything, so let's tackle these problems one at a time.

{{< island
    path="content/headless/blog/embeddings-on-bare-metal/build-embed"
    width="760" ratio="760 / 360"
    title="The plan: a build script on the laptop turns the model and the vocabulary into constants and a blob, and both are compiled into the firmware, so the chip only reads memory."
>}}
![At build time on a laptop, build.rs reads model.safetensors and the tokenizer vocabulary and writes model_meta.rs and a vocabulary blob. These are compiled, together with the weights, into the firmware binary in flash, where the tokenizer and the pooling code read them at run time on the ESP32.](/blog/embeddings-on-bare-metal/build-embed.svg)
{{< /island >}}

### Building Files Into the Binary

Rust, like many compiled languages, lets you embed the contents of external files into the binary. The `include_bytes!` macro makes it easy:

```rust
static MODEL_FILE: &Aligned<[u8]> = &Aligned(*include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/model/model.safetensors"
)));
```

The [`safetensors`](https://huggingface.co/docs/safetensors/en/index) format stores some metadata along with the weights. In our `build.rs` (a custom build script) we read that metadata and produce a `model_meta.rs` file, which our library then includes at compile time:

```rust
// safetensors layout: [8-byte header length][JSON header][tensor data]
let bytes = fs::read(&model_path)?;
let header_len = u64::from_le_bytes(bytes[0..8]) as usize;
let header = parse_json(&bytes[8..8 + header_len]);

// Find the embedding table: its shape and where its bytes live
let (rows, dim) = header.tensor.shape;
let start = 8 + header_len + header.tensor.data_offsets[0];
let end   = 8 + header_len + header.tensor.data_offsets[1];

// Fail at build time, not runtime, if the file looks wrong
assert!(end - start == rows * dim * 4);

// Bake the layout into constants the runtime can use
fs::write(
    out.join("model_meta.rs"),
    format!(
        "pub const VOCAB_SIZE: usize = {rows};\n\
         pub const DIM: usize = {dim};\n\
         pub const TENSOR_START: usize = {start};\n\
         pub const TENSOR_END: usize = {end};\n\
         pub const UNK_ID: u32 = {unk_id};\n\
         pub const MAX_CHARS_PER_WORD: usize = {max_chars};\n"
    ),
)
.unwrap();

// Include in the library with:
mod meta {
    include!(concat!(env!("OUT_DIR"), "/model_meta.rs"));
}
```

Note that the build script does use `std` APIs: the build runs on a laptop or a server, which has an operating system and a disk to read and write files.

This way, the model tensor and its metadata (how many tokens it can encode, the dimensions of its vectors, and where the weights start and end) are embedded directly in the binary at build time, and are accessed in memory when the binary runs on the chip.

### A `no_std` WordPiece Tokenizer

As mentioned, we can't use the `tokenizers` library by Hugging Face because it requires the standard library, so we have to implement a `no_std` tokenizer ourselves.

If you look at the tokenizer associated with `potion-base-2M`, you will see that it uses the [WordPiece algorithm](https://huggingface.co/learn/llm-course/en/chapter6/6): starting from the word to tokenize, we greedily match the longest sub-word that is in the vocabulary, then repeat on what's left. The word `hugs` is split into `hug` (which is in the vocabulary) and `##s` (also in the vocabulary, where `##` is the *continuation prefix*).

So, given the vocabulary, implementing WordPiece takes nothing but plain code, and the tokenizer file provides the vocabulary.

The vocabulary itself, though, is a map from each string token (`hug`) to its numeric token ID (`7555`), and we don't have `HashMap` because it lives in `std::collections`. We can solve this by encoding the vocabulary into bytes at build time and embedding those bytes in the binary.

We want a lookup-friendly blob of data, but string tokens have different lengths, so we can't place them one after the other and multiply an index by a fixed size, as we do to read embeddings. Instead, we structure the blob like this: a count, then an index of fixed-size slots holding the byte offset of each entry, then the entries themselves, in sorted token order. Each entry stores a 4-byte ID, a 1-byte length, and the token bytes.

{{< island
    path="content/headless/blog/embeddings-on-bare-metal/vocab-layout"
    width="760" ratio="760 / 350"
    title="The vocabulary blob: fixed-size index slots point to variable-length entries. Token IDs are illustrative, except ID 7555 for hug. Select a slot to see its entry."
>}}
![The vocabulary blob starts with a count N, followed by N four-byte index slots, each holding the byte offset of one entry. The entries follow in sorted token order, and each holds a four-byte ID, a one-byte length, and the token bytes.](/blog/embeddings-on-bare-metal/vocab-layout.svg)
{{< /island >}}

Since the entries are sorted, we can read any entry from its slot and look up the ID of a string token with binary search:

```rust
fn entry(&self, index: usize) -> (&'static [u8], u32) {
    let off = read_u32(self.blob, 4 + 4 * index) as usize;
    let id = read_u32(self.blob, off);
    let len = self.blob[off + 4] as usize;
    // the first element represents the token bytes
    (&self.blob[off + 5..off + 5 + len], id)
}

/// Returns the id of `token`, if it is in the vocabulary.
pub fn get(&self, token: &str) -> Option<u32> {
    let key = token.as_bytes();
    let (mut lo, mut hi) = (0, self.len());
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        let (candidate, id) = self.entry(mid);
        match candidate.cmp(key) {
           core::cmp::Ordering::Equal => return Some(id),
           core::cmp::Ordering::Less => lo = mid + 1,
           core::cmp::Ordering::Greater => hi = mid,
        }
    }
    None
}
```

With the token lookup in place, it's just a matter of implementing the tokenization pipeline in [a little over 200 lines of code](https://github.com/qdrant-labs/static-models-bm/blob/e9b785734821a033aa4e64d69d3fe44f8a3c829a/src/tokenizer.rs#L72-L305): normalizing the text (removing control characters, stripping accents, handling Chinese characters, lowercasing), pre-tokenizing it (splitting on whitespace, with each punctuation mark becoming its own token), and finally applying WordPiece.

A small note: if you look at the code, you'll notice we use `Vec`, even though we said it isn't available in `no_std` Rust. This works because we configure a global allocator from the [`esp-alloc`](https://docs.espressif.com/projects/rust/esp-alloc/0.11.0/esp_alloc/) crate, which handles the heap allocations an operating system would otherwise take care of (with some limitations).

## Make It Run!

If you're still here, you're a real Rust-dventurer: you overcame the size and inference problems, embedded an embedding model, and handled a `no_std` tokenizer and its vocabulary.

All that's left is making the model run. We read its tensor bytes from memory into a `u8` slice called `table`, tokenize the input text, read the token embeddings, then pool and (optionally) normalize them:

```rust
/// Mean-pools the rows of `ids` into `out`, then optionally L2-normalizes.
pub fn pool(&self, ids: &[u32], out: &mut [f32]) {
    if ids.is_empty() {
       return;
    }
    let row_bytes = self.dim * size_of::<f32>();
    for &id in ids {
        let id = id as usize;
        let row = &self.table[id * row_bytes..(id + 1) * row_bytes];
            // sum the f32 values read for this token into the running
            // total at the same positions of the output vector
        for (acc, bytes) in out.iter_mut().zip(row.chunks_exact(4)) {
            *acc += f32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
        }
    }
    let n = ids.len() as f32;
    // apply mean pooling by dividing the sum of the token
    // values by the number of tokens
    for x in out.iter_mut() {
        *x /= n;
    }
    if self.normalize {
        let norm = libm::sqrtf(out.iter().map(|v| v * v).sum::<f32>()).max(1e-12);
        for x in out.iter_mut() {
            *x /= norm;
        }
    }
} 
```

Given our previous article on embedding models, you might expect this to run exceptionally fast. It doesn't reach the "speed of light": embedding 10-12 tokens takes around 1.2 ms, or ~830 embeddings/s. That's far from the 11,000-15,000 embeddings/s we get on a MacBook Pro (on texts that are, on average, much longer than 10-12 tokens), but still impressive given it runs with 3,000 times less memory.

## Conclusion

So, can you run an embedding model on bare metal? Yes, as long as it's a static one. No operating system, no PyTorch, no `tokenizers`: just a table of floats and a vocabulary baked into the binary, a WordPiece tokenizer in about 200 lines of `no_std` Rust, and a pooling loop.

It won't break any speed records, but it fits on a chip with a few megabytes of memory, and it works. Embeddings on the edge: check. Next up, the other half of the dream: vector search on the chip itself.
