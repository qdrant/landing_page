---
title: Voyage AI
weight: 100
short_description: "Embed text and images with Voyage AI voyage-4 and voyage-multimodal-3.5 models and search them in Qdrant, or run voyage-4-nano locally."
description: "Use Voyage AI models with Qdrant: the Voyage 4 series, document and query input types, vector size reduction, image embedding, and local voyage-4-nano."
directory:
  summary: "Text, code, and multimodal embedding models, plus the open-weight voyage-4-nano for local use."
  input: [Text, Image, Video]
  vectors: [Dense]
  runs: [Provider API, Self-hosted]
---

# Voyage AI

[Voyage AI](https://docs.voyageai.com/docs/embeddings) provides text, code, and multimodal embedding models. There are two ways to use them with Qdrant:

- Call the Voyage AI API from your application and send the vectors to Qdrant. This is what most of this page covers.
- Run the open-weight [`voyage-4-nano`](#run-voyage-4-nano-locally) model on your own hardware.

## Models

| Model | Dimensions | Context | Input |
|---|---|---|---|
| `voyage-4-large` | 1024 (default), 2048, 512, 256 | 32,000 tokens | Text |
| `voyage-4` | 1024 (default), 2048, 512, 256 | 32,000 tokens | Text |
| `voyage-4-lite` | 1024 (default), 2048, 512, 256 | 32,000 tokens | Text |
| `voyage-code-4` | 1024 (default), 2048, 512, 256 | 32,000 tokens | Text (code) |
| `voyage-multimodal-3.5` | 1024 (default), 2048, 512, 256 | 32,000 tokens | Text, images, video |
| `voyage-4-nano` (open weights) | 2048 (default), 1024, 512, 256 | 32,000 tokens | Text |

`voyage-4-large` targets retrieval quality, `voyage-4` balances quality and cost, and `voyage-4-lite` targets latency and cost. The Voyage 4 series models, including `voyage-4-nano`, share an embedding space, so you can index with one model and query with another. Voyage AI also offers the domain models `voyage-finance-2` and `voyage-law-2`. Earlier general-purpose models, such as `voyage-3.5`, `voyage-3-large`, and `voyage-large-2`, are the previous generation. Use a Voyage 4 series model for new projects.

Voyage AI embeddings are normalized to length 1, so the Cosine, Dot, and Euclidean distance metrics rank results identically. These examples use Cosine.

## Setup

Install the Voyage AI SDK and the Qdrant client:

- Python: `pip install voyageai qdrant-client`
- TypeScript: `npm install voyageai @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The Voyage AI client reads your API key from the `VOYAGE_API_KEY` environment variable. To create a key, see [API Key and Installation](https://docs.voyageai.com/docs/api-key-and-installation).

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="setup" >}}

## Embed Documents

Set `input_type` to `document` for content you store. The vectors come back in input order, and each item of the API response carries the `index` of its input. These examples use that position as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="embed-documents" >}}

A request accepts up to 1,000 texts. The total token limit per request is 120,000 for `voyage-4-large`, 320,000 for `voyage-4`, and 1,000,000 for `voyage-4-lite`. Split larger datasets into several requests, and see [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

Set `input_type` to `query` for search queries. Voyage AI prepends a retrieval prompt that differs for queries and documents, which tailors each vector for retrieval:

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="embed-queries" >}}

## Reduce Vector Size

The models in the Models table with several dimensions accept an `output_dimension` parameter (`outputDimension` in TypeScript). Set the collection's `size` to the same value, and pass the same `output_dimension` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [Quantization](/documentation/manage-data/quantization/).

## Embed Images

`voyage-multimodal-3.5` embeds text, images, and video in one embedding space, so a text query can find an image. It's not part of the Voyage 4 series, so store its vectors in a separate collection. In Python, each input is a list that can mix strings and Pillow images:

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="embed-images" >}}

A request accepts up to 1,000 inputs and 320,000 tokens in total. Each image can be up to 16 million pixels and 20 MB. For video input, see [Multimodal Embeddings](https://docs.voyageai.com/docs/multimodal-embeddings).

## Run voyage-4-nano Locally

`voyage-4-nano` is an open-weight model on [Hugging Face](https://huggingface.co/voyageai/voyage-4-nano), released under the Apache 2.0 license, with about 340 million parameters. The Python SDK runs it locally through sentence-transformers, without an API key. It requires Python 3.10 or later:

```bash
pip install "voyageai[local]"
```

Pass `voyage-4-nano` as the model, with the same calls as the API models. Because it shares the Voyage 4 embedding space, this example embeds a query locally and searches the documents indexed with `voyage-4-large` in [Embed Documents](#embed-documents). Set `output_dimension` to match the collection's vector size:

{{< code-snippet path="/documentation/headless/snippets/embeddings/voyage/" block="run-voyage-4-nano-locally" >}}

To run without the API entirely, embed the documents with `voyage-4-nano` too.

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- Read the [Voyage AI embeddings documentation](https://docs.voyageai.com/docs/embeddings) for model details.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine Voyage AI vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
