---
title: Upstage
weight: 100
short_description: "Embed documents and queries with Upstage solar-embedding-2 passage and query models through the OpenAI SDK, and search them in Qdrant."
description: "Use Upstage solar-embedding-2-passage and solar-embedding-2-query with Qdrant: dimensions, OpenAI-compatible API, document and query embedding, and migration."
directory:
  summary: "Solar text embeddings with paired passage and query models, through an OpenAI-compatible API."
  input: [Text]
  vectors: [Dense]
  runs: [Provider API]
---

# Upstage

[Upstage](https://console.upstage.ai/docs/capabilities/embed) provides Solar Embedding models as a pair: a passage model for the documents you store and a query model for the searches you run. Both map text into the same vector space. The Upstage API is compatible with the OpenAI API, so your application calls it with the OpenAI SDK and sends the vectors to Qdrant.

## Models

| Model | Dimensions | Max Tokens per Input | Role |
|---|---|---|---|
| `solar-embedding-2-passage` | 1024 | 8,000 | Documents |
| `solar-embedding-2-query` | 1024 | 8,000 | Queries |

`solar-embedding-1-large-passage` and `solar-embedding-1-large-query` are the previous generation, with 4096-dimensional vectors and a 4,000-token limit. Upstage deprecates them on December 31, 2026, after which requests that name them return an error. The `embedding-passage` and `embedding-query` aliases still point to them. Use the `solar-embedding-2` names for new projects. Moving from Solar Embedding 1 means re-embedding your data into a new 1024-dimensional collection.

Upstage embeddings are normalized to length 1, so the Cosine and Dot distance metrics rank results identically. This page uses Cosine.

## Setup

Install the OpenAI SDK and the Qdrant client:

- Python: `pip install openai qdrant-client`
- TypeScript: `npm install openai @qdrant/js-client-rest`

Create an OpenAI client pointed at the Upstage API, the Qdrant client, and a collection sized for the model. These examples read your API key, which you can create in the [Upstage Console](https://console.upstage.ai/api-keys), from the `UPSTAGE_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/upstage/" block="setup" >}}

## Embed Documents

Embed documents with the passage model. One request embeds a list of inputs, and each item in the response carries the `index` of its input, which this example uses as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/upstage/" block="embed-documents" >}}

A request accepts up to 100 inputs and 204,800 tokens in total. Upstage lists a rate limit of 100 requests and 300,000 tokens per minute for these models, so split larger datasets into several requests, and see [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

Embed queries with the query model. The query model is tuned for short questions and search terms, and the passage model for the longer texts that answer them. Both write to the same vector space, so a query vector can be compared directly with the passage vectors in the collection:

{{< code-snippet path="/documentation/headless/snippets/embeddings/upstage/" block="embed-queries" >}}

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Use Binary Quantization](/documentation/manage-data/quantization/#binary-quantization) to store vectors in less memory.
- [Upstage embeddings documentation](https://console.upstage.ai/docs/capabilities/embed).
- [Filter search results](/documentation/search/filtering/) by payload fields.
- [Combine Upstage vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
