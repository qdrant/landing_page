---
title: Gemini
weight: 100
short_description: "Embed text, images, video, audio, and PDFs with Google gemini-embedding-2 and search them in Qdrant, with adjustable vector dimensions."
description: "Use Google gemini-embedding-2 and gemini-embedding-001 with Qdrant: dimensions, embedding, task prefixes, multimodal input, and dimension reduction."
directory:
  summary: "Multimodal embedding model for text, images, video, audio, and PDFs, with adjustable dimensions."
  input: [Text, Image, Video, Audio, PDF]
  vectors: [Dense]
  runs: [Provider API]
---

# Gemini

The [Gemini API](https://ai.google.dev/gemini-api/docs/embeddings) provides embedding models from Google. `gemini-embedding-2` maps text, images, video, audio, and PDFs into one vector space, so a text query can find an image or a video clip. Your application calls the Gemini API and sends the vectors to Qdrant.

## Models

| Model | Dimensions | Max Input Tokens | Input |
|---|---|---|---|
| `gemini-embedding-2` | 3072 (128 to 3072) | 8,192 | Text, image, video, audio, PDF |
| `gemini-embedding-001` | 3072 (128 to 3072) | 2,048 | Text |

Use `gemini-embedding-2` for new projects. `gemini-embedding-001` remains available for text-only workloads. The two models have incompatible vector spaces, so moving from one to the other means re-embedding all of your data.

Google recommends cosine similarity. Full-size vectors are normalized, and `gemini-embedding-2` also normalizes vectors you shorten with `output_dimensionality`. Shortened `gemini-embedding-001` vectors are not normalized, which the Cosine metric handles because Qdrant normalizes vectors in Cosine collections when it stores them.

`gemini-embedding-2` is also available on Google Cloud's [Gemini Enterprise Agent Platform](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/embedding-2) (formerly Vertex AI), through the same SDK with `genai.Client(vertexai=True, project=..., location=...)`. There, the SDK accepts one input per request.

## Setup

Install the Google Gen AI SDK and the Qdrant client:

- Python: `pip install google-genai qdrant-client`
- TypeScript: `npm install @google/genai @qdrant/js-client-rest`

Create both clients and a collection sized for the model. The Gemini client reads your API key from the `GEMINI_API_KEY` environment variable.

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="setup" >}}

## Embed Documents

`gemini-embedding-2` combines all the parts of one `Content` object into a single embedding. A plain list of strings is treated as one `Content`, so it returns one aggregated vector. To get one vector per document, wrap each document in its own `Content`. The response lists the embeddings in input order, which this example uses for the point IDs. Each document gets the `title: ... | text: ...` prefix that Google recommends for retrieval (see [Task Types](#task-types)), and the payload stores the original text. The SDK types the response fields as optional, so the Python example asserts that they're set:

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="embed-documents" >}}

Each input can be up to 8,192 tokens, and longer inputs are truncated without an error. For large datasets where latency does not matter, the [Batch API](https://ai.google.dev/gemini-api/docs/batch-api#batch-embedding) embeds at half the standard price. See [Upload Points](/documentation/manage-data/points/#upload-points) for batching on the Qdrant side.

## Embed Queries

Queries get a different prefix from documents. `task: search result | query: ...` tells the model that this text is a search query, while the `title: ... | text: ...` prefix marks the documents it should match:

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="embed-queries" >}}

## Task Types

`gemini-embedding-2` does not accept the `task_type` parameter. Write the task into the text instead, and use the same format for every document and query in a collection:

| Use Case | Query Format | Document Format |
|---|---|---|
| Search | `task: search result \| query: {content}` | `title: {title} \| text: {content}`, with `title: none` if there is no title |
| Question answering | `task: question answering \| query: {content}` | `title: {title} \| text: {content}` |
| Fact checking | `task: fact checking \| query: {content}` | `title: {title} \| text: {content}` |
| Code retrieval | `task: code retrieval \| query: {content}` | `title: {title} \| text: {content}` |

For classification and clustering, use `task: classification | query: {content}` or `task: clustering | query: {content}` for every input. Google advises against adding a prefix to the text part of a multimodal input.

`gemini-embedding-001` takes a `task_type` instead. For retrieval, embed documents with `RETRIEVAL_DOCUMENT` and queries with `RETRIEVAL_QUERY`, `QUESTION_ANSWERING`, `FACT_VERIFICATION`, or `CODE_RETRIEVAL_QUERY`. The model also supports `SEMANTIC_SIMILARITY`, `CLASSIFICATION`, and `CLUSTERING`. Unlike `gemini-embedding-2`, it returns one vector per string in a list:

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="task-types" >}}

## Embed Images, Video, Audio, and PDFs

`gemini-embedding-2` embeds files into the same vector space as text, so a collection of PDFs can be searched with the text query from [Embed Queries](#embed-queries). This example embeds a PDF and stores it in the same collection:

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="embed-images-video-audio-and-pdfs" >}}

Images, audio, and video work the same way with their MIME types, such as `image/png`, `audio/mpeg`, and `video/mp4`. All inputs share the 8,192-token limit, and each modality has its own limits:

- **Images:** up to 6 per request, PNG or JPEG.
- **Audio:** up to 180 seconds, MP3 or WAV.
- **Video:** up to 120 seconds, MP4 or MOV. The model samples at most 32 frames and ignores the audio track, so split longer videos into overlapping clips.
- **PDF:** one file per request, up to 6 pages, each page costing 258 tokens plus its text. Google recommends one page per PDF for the best quality.

To embed a text caption and an image as one item, for example a social media post, put both parts in the same `Content` and the model returns one aggregated vector. See [Embedding Aggregation](https://ai.google.dev/gemini-api/docs/embeddings#embedding-aggregation) in the Gemini docs.

## Reduce Vector Size

Both models use Matryoshka Representation Learning, so `output_dimensionality` can shorten the vector with little loss in quality. Google recommends 768, 1536, or 3072. Set the collection's `size` to the same value, and pass the same `output_dimensionality` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/gemini/" block="reduce-vector-size" >}}

To keep the full vectors but store them in less memory, use [quantization](/documentation/manage-data/quantization/).

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Filter search results](/documentation/search/filtering/) by payload fields, for example to search only PDFs.
- [Gemini embeddings documentation](https://ai.google.dev/gemini-api/docs/embeddings) and the [embeddings quickstart notebook](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Embeddings.ipynb).
- [Combine Gemini vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
