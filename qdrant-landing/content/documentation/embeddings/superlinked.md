---
title: Superlinked
weight: 100
short_description: "Serve dense, sparse, and ColBERT embeddings from the Superlinked Inference Engine (SIE) and search them in Qdrant, including hybrid search."
description: "Use the Superlinked Inference Engine (SIE) with Qdrant: sie-qdrant package, bge-m3 dense and sparse vectors, hybrid search with RRF, and ColBERT multivectors."
directory:
  summary: "Open-source inference server for 100+ dense, sparse, and multivector models, self-hosted or serverless."
  input: [Text]
  vectors: [Dense, Sparse, Multivector]
  runs: [Self-hosted, Provider API]
---

# Superlinked

The [Superlinked Inference Engine (SIE)](https://superlinked.com/docs) is an open-source server, under the Apache 2.0 license, that runs open embedding models behind one API. One model can return dense, sparse, and multivector (ColBERT) vectors from the same request. The `sie-qdrant` Python package wraps the SIE client and returns vectors in the format Qdrant expects. TypeScript applications use the SIE SDK, `@superlinked/sie-sdk`, directly. There are two ways to run SIE:

- Self-host the SIE server with Docker or Kubernetes. The examples on this page connect to `http://localhost:8080`.
- Call [SIE Serverless](https://superlinked.com/serverless) at `https://api.superlinked.com`, which reads your API key from the `SIE_API_KEY` environment variable.

## Models

The [Model Catalog](https://superlinked.com/models) lists every model SIE serves and the output types each one supports. These cover the examples on this page:

| Model | Output | Dimensions | Max Tokens |
|---|---|---|---|
| `BAAI/bge-m3` (the default) | Dense, sparse, multivector | 1024 | 8,192 |
| `Qwen/Qwen3-Embedding-0.6B` | Dense | 1024 | 32,768 |
| `jinaai/jina-colbert-v2` | Multivector | 128 per token | 8,192 |

Check each model's license before you use it. For example, `BAAI/bge-m3` is MIT-licensed, while `jinaai/jina-colbert-v2` is licensed for non-commercial use only (CC BY-NC 4.0).

Use the Cosine distance metric for dense vectors. It gives correct results whether or not a model normalizes its output.

## Setup

Start an SIE server, here the CPU image:

```bash
docker run -p 8080:8080 ghcr.io/superlinked/sie-server:latest-cpu-default
```

Install the SIE integration and the Qdrant client. In Python, `sie-qdrant` installs `sie-sdk` and `qdrant-client` as dependencies:

- Python: `pip install sie-qdrant`
- TypeScript: `npm install @superlinked/sie-sdk @qdrant/js-client-rest`

Create the SIE vectorizer, the Qdrant client, and a collection sized for the model. To use SIE Serverless instead, set `SIE_API_KEY` and pass `base_url="https://api.superlinked.com"` in Python, or call `new SIEClient()` with no URL in TypeScript.

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="setup" >}}

## Embed Documents

One call embeds a list of documents and returns the vectors in input order. This example uses the position of each document as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="embed-documents" >}}

## Embed Queries

`embed_query` marks the text as a query, so SIE applies query-specific encoding for models that need it, such as E5. In TypeScript, pass `isQuery: true`. For models without a query prompt, such as `BAAI/bge-m3`, queries and documents are embedded the same way.

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="embed-queries" >}}

## Hybrid Search with Dense and Sparse Vectors

`SIENamedVectorizer` asks for several output types in one SIE call and returns a dictionary keyed by output type. With `BAAI/bge-m3`, one call returns a dense vector and a learned sparse vector. Sparse vectors come back as `indices` and `values`, which is the format Qdrant stores natively.

Create a separate collection with a named dense vector and a named sparse vector, and upsert both:

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="hybrid-search-with-dense-and-sparse-vectors" >}}

To search, run a dense and a sparse query as prefetches and merge their results with Reciprocal Rank Fusion (RRF):

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="hybrid-search-with-dense-and-sparse-vectors-2" >}}

## ColBERT Multivectors

Late-interaction models such as `jinaai/jina-colbert-v2` return one vector per token. Qdrant stores them as a [multivector](/documentation/manage-data/vectors/#multivectors) and scores them with MaxSim on the server, so you don't compute late-interaction scores in your application. Store them in a separate collection:

{{< code-snippet path="/documentation/headless/snippets/embeddings/superlinked/" block="colbert-multivectors" >}}

## Vectorizer Options

`SIEVectorizer` and `SIENamedVectorizer` accept the same options. `SIENamedVectorizer` also takes `output_types`, which defaults to `["dense", "sparse"]` and must match the named vectors in your collection.

| Parameter | Default | Description |
|---|---|---|
| `base_url` | `http://localhost:8080` | SIE server URL |
| `model` | `BAAI/bge-m3` | Model to use, from the [Model Catalog](https://superlinked.com/models) |
| `instruction` | `None` | Instruction prefix for instruction-tuned models |
| `output_dtype` | `None` | Output data type: `float32`, `float16`, `int8`, or `binary` |
| `gpu` | `None` | GPU type to route requests to |
| `options` | `None` | Model-specific options |
| `timeout_s` | `180.0` | Request timeout in seconds |

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Learn how hybrid queries work](/documentation/search/hybrid-queries/), including other fusion methods.
- [Configure multivectors](/documentation/manage-data/vectors/#multivectors) for ColBERT and other late-interaction models.
- Read the [SIE Qdrant integration guide](https://superlinked.com/docs/integrations/qdrant) and the [SIE quickstart](https://superlinked.com/docs/quickstart).
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
