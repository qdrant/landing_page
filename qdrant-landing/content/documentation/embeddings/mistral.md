---
title: Mistral
weight: 100
short_description: "Embed text with Mistral Embed and code with Codestral Embed, then search the vectors in Qdrant, directly or through Qdrant Cloud Inference."
description: "Use Mistral Embed and Codestral Embed with Qdrant: model dimensions, document and query embedding, output_dimension, binary quantization recall, and Cloud Inference."
directory:
  summary: "Text and code embedding models through the Mistral API, or through OpenRouter on Qdrant Cloud."
  input: [Text]
  vectors: [Dense]
  runs: [Provider API, Qdrant Cloud Inference]
---

# Mistral

[Mistral AI](https://docs.mistral.ai/studio/knowledge-rag/embeddings/text_embeddings) provides a text embedding model and a code embedding model through its Embeddings API. There are two ways to use them with Qdrant:

- Call the Mistral API from your application and send the vectors to Qdrant. This works with any Qdrant deployment, and it's what most of this page covers.
- On Qdrant Cloud, pass text to Qdrant and let [Qdrant Cloud Inference](#qdrant-cloud-inference) call Mistral Embed through OpenRouter for you.

## Models

| Model | Dimensions | Reducible | Max Tokens per Input |
|---|---|---|---|
| `mistral-embed` | 1024 | No | 8192 |
| `codestral-embed` | 1536 (up to 3072) | Yes | 8192 |

`mistral-embed` is for general text. `codestral-embed` is for code retrieval. To pin a version, use `mistral-embed-2312` or `codestral-embed-2505`.

Mistral embeddings are normalized to length 1, so the Cosine, Dot, and Euclidean distance metrics rank results identically. This page uses Cosine.

## Setup

Install the Mistral SDK and the Qdrant client:

- Python: `pip install mistralai qdrant-client`
- TypeScript: `npm install @mistralai/mistralai @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The Mistral client reads your API key from the `MISTRAL_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/mistral/" block="setup" >}}

## Embed Documents

One request embeds a list of inputs. Each item in the response carries the `index` of its input, which this example uses as the point ID. The SDKs type `index` and `embedding` as optional, so the example asserts that they're set:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mistral/" block="embed-documents" >}}

## Embed Queries

Mistral models have no separate query mode. Embed the query with the same model you used for the documents:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mistral/" block="embed-queries" >}}

## Reduce Vector Size

`codestral-embed` accepts an `output_dimension` parameter of up to 3072. Its dimensions are ordered by relevance, so a smaller value keeps the most informative ones. Set the collection's `size` to the same value, and pass the same `output_dimension` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/mistral/" block="reduce-vector-size" >}}

`mistral-embed` always returns 1024 dimensions. To store its vectors in less memory, use [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization), which shrinks each vector by 32 times. In this test of `mistral-embed`, recall against the exact nearest neighbors reaches 94.5% at an oversampling of 3 and a limit of 100, with rescoring enabled:

| Oversampling |         | 1        | 1        | 2        | 2        | 3        | 3            |
|--------------|---------|----------|----------|----------|----------|----------|--------------|
|              | **Rescore** | False    | True     | False    | True     | False    | True         |
| **Limit**    |         |          |          |          |          |          |              |
| 10           |         | 0.53444  | 0.857778 | 0.534444 | 0.918889 | 0.533333 | 0.941111     |
| 20           |         | 0.508333 | 0.837778 | 0.508333 | 0.903889 | 0.508333 | 0.927778     |
| 50           |         | 0.492222 | 0.834444 | 0.492222 | 0.903556 | 0.492889 | 0.940889     |
| 100          |         | 0.499111 | 0.845444 | 0.498556 | 0.918333 | 0.497667 | **0.944556** |

## Qdrant Cloud Inference

On Qdrant Cloud, Qdrant can call Mistral Embed for you through [OpenRouter](https://openrouter.ai/mistralai/mistral-embed-2312). Instead of a vector, send a `Document` with the model name `openrouter/mistralai/mistral-embed-2312`. Pass your OpenRouter API key in the `openrouter-api-key` request header or in the `options` object. Qdrant does not store the key, so send it with every request. The collection's vector size must be 1024.

To ingest documents:

{{< code-snippet path="/documentation/headless/snippets/inference/openrouter-upsert/" >}}

To search:

{{< code-snippet path="/documentation/headless/snippets/inference/openrouter-query/" >}}

For other ways to pass the key, see [External Providers](/documentation/inference/external-inference-providers/#openrouter).

## Next Steps

- [Combine Mistral vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- Read Mistral's [code embeddings guide](https://docs.mistral.ai/studio/knowledge-rag/embeddings/code_embeddings) for the `codestral-embed` output types.
