---
title: NVIDIA
weight: 100
short_description: "Embed text and images with NVIDIA Nemotron models through the NVIDIA API or a self-hosted NIM, then store and search the vectors in Qdrant."
description: "Use NVIDIA nemotron-3-embed-1b and llama-nemotron-embed-vl-1b-v2 with Qdrant: passage and query modes, document, query, and image embedding, and NIM containers."
directory:
  summary: "NVIDIA Nemotron text and image embedding models, through the NVIDIA API or self-hosted NIM containers."
  input: [Text, Image]
  vectors: [Dense]
  runs: [Provider API, Self-hosted]
---

# NVIDIA

[NVIDIA](https://build.nvidia.com/explore/retrieval) provides Nemotron embedding models with separate passage and query modes. There are two ways to use them with Qdrant:

- Call the hosted NVIDIA API from your application and send the vectors to Qdrant. Most of this page covers this path.
- Run the model in a NIM container on your own GPUs and point the same code at it. See [Self-Host with NIM](#self-host-with-nim).

## Models

| Model | Dimensions | Max Tokens per Input | Input |
|---|---|---|---|
| `nvidia/nemotron-3-embed-1b` | 2048 | 4096 | Text |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | 2048 | 2048 | Text queries, image or text documents |

The API also serves older models, such as `nvidia/embed-qa-4` and `nvidia/llama-3.2-nv-embedqa-1b-v1`. Use `nvidia/nemotron-3-embed-1b` for new text projects.

NVIDIA doesn't name a distance metric for these models. Use Cosine, which doesn't depend on vector length.

## Setup

Install the OpenAI SDK and the Qdrant client. The NVIDIA API is OpenAI-compatible, and NVIDIA's own Python examples use the OpenAI SDK with NVIDIA's base URL. NVIDIA has no TypeScript SDK, so the TypeScript examples call the REST API with `fetch`.

- Python: `pip install openai qdrant-client`
- TypeScript: `npm install @qdrant/js-client-rest`

Create an API key on [build.nvidia.com](https://build.nvidia.com/nvidia/nemotron-3-embed-1b) and export it as the `NVIDIA_API_KEY` environment variable. Then create both clients and a collection sized for the model:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nvidia/" block="setup" >}}

## Embed Documents

Embed documents with `input_type` set to `passage`. Each item in the response carries the `index` of its input, which this example uses as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nvidia/" block="embed-documents" >}}

Each input can be up to 4096 tokens. The default `truncate` value, `NONE`, rejects longer inputs with an error, and `END` cuts them to fit.

## Embed Queries

Embed the query with the same model and `input_type` set to `query`. The model encodes passages and queries differently, and NVIDIA warns that using the wrong `input_type` causes large drops in retrieval accuracy.

{{< code-snippet path="/documentation/headless/snippets/embeddings/nvidia/" block="embed-queries" >}}

## Reduce Vector Size

`nvidia/nemotron-3-embed-1b` has no `dimensions` parameter and always returns 2048 values. To store smaller vectors, keep the first 1024 or 512 values of each embedding, for example `item.embedding[:1024]`, and set the collection's `size` to match. Shortened vectors must be normalized again before scoring, which Qdrant does on upload when the collection uses the Cosine distance. Shorten query vectors the same way.

## Embed Images

`nvidia/llama-nemotron-embed-vl-1b-v2` embeds documents as images, text, or both, and retrieves them with text queries. Pass each image as a PNG or JPEG data URL with `modality` set to `image`. Images are always documents, so they need `input_type` set to `passage`. This model's vectors don't share a space with `nvidia/nemotron-3-embed-1b`, so store them in a separate collection:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nvidia/" block="embed-images" >}}

## Self-Host with NIM

NVIDIA publishes `nvidia/nemotron-3-embed-1b` as a NIM container, `nvcr.io/nim/nvidia/nemotron-3-embed-1b`. It needs an NVIDIA GPU and an NGC API key to pull, and the [deploy guide](https://build.nvidia.com/nvidia/nemotron-3-embed-1b/deploy) has the `docker run` command. The container serves the same `/v1/embeddings` API on port 8000, so the code on this page works after you change the base URL to `http://localhost:8000/v1`. The deploy guide calls the local endpoint without an API key, but the OpenAI SDK needs a non-empty `api_key` value.

The [NeMo Retriever Embedding NIM support matrix](https://docs.nvidia.com/nim/nemo-retriever/embedding/latest/support-matrix.html) lists the models each NIM release serves, including Nemotron 3.5 Embed models that the hosted API doesn't offer.

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Use named vectors](/documentation/manage-data/vectors/#named-vectors) to keep text and image vectors on the same points.
- Read the [NVIDIA Embedding NIM API guide](https://docs.nvidia.com/nim/nemo-retriever/embedding/latest/use-the-api-openai.html) for embedding types, modality, and truncation options.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine NVIDIA vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
