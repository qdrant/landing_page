---
title: TwelveLabs
weight: 100
short_description: "Embed video, audio, images, and text with TwelveLabs Marengo 3.5 in one vector space, and run cross-modal search over the vectors in Qdrant."
description: "Use TwelveLabs Marengo 3.5 with Qdrant: dimensions, asynchronous video embedding, text, audio, and image queries, and smaller vectors with embedding_dimension."
directory:
  summary: "Marengo models that embed video, audio, images, text, and documents in one vector space."
  input: [Text, Image, Video, Audio, PDF]
  vectors: [Dense]
  runs: [Provider API]
---

# TwelveLabs

[TwelveLabs](https://docs.twelvelabs.io/v1.3/docs/guides/create-embeddings) provides Marengo, an embedding model that places video, audio, images, text, and documents in one vector space, so a query in one modality can find content in another. There are two ways to use Marengo with Qdrant:

- Call the TwelveLabs Embed API v2 from your application and send the vectors to Qdrant. This is what this page covers.
- Call Marengo 3.0 through [Amazon Bedrock](/documentation/embeddings/bedrock/) in your AWS account.

## Models

| Model | Dimensions | Max Text Tokens | Input |
|---|---|---|---|
| `marengo3.5` | 512 (default), 256, or 128 | 2,000 | Video, audio, image, text, and PDF, plain text, or Markdown documents |
| `marengo3.0` | 512 | 500 | Video, audio, image, and text |

Use `marengo3.5` for new projects. It has no length limit for video and audio, while Marengo 3.0 accepts up to 4 hours. Marengo 2.7 (`Marengo-retrieval-2.7`) and the Embed API v1 are previous generations. Embeddings from different Marengo versions are not compatible, so re-embed your content when you switch models.

TwelveLabs lists cosine similarity as the metric for Marengo, so create the collection with the Cosine distance.

## Setup

Install the TwelveLabs SDK and the Qdrant client:

- Python: `pip install twelvelabs qdrant-client`
- TypeScript: `npm install twelvelabs-js @qdrant/js-client-rest`

Create both clients and a collection sized for the model. These examples read your API key from the `TWELVE_LABS_API_KEY` environment variable. The Node.js SDK also reads it when you omit `apiKey`, but the Python SDK requires the `api_key` argument.

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="setup" >}}

## Embed Videos

TwelveLabs embeds video asynchronously. Create an embedding task, poll it until its status is `ready`, and read the embeddings from its `data` field. With `embedding_scope` set to `clip`, Marengo splits the video into segments and returns embeddings for each one. By default, Marengo 3.5 returns two embeddings per segment, one `visual` and one `audio`, and both are in the same vector space. The response has no index field, so this example uses the position in `data` as the point ID, and stores the modality and time range of each segment in the payload:

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="embed-videos" >}}

Each task embeds one file. Video URLs must be direct links to the raw file and can point to files up to 4 GB. To embed a local file, upload it first with `assets.create`, which accepts up to 200 MB, and pass the asset ID in `media_source`. The optional `segmentation` field sets fixed-length or scene-based segments. TwelveLabs keeps task results for seven days, so store the vectors in Qdrant when the task finishes. Audio files, images, and documents use the same task flow with `input_type` set to `audio`, `image`, or `document`.

## Embed Queries

Marengo has no separate query mode. Embed queries with the synchronous `embed.v_2.create` method and the same model as your content. It returns the embedding in the response instead of creating a task:

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="embed-queries" >}}

The synchronous method accepts up to 2,000 tokens of text and up to 10 media sources per request. Each media source can be up to 32 MB, and video and audio up to 30 seconds. For longer files, use an embedding task.

## Search Across Modalities

Because all modalities share one vector space, a query can be an audio clip or an image instead of text. Pass the file in `media_sources`. These examples also filter on the `embedding_option` payload field: the audio query searches the audio embeddings of the video, and the image query searches the visual embeddings.

To search with an audio clip:

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="search-across-modalities" >}}

To search with an image:

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="search-across-modalities-2" >}}

A single query can also combine text with media. Set both `input_text` and `media_sources`, give a media source a `name`, and refer to it in the text as `<@name>`. The result is one embedding.

## Reduce Vector Size

Marengo 3.5 accepts an `embedding_dimension` parameter of `512`, `256`, or `128`. Shorter vectors make the index smaller and search faster, and longer vectors give better retrieval quality. Set the collection's `size` to the same value, and pass the same `embedding_dimension` when you embed queries:

{{< code-snippet path="/documentation/headless/snippets/embeddings/twelvelabs/" block="reduce-vector-size" >}}

## Store and Search the Vectors

{{< embedding-next-steps >}}

## Next Steps

- [Filter search results](/documentation/search/filtering/) by payload fields such as `embedding_option`, `video_url`, or the segment time range.
- [Use named vectors](/documentation/manage-data/vectors/#named-vectors) to store visual and audio embeddings of a segment in one point.
- Read the TwelveLabs guides to [embed content at scale](https://docs.twelvelabs.io/v1.3/docs/guides/create-embeddings/at-scale) and to [embed a query](https://docs.twelvelabs.io/v1.3/docs/guides/create-embeddings/query).
- [Combine dense and sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Reduce memory use with quantization](/documentation/manage-data/quantization/).
