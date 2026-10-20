---
title: Cohere
weight: 100
short_description: "Embed text and images with Cohere Embed v5 and v4 models and search them in Qdrant, directly or through Qdrant Cloud Inference."
description: "Use Cohere Embed v5 and v4 with Qdrant: model dimensions, document and query input types, image embedding, vector size reduction, and Qdrant Cloud Inference."
aliases: [ ../integrations/cohere/ ]
directory:
  summary: "Multimodal Embed models for text and images, with separate document and query input types."
  input: [Text, Image]
  vectors: [Dense]
  runs: [Provider API, Qdrant Cloud Inference]
---

# Cohere

[Cohere](https://docs.cohere.com/docs/cohere-embed) provides multimodal embedding models through its [Embed API](https://docs.cohere.com/reference/embed). There are two ways to use them with Qdrant:

- Call the Cohere API from your application and send the vectors to Qdrant. This works with any Qdrant deployment, and it's what most of this page covers.
- On Qdrant Cloud, pass text or images to Qdrant and let [Qdrant Cloud Inference](#qdrant-cloud-inference) call Cohere for you.

## Models

| Model | Dimensions | Context | Input |
|---|---|---|---|
| `embed-v5.0-pro` | 2048 (default), 1536, 1024, 768, 512, 256 | 128k tokens | Text, images, mixed |
| `embed-v5.0-fast` | 2048 (default), 1536, 1024, 768, 512, 256 | 128k tokens | Text, images, mixed |
| `embed-v4.0` | 1536 (default), 1024, 512, 256 | 128k tokens | Text, images, mixed |

`embed-v5.0-pro` targets retrieval quality and `embed-v5.0-fast` targets latency. The two share an embedding space, and Cohere recommends indexing with Pro and querying with Fast. The v3 models, such as `embed-english-v3.0` and `embed-multilingual-v3.0`, are the previous generation, with fixed dimensions and a 512-token context. Use an Embed v5 model for new projects.

Cohere lists cosine similarity, dot product, and Euclidean distance as supported metrics, and doesn't document whether its vectors are normalized. These examples use Cosine, which doesn't depend on vector length.

## Setup

Install the Cohere SDK and the Qdrant client:

- Python: `pip install cohere qdrant-client`
- TypeScript: `npm install cohere-ai @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The Cohere client reads your API key from the `CO_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/cohere/" block="setup" >}}

## Embed Documents

Set `input_type` to `search_document` for content you store. The response returns one vector per input, in input order, so this example uses the input position as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/cohere/" block="embed-documents" >}}

A request accepts up to 96 texts. Split larger datasets into several requests, and see [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

Set `input_type` to `search_query` for search queries. The input type tells the model how a vector will be used, so pair `search_document` for stored content with `search_query` for queries. This example embeds the query with `embed-v5.0-fast`, which shares the embedding space of `embed-v5.0-pro`:

{{< code-snippet path="/documentation/headless/snippets/embeddings/cohere/" block="embed-queries" >}}

The `classification` and `clustering` input types prepare vectors for those tasks instead of search.

## Embed Images

Embed v5 and v4 models place images in the same embedding space as text, so a text query can find an image. Pass images as base64 data URLs in `images`. This example adds an image to the collection from [Embed Documents](#embed-documents):

{{< code-snippet path="/documentation/headless/snippets/embeddings/cohere/" block="embed-images" >}}

The images in one request can total up to 20 MB, in JPEG, PNG, WebP, or GIF format. To embed text and images together as one vector, use the `inputs` parameter, described in the [Embed API reference](https://docs.cohere.com/reference/embed).

## Reduce Vector Size

Embed v5 and v4 models accept an `output_dimension` parameter (`outputDimension` in TypeScript) that returns a shorter vector. Set the collection's `size` to the same value, and pass the same `output_dimension` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/cohere/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [Quantization](/documentation/manage-data/quantization/).

## Qdrant Cloud Inference

On Qdrant Cloud, Qdrant can call Cohere for you. Instead of a vector, send a `Document` or an `Image` with the model name prefixed with `cohere/`. Pass your Cohere API key in the `cohere-api-key` request header or in the `options` object. Qdrant does not store the key, so send it with every request. Cohere parameters such as `output_dimension` also go in `options`, and the collection's vector size must match them, which is 512 in these examples. These examples use `embed-v4.0`, and images must be base64 data URLs.

To ingest an image:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere-upsert/" >}}

To search with text:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere-query/" >}}

For other ways to pass the key, see [External Providers](/documentation/inference/external-inference-providers/#cohere).

## Next Steps

- [Rerank search results](/documentation/search-precision/reranking-semantic-search/) by combining Qdrant retrieval with Cohere reranking.
- [Combine Cohere vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Filter search results](/documentation/search/filtering/) by payload fields.
