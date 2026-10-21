---
title: OpenAI
weight: 100
short_description: "Embed documents and queries with OpenAI text-embedding-3 models and search them in Qdrant, directly or through Qdrant Cloud Inference."
description: "Use OpenAI text-embedding-3 models with Qdrant: dimensions, document and query embedding, dimension reduction, binary quantization, and Qdrant Cloud Inference."
aliases: [ ../integrations/openai/ ]
directory:
  summary: "Text embedding models with adjustable dimensions, through the OpenAI API or Qdrant Cloud Inference."
  input: [Text]
  vectors: [Dense]
  runs: [Provider API, Qdrant Cloud Inference]
---

# OpenAI

[OpenAI](https://developers.openai.com/api/docs/guides/embeddings) provides text embedding models through its Embeddings API. There are two ways to use them with Qdrant:

- Call the OpenAI API from your application and send the vectors to Qdrant. This works with any Qdrant deployment, and it's what most of this page covers.
- On Qdrant Cloud, pass text to Qdrant and let [Qdrant Cloud Inference](#qdrant-cloud-inference) call OpenAI for you.

## Models

| Model | Dimensions | Reducible | Max Tokens per Input |
|---|---|---|---|
| `text-embedding-3-small` | 1536 | Yes | 8192 |
| `text-embedding-3-large` | 3072 | Yes | 8192 |
| `text-embedding-ada-002` | 1536 | No | 8192 |

`text-embedding-ada-002` is the previous generation. Use a `text-embedding-3` model for new projects.

OpenAI embeddings are normalized to length 1, so the Cosine and Dot distance metrics rank results identically. OpenAI recommends cosine similarity.

## Setup

Install the OpenAI SDK and the Qdrant client:

- Python: `pip install openai qdrant-client`
- TypeScript: `npm install openai @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The OpenAI client reads your API key from the `OPENAI_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/openai/" block="setup" >}}

## Embed Documents

One request embeds a list of inputs. Each item in the response carries the `index` of its input, which this example uses as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/openai/" block="embed-documents" >}}

A request accepts up to 2,048 inputs and 300,000 tokens in total, and each input must be 8,192 tokens or fewer. Split larger datasets into several requests, and see [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

OpenAI models have no separate query mode. Embed the query with the same model you used for the documents:

{{< code-snippet path="/documentation/headless/snippets/embeddings/openai/" block="embed-queries" >}}

## Reduce Vector Size

`text-embedding-3` models accept a `dimensions` parameter that shortens the vector with little loss in quality. Set the collection's `size` to the same value, and pass the same `dimensions` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/openai/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization), which shrinks each vector by 32 times. With oversampling, OpenAI models keep high recall:

| Model | Dimensions | Test Dataset | Recall | Oversampling |
|---|---|---|---|---|
| `text-embedding-3-large` | 3072 | [DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) | 0.9966 | 3x |
| `text-embedding-3-small` | 1536 | [DBpedia 100K](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K) | 0.9847 | 3x |
| `text-embedding-3-large` | 1536 | [DBpedia 1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-1M) | 0.9826 | 3x |
| `text-embedding-ada-002` | 1536 | [DBpedia 1M](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) | 0.98 | 4x |

## Qdrant Cloud Inference

On Qdrant Cloud, Qdrant can call OpenAI for you. Instead of a vector, send a `Document` with the model name prefixed with `openai/`. Pass your OpenAI API key in the `openai-api-key` request header or in the `options` object. Qdrant does not store the key, so send it with every request. OpenAI parameters such as `dimensions` also go in `options`, and the collection's vector size must match them, which is 512 in these examples.

To ingest documents:

{{< code-snippet path="/documentation/headless/snippets/inference/openai-upsert/" >}}

To search:

{{< code-snippet path="/documentation/headless/snippets/inference/openai-query/" >}}

For other ways to pass the key, see [External Providers](/documentation/inference/external-inference-providers/#openai).

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Use named vectors](/documentation/manage-data/vectors/#named-vectors) to store OpenAI vectors next to other vector types.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine OpenAI vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
