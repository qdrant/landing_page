---
title: Jina AI
weight: 100
short_description: "Embed text, images, video, audio, and PDFs with Jina AI jina-embeddings-v5 models and search them in Qdrant, through Qdrant Cloud Inference."
description: "Use Jina AI jina-embeddings-v5 text and omni models with Qdrant: dimensions, task adapters, multimodal input, ColBERT multivectors, and Qdrant Cloud Inference."
aliases:
  - /documentation/integrations/jina-embeddings/
directory:
  summary: "Multilingual text, code, and multimodal embeddings with task adapters and multivector output."
  input: [Text, Image, Video, Audio, PDF]
  vectors: [Dense, Multivector]
  runs: [Provider API, Qdrant Cloud Inference]
---

# Jina AI

[Jina AI](https://jina.ai/embeddings/), now part of Elastic, provides text, code, and multimodal embedding models through the Jina Embedding API. There are two ways to use them with Qdrant:

- Call the Jina API from your application and send the vectors to Qdrant. This works with any Qdrant deployment, and it's what most of this page covers.
- On Qdrant Cloud, pass text or images to Qdrant and let [Qdrant Cloud Inference](#qdrant-cloud-inference) call Jina AI for you.

## Models

| Model | Dimensions | Max Tokens | Input |
|---|---|---|---|
| `jina-embeddings-v5-text-small` | 1024 | 32,768 | Text |
| `jina-embeddings-v5-text-nano` | 768 | 8,192 | Text |
| `jina-embeddings-v5-omni-small` | 1024 | 32,768 | Text, image, video, audio, PDF |
| `jina-embeddings-v5-omni-nano` | 768 | 8,192 | Text, image, video, audio, PDF |
| `jina-code-embeddings-1.5b` | 1536 | 32,768 | Code, text |
| `jina-code-embeddings-0.5b` | 896 | 32,768 | Code, text |

Jina AI recommends `jina-embeddings-v5-text-small` for text retrieval, and the `nano` models when latency or cost matters more than the last point of accuracy. An `omni` model returns the same vector for text as the `text` model of the same size, so you can add images or video to an existing text collection without re-embedding it. For source code, use a `jina-code-embeddings` model with tasks such as `nl2code.passage` and `nl2code.query`. Every model in the Models table accepts a `dimensions` parameter that shortens its vectors (see [Reduce Vector Size](#reduce-vector-size)).

`jina-embeddings-v4`, `jina-embeddings-v3`, `jina-clip-v2`, and the `jina-embeddings-v2` models are previous generations. Use a v5 model instead. `jina-embeddings-v4` is free on the API but throttled, and Jina AI says it is not suitable for production.

The API L2-normalizes vectors by default, so the Cosine and Dot distance metrics rank results identically. This page uses Cosine.

## Setup

Jina AI has no official Python or TypeScript SDK, so these examples call its REST API with `requests` and `fetch`. Install the HTTP client and the Qdrant client:

- Python: `pip install requests qdrant-client`
- TypeScript: `npm install @qdrant/js-client-rest`

Create a helper for the Embedding API, the Qdrant client, and a collection sized for the model. The helper reads your API key from the `JINA_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="setup" >}}

## Embed Documents

One request embeds a list of inputs. Set `task` to `retrieval.passage` for documents. Each item in the response carries the `index` of its input, which this example uses as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="embed-documents" >}}

The API sets no limit on the number of inputs per request, but each input must fit the model's context window. A longer input returns an error unless you set `truncate` to `true`. Requests also count against per-key token-per-minute rate limits, so split large datasets into several requests, and see [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

v5 models have task-specific adapters. Embed queries with `retrieval.query` and documents with `retrieval.passage`, so the model encodes a short question and a longer passage that answers it close together. The default task is `text-matching`, which is for symmetric similarity, so always set the task for retrieval:

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="embed-queries" >}}

The other v5 tasks are `text-matching`, `classification`, and `clustering`.

## Reduce Vector Size

v5 models use Matryoshka Representation Learning, so the `dimensions` parameter shortens the vector with little loss in quality, down to 32 dimensions. Set the collection's `size` to the same value, and pass the same `dimensions` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization).

## Embed Images, Video, Audio, and PDFs

The `omni` models embed images, video, audio, and PDFs into the same vector space as text. Because `jina-embeddings-v5-omni-small` returns the same text vectors as `jina-embeddings-v5-text-small`, this example adds images to the collection from [Embed Documents](#embed-documents), and the query from [Embed Queries](#embed-queries) searches the text and the images together:

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="embed-images-video-audio-and-pdfs" >}}

Each list item is one input, written as `{"text": ...}`, `{"image": ...}`, `{"video": ...}`, or `{"audio": ...}`, with a URL or a base64 string as the value. Some inputs follow different rules:

- **PDF:** send `{"pdf": ...}` as the whole `input`, one PDF per request, up to 8 MB.
- **Images:** up to 5 MB each.
- **Video:** the model samples 32 frames.
- **Combined inputs:** a `{"content": [...]}` item fuses several parts, for example a caption and an image, into one vector. The order of the parts affects the result.

## Multivector Output

`jina-colbert-v2` is a late-interaction model that returns one 128-dimensional vector per token, which Qdrant stores as a [multivector](/documentation/manage-data/vectors/#multivectors) and scores with MaxSim. It takes `input_type` instead of `task`, and the response carries `embeddings` instead of `embedding`. Store the vectors in a separate collection:

{{< code-snippet path="/documentation/headless/snippets/embeddings/jina-embeddings/" block="multivector-output" >}}

`jina-embeddings-v4` also returns multivectors when you set `return_multivector` to `true`. Jina AI notes that for most retrieval pipelines, a dense v5 model followed by a reranker gives better accuracy for the cost.

## Qdrant Cloud Inference

On Qdrant Cloud, Qdrant can call Jina AI for you. Instead of a vector, send a `Document` or an `Image` with the model name prefixed with `jinaai/`. Pass your Jina AI API key in the `jina-api-key` request header or in the `options` object. Qdrant does not store the key, so send it with every request. Jina AI parameters such as `dimensions` also go in `options`, and the collection's vector size must match them, which is 512 in these examples. The examples use `jina-clip-v2` to embed an image and search it with text.

To ingest an image:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai-upsert/" >}}

To search with text:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai-query/" >}}

For other ways to pass the key, see [External Providers](/documentation/inference/external-inference-providers/#jina-ai).

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Filter search results](/documentation/search/filtering/) by payload fields, for example to search only images.
- [Jina AI Embedding API documentation](https://jina.ai/embeddings/), which lists every model, input type, and parameter.
- [Combine Jina AI vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
