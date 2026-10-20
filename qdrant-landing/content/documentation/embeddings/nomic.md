---
title: "Nomic"
weight: 100
short_description: "Embed text and images with nomic-embed-text-v1.5 and nomic-embed-vision-v1.5 through the Nomic API or FastEmbed, and search them in Qdrant."
description: "Use nomic-embed-text-v1.5 and nomic-embed-vision-v1.5 with Qdrant: dimensions, task types, Matryoshka sizes, image search, and local inference with FastEmbed."
directory:
  summary: "Open text and image embedding models with Matryoshka sizes, through the Nomic API or FastEmbed."
  input: [Text, Image]
  vectors: [Dense]
  runs: [Provider API, Self-hosted]
---

# Nomic

[Nomic](https://docs.nomic.ai/atlas/embeddings-and-retrieval/text-embedding) publishes open-weight text and image embedding models. There are two ways to use them with Qdrant:

- Call the Nomic API with the `nomic` Python SDK or over HTTP, and send the vectors to Qdrant. Most of this page covers this path.
- [Run the models locally with FastEmbed](#run-locally-with-fastembed), with no API key.

Both paths support `nomic-embed-text-v1.5` and `nomic-embed-vision-v1.5`. Embed documents and queries through the same path.

## Models

| Model | Dimensions | Max Input | Input |
|---|---|---|---|
| `nomic-embed-text-v1.5` | 768 (or 512, 256, 128, 64) | 8192 tokens | Text |
| `nomic-embed-vision-v1.5` | 768 | One PNG, JPEG, or WebP image | Image |

`nomic-embed-vision-v1.5` shares an embedding space with `nomic-embed-text-v1.5`, so text queries can retrieve images. `nomic-embed-text-v1` and `nomic-embed-vision-v1` are the previous generation. Use the v1.5 models for new projects. The multilingual `nomic-embed-text-v2-moe` is available on [Hugging Face](https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe), but neither the Nomic API nor FastEmbed serves it.

FastEmbed returns text vectors that are not normalized to length 1, so use the Cosine distance metric, which ignores vector length.

## Setup

Install the Nomic SDK and the Qdrant client:

- Python: `pip install nomic qdrant-client`
- TypeScript: `npm install @qdrant/js-client-rest`

Create an API key in [Nomic Atlas](https://atlas.nomic.ai/cli-login) and store it in the `NOMIC_API_KEY` environment variable. The Python SDK reads the credentials that `nomic login` saves, so run `nomic login $NOMIC_API_KEY` once. The TypeScript example calls the REST API directly and sends the key as a bearer token.

Create the Qdrant client and a collection sized for `nomic-embed-text-v1.5`:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="setup" >}}

## Embed Documents

Set `task_type` to `search_document` for the texts you store. The response lists embeddings in input order, so this example uses each input's position as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="embed-documents" >}}

Nomic does not document a per-request limit. The Python SDK splits long lists into requests of 10 texts, so batch large datasets in a similar way when you call the REST API directly. See [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

Set `task_type` to `search_query` for the query:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="embed-queries" >}}

Nomic Embed models were trained with a task prefix on every input, and the API adds the prefix that matches `task_type`: `search_document: ` for stored texts and `search_query: ` for queries. The API also accepts `classification` and `clustering`.

## Reduce Vector Size

`nomic-embed-text-v1.5` was trained with Matryoshka representation learning. To store shorter vectors, pass `dimensionality` with one of the Matryoshka sizes and set the collection's `size` to match. Pass the same `dimensionality` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="reduce-vector-size" >}}

Quality drops as the vectors get shorter. These are the MTEB scores from the [model card](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5):

| Dimensions | MTEB Score |
|---|---|
| 768 | 62.28 |
| 512 | 61.96 |
| 256 | 61.04 |
| 128 | 59.34 |
| 64 | 56.10 |

## Embed Images

`embed.image` accepts file paths, URLs, or Pillow images. Image-to-text scores are much lower than text-to-text scores, so store image vectors in a collection of their own instead of mixing them with text documents. This example embeds images and searches them with a text query:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="embed-images" >}}

## Run Locally with FastEmbed

[FastEmbed](/documentation/fastembed/) runs `nomic-ai/nomic-embed-text-v1.5` and `nomic-ai/nomic-embed-vision-v1.5` on your CPU with ONNX Runtime. The models download from Hugging Face on first use, and no API key is needed. `nomic-ai/nomic-embed-text-v1.5-Q` is a quantized variant at 0.13 GB instead of 0.52 GB. These examples use their own collections, so you can run them next to the Nomic API examples.

```bash
pip install fastembed qdrant-client
```

### Documents and Queries

The model was trained with task prefixes, and FastEmbed passes text to it unchanged, so add the `search_document: ` and `search_query: ` prefixes yourself:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="documents-and-queries" >}}

### Shorter Vectors

FastEmbed always returns 768 dimensions. To get a Matryoshka size, apply layer normalization, keep the first dimensions, and normalize the result, which is the procedure on the model card. Apply it to documents and queries alike, and size the collection to match:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="shorter-vectors" >}}

### Images

Image vectors from FastEmbed share the text model's embedding space, so a `search_query: ` text vector retrieves them:

{{< code-snippet path="/documentation/headless/snippets/embeddings/nomic/" block="images" >}}

## Next Steps

- [Use named vectors](/documentation/manage-data/vectors/#named-vectors) to keep text and image vectors on the same points.
- [Combine Nomic vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Learn more about FastEmbed](/documentation/fastembed/) and the other models it runs locally.
- Read the Nomic documentation on [text embeddings](https://docs.nomic.ai/atlas/embeddings-and-retrieval/text-embedding) and [image embeddings](https://docs.nomic.ai/atlas/embeddings-and-retrieval/image-embedding).
