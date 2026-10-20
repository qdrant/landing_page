---
title: Ollama
weight: 100
short_description: "Embed documents and queries locally with Ollama models such as qwen3-embedding and embeddinggemma-2, and search them in Qdrant."
description: "Use Ollama embedding models with Qdrant: qwen3-embedding, embeddinggemma-2, and bge-m3 dimensions, query prompts, the /api/embed endpoint, and dimension reduction."
directory:
  summary: "Runs open embedding models such as Qwen3 Embedding and EmbeddingGemma 2 on your own hardware."
  input: [Text]
  vectors: [Dense]
  runs: [Self-hosted]
---

# Ollama

[Ollama](https://ollama.com) downloads open embedding models and serves them from your own machine through a local HTTP API on port 11434. Your application sends text to Ollama's `/api/embed` endpoint and stores the returned vectors in Qdrant, so the text never leaves your infrastructure.

## Models

Ollama lists its embedding models at [ollama.com/search?c=embedding](https://ollama.com/search?c=embedding). These are good starting points:

| Model | Dimensions | Max Tokens | Download Size |
|---|---|---|---|
| `qwen3-embedding:0.6b` | 1024 (reducible to 32) | 32,768 | 639 MB |
| `qwen3-embedding:4b` | 2560 (reducible to 32) | 32,768 | 2.5 GB |
| `qwen3-embedding:8b` (the default `qwen3-embedding` tag) | 4096 (reducible to 32) | 32,768 | 4.7 GB |
| `embeddinggemma-2:270m` | 768 (or 512, 256, 128) | 8,192 | 304 MB |
| `nomic-embed-text-v2-moe` | 768 (reducible to 256) | 512 | 958 MB |
| `bge-m3` | 1024 | 8,192 | 1.2 GB |

`nomic-embed-text`, `mxbai-embed-large`, `all-minilm`, and `embeddinggemma` are earlier models. For new projects, use a model from the Models table.

`/api/embed` returns vectors normalized to length 1, so the Cosine and Dot distance metrics rank results identically. Use Cosine.

## Setup

[Install Ollama](https://ollama.com/download) and pull the model:

```bash
ollama pull qwen3-embedding:0.6b
```

Install the Ollama SDK and the Qdrant client:

- Python: `pip install ollama qdrant-client`
- TypeScript: `npm install ollama @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The Python client connects to the address in the `OLLAMA_HOST` environment variable, or to `http://localhost:11434` if it's not set. The JavaScript client connects to `http://localhost:11434`.

{{< code-snippet path="/documentation/headless/snippets/embeddings/ollama/" block="setup" >}}

## Embed Documents

`embed` takes a list of inputs and returns one vector per input, in the same order. This example uses the position of each input as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/ollama/" block="embed-documents" >}}

Ollama truncates inputs that are longer than the model's context window. Pass `truncate=False` to get an error instead. Older code calls `embeddings` and the `/api/embeddings` endpoint, which take a single prompt. That method is deprecated in favor of `embed`.

## Embed Queries

Ollama sends text to the model as is. Qwen3 Embedding expects an instruction in front of each query, and none in front of documents:

{{< code-snippet path="/documentation/headless/snippets/embeddings/ollama/" block="embed-queries" >}}

Other models use different prompts. Add them in your code, because Ollama does not:

| Model | Query Prompt | Document Prompt |
|---|---|---|
| `qwen3-embedding` | `Instruct: {task}\nQuery:{query}` | None |
| `embeddinggemma-2` | `task: search result \| query: {query}` | `title: none \| text: {document}` |
| `nomic-embed-text-v2-moe` | `search_query: {query}` | `search_document: {document}` |
| `bge-m3` | None | None |

## Reduce Vector Size

`embed` accepts a `dimensions` parameter. Ollama keeps the leading values of each vector and normalizes the result again. Use it only with models trained for shortened vectors, such as `qwen3-embedding`, `embeddinggemma-2`, and `nomic-embed-text-v2-moe`. Set the collection's `size` to the same value, and pass the same `dimensions` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/ollama/" block="reduce-vector-size" >}}

## Next Steps

- [Upload points](/documentation/manage-data/points/#upload-points) in batches for larger datasets.
- [Combine Ollama vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Filter search results](/documentation/search/filtering/) by payload fields.
- Read the [Ollama embeddings guide](https://docs.ollama.com/capabilities/embeddings) and the [`/api/embed` reference](https://docs.ollama.com/api/embed).
