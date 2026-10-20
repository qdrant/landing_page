---
title: Mixedbread
weight: 100
short_description: "Run Mixedbread mxbai embedding models with sentence-transformers or on Qdrant Cloud Inference, and search the vectors in Qdrant."
description: "Use Mixedbread mxbai-embed-large-v1 and other open mxbai models with Qdrant: dimensions, query prompts, self-hosting, Cloud Inference, and the legacy Mixedbread API."
directory:
  summary: "Open-weight text embedding models to run yourself, on Qdrant Cloud Inference, or through a legacy API."
  input: [Text]
  vectors: [Dense]
  runs: [Provider API, Self-hosted, Qdrant Cloud Inference]
---

# Mixedbread

[Mixedbread](https://huggingface.co/mixedbread-ai) publishes open-weight embedding models on Hugging Face under the Apache 2.0 license. There are two ways to use them with Qdrant:

- Run the model yourself with [sentence-transformers](https://sbert.net/) and send the vectors to Qdrant. This works with any Qdrant deployment, and it's what most of this page covers.
- On Qdrant Cloud, pass text to Qdrant and let [Qdrant Cloud Inference](#qdrant-cloud-inference) run `mxbai-embed-large-v1` for you.

Mixedbread's own documentation lists its direct embeddings API as [legacy](https://www.mixedbread.com/docs/inference/embedding) and no longer documents it. The API still responds, and the [Mixedbread API (Legacy)](#mixedbread-api-legacy) section shows how to call it.

## Models

| Model | Dimensions | Reducible | Max Tokens per Input | Languages |
|---|---|---|---|---|
| `mxbai-embed-large-v1` | 1024 | Yes | 512 | English |
| `mxbai-embed-xsmall-v1` | 384 | Yes | 4096 | English |
| `deepset-mxbai-embed-de-large-v1` | 1024 | Yes | 512 | German, English |

On Hugging Face, each model ID has the `mixedbread-ai/` prefix, for example `mixedbread-ai/mxbai-embed-large-v1`. `mxbai-embed-large-v1` needs a prompt on retrieval queries, and `deepset-mxbai-embed-de-large-v1` needs `query: ` and `passage: ` prefixes. Mixedbread also publishes ColBERT models for [multivector](/documentation/manage-data/vectors/#multivectors) retrieval, such as `mxbai-edge-colbert-v0-32m`, which this page does not cover.

Through sentence-transformers, `mxbai-embed-large-v1` and `mxbai-embed-xsmall-v1` return vectors that are not normalized. Use the Cosine distance metric, which normalizes vectors for you and matches the cosine similarity in Mixedbread's examples.

## Setup

Install sentence-transformers and the Qdrant client:

```bash
pip install sentence-transformers qdrant-client
```

Load the model and create a collection sized for it. The first run downloads the model from Hugging Face, about 670 MB for `mxbai-embed-large-v1`.

{{< code-snippet path="/documentation/headless/snippets/embeddings/mixedbread/" block="setup" >}}

## Embed Documents

`encode_document` embeds a list of documents and returns the vectors in input order, which this example uses for the point IDs:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mixedbread/" block="embed-documents" >}}

sentence-transformers truncates each input to the model's limit, 512 tokens for `mxbai-embed-large-v1`.

## Embed Queries

For retrieval, `mxbai-embed-large-v1` expects each query to start with the prompt `Represent this sentence for searching relevant passages: `. Documents take no prompt. `encode_query` adds the prompt from the model's configuration, so pass the query text as it is:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mixedbread/" block="embed-queries" >}}

## Reduce Vector Size

The mxbai embedding models support Matryoshka truncation, so you can keep only the first dimensions of each vector. Pass `truncate_dim` when you load the model, and set the collection's `size` to the same value:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mixedbread/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization), which shrinks each vector by 32 times. Mixedbread's model cards state that these models support binary quantization.

## Mixedbread API (Legacy)

Mixedbread's Python and TypeScript SDKs still include the direct embeddings API:

- Python: `pip install mixedbread`
- TypeScript: `npm install @mixedbread/sdk`

The client reads your API key from the `MXBAI_API_KEY` environment variable. As in Mixedbread's own example, this code adds the query prompt to the start of the query text:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mixedbread/" block="mixedbread-api-legacy" >}}

Each item in `data` has an `embedding` list of 1024 floats and the `index` of its input. Store and search them as in [Embed Documents](#embed-documents) and [Embed Queries](#embed-queries).

## Qdrant Cloud Inference

On Qdrant Cloud, Qdrant hosts `mixedbread-ai/mxbai-embed-large-v1` as a paid model. Instead of a vector, send a `Document` with the model name `mixedbread-ai/mxbai-embed-large-v1` in place of the snippet's `<the-model-to-use>` placeholder. The collection's vector size must be 1024.

{{< code-snippet path="/documentation/headless/snippets/cloud-inference/simple/" >}}

For search queries, start the text with `Represent this sentence for searching relevant passages: `. Qdrant Cloud Inference [leaves text that already starts with a model's prefix unchanged](/documentation/inference/cloud-inference/#automatic-query-and-passage-prefixes), so the prompt is never added twice. For setup and billing, see [Cloud Inference](/documentation/inference/cloud-inference/).

## Next Steps

- [Run `mxbai-embed-large-v1` with FastEmbed](/documentation/fastembed/), Qdrant's ONNX-based embedding library.
- [Combine Mixedbread vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- Browse [Mixedbread's models on Hugging Face](https://huggingface.co/mixedbread-ai).
