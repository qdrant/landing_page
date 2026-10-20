---
title: Amazon Bedrock
weight: 100
short_description: "Embed text with Amazon Titan Text Embeddings V2 and images with Amazon Nova Multimodal Embeddings on Amazon Bedrock, then search them in Qdrant."
description: "Use Amazon Bedrock embedding models with Qdrant: Titan Text Embeddings V2 for documents and queries, Nova Multimodal Embeddings for images, and model choices."
directory:
  summary: "Amazon Titan, Amazon Nova, Cohere, and TwelveLabs embedding models through Amazon Bedrock, in your AWS account."
  input: [Text, Image, Video, Audio]
  vectors: [Dense]
  runs: [Provider API]
---

# Amazon Bedrock

[Amazon Bedrock](https://aws.amazon.com/bedrock/) serves embedding models from Amazon, Cohere, and TwelveLabs through the AWS SDKs, inside your AWS account. Call Bedrock from your application and send the vectors to Qdrant.

## Models

| Model | Model ID | Dimensions | Max Input | Input |
|---|---|---|---|---|
| Amazon Titan Text Embeddings V2 | `amazon.titan-embed-text-v2:0` | 1024 (default), 512, 256 | 8,192 tokens | Text |
| Amazon Nova Multimodal Embeddings | `amazon.nova-2-multimodal-embeddings-v1:0` | 3072 (default), 1024, 384, 256 | 8K tokens, or 30 seconds of video or audio per request | Text, document image, image, video, audio |
| Cohere Embed v4 | `cohere.embed-v4:0` | 1536 (default), 1024, 512, 256 | 128K tokens | Text, image |
| TwelveLabs Marengo Embed 3.0 | `twelvelabs.marengo-embed-3-0-v1:0` | 512 | 500 tokens of text | Text, image, video, audio |

Each model has its own request and response format, documented on its [model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html). This page uses Titan Text Embeddings V2 for text and Nova Multimodal Embeddings for images. Titan Text Embeddings V2 succeeds Titan Embeddings G1 - Text (`amazon.titan-embed-text-v1`). Titan Multimodal Embeddings G1 (`amazon.titan-embed-image-v1`) and Cohere Embed English and Multilingual v3 (`cohere.embed-english-v3`, `cohere.embed-multilingual-v3`) are also previous generations. Use Nova Multimodal Embeddings or Cohere Embed v4 in their place.

Titan Text Embeddings V2 returns normalized vectors by default (`normalize: true`), so the Cosine and Dot distance metrics rank results identically. This page uses Cosine.

## Setup

Install the AWS SDK and the Qdrant client:

- Python: `pip install boto3 qdrant-client`
- TypeScript: `npm install @aws-sdk/client-bedrock-runtime @qdrant/js-client-rest`

The AWS SDKs read credentials from the default credential chain, such as the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables, the shared credentials file, AWS IAM Identity Center, or an IAM role when the code runs on AWS. They also accept an [Amazon Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) in the `AWS_BEARER_TOKEN_BEDROCK` environment variable. The identity needs the `bedrock:InvokeModel` permission. For details, see [Credentials](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) for Python and [Setting Credentials in Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) for JavaScript.

The examples use `us-east-1`, where both models on this page are available. Create both clients, a helper that embeds one text, and a collection sized for the model:

{{< code-snippet path="/documentation/headless/snippets/embeddings/bedrock/" block="setup" >}}

## Embed Documents

Titan Text Embeddings V2 embeds one text per request, so this example calls the helper for each document and uses the input order as the point ID:

{{< code-snippet path="/documentation/headless/snippets/embeddings/bedrock/" block="embed-documents" >}}

Each text can be up to 8,192 tokens or 50,000 characters. For large datasets, [batch inference](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html) processes many records as one job.

## Embed Queries

Titan Text Embeddings V2 has no separate query mode. Embed the query with the same model and `dimensions` as the documents:

{{< code-snippet path="/documentation/headless/snippets/embeddings/bedrock/" block="embed-queries" >}}

## Embed Images

Nova Multimodal Embeddings maps text, images, documents, video, and audio into one vector space, so a text query can find an image. Its vectors don't share a space with Titan's, so store them in a separate collection.

Set `embeddingPurpose` to `GENERIC_INDEX` when you index content of any type. For queries, pick the purpose that matches the indexed content, such as `IMAGE_RETRIEVAL` for images or `GENERIC_RETRIEVAL` for a mix of types. This example uses 1024 dimensions:

{{< code-snippet path="/documentation/headless/snippets/embeddings/bedrock/" block="embed-images" >}}

An inline request can be up to 25 MB after base64 encoding. Larger files, and video or audio longer than 30 seconds, go through the asynchronous `StartAsyncInvoke` API with input and output in Amazon S3. See [Using Amazon Nova Embeddings](https://docs.aws.amazon.com/nova/latest/nova2-userguide/embeddings.html) and the [request and response schema](https://docs.aws.amazon.com/nova/latest/userguide/embeddings-schema.html).

## Next Steps

- [Create a collection](/documentation/manage-data/collections/#create-a-collection) with named vectors to keep Titan and Nova vectors on the same points.
- [Upload points in batches](/documentation/manage-data/points/#upload-points) when you index a large dataset.
- [Combine Bedrock vectors with sparse vectors](/documentation/search/hybrid-queries/) for hybrid search.
- [Filter search results](/documentation/search/filtering/) by payload fields.
