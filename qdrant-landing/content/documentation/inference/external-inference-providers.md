---
title: External Providers
weight: 40
---

# External Embedding Model Providers

Qdrant Cloud can act as a proxy for the APIs of external embedding model providers:

- OpenAI
- Cohere
- Jina AI
- OpenRouter

This enables you to access any of the embedding models provided by these providers through the Qdrant API.

![Inference with an external embedding model provider](/docs/inference-external-provider.png)

When using an external embedding model, ensure that your collection has been configured for vectors with the correct dimensionality. Refer to the model's documentation for details on the output dimensions.

<aside role="status">
When using a model from an external provider, refer to the model's documentation for:

- the dimensions of the resulting embeddings
- how to pass an image when creating image embeddings. Some providers allow you to pass an image URL, while others require a base64-encoded image
- any additional parameters that the model supports
</aside>

## API Key

To use an external provider's embedding model, you need an API key from that provider. For example, to access OpenAI models, you need an OpenAI API key. Qdrant does not store or cache your API keys; they must be provided with each inference request.

Provide the provider's API key in the request header (`openai-api-key`, `cohere-api-key`, `jina-api-key`, or `openrouter-api-key`). For example:

{{< code-snippet path="/documentation/headless/snippets/inference/external-api-key-header/" >}}

Alternatively, provide the API key in the request body in the `options` object:

{{< code-snippet path="/documentation/headless/snippets/inference/external-api-key-body/" >}}

## OpenAI

When you prepend a model name with `openai/`, the embedding request is automatically routed to the [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings). 

For example, to use OpenAI's `text-embedding-3-large` model when ingesting data, prepend the model name with `openai/`. Provide your OpenAI API key in the request header (`openai-api-key`), or in the request body in the `options` object. Any OpenAI-specific API parameters can be passed using the `options` object. This example uses the OpenAI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/openai-upsert/" >}}

At query time, you can use the same model by prepending the model name with `openai/` and providing your OpenAI API key in the `options` object. This example again uses the OpenAI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/openai-query/" >}}

Note that, because Qdrant does not store or cache your OpenAI API key, you need to provide it with each inference request.

## Cohere

<aside role="status">Qdrant only supports version 2 of the Cohere Embed API.</aside>

When you prepend a model name with `cohere/`, the embedding request is automatically routed to the [Cohere Embed API](https://docs.cohere.com/reference/embed). 

For example, to use Cohere's multimodal `embed-v4.0` model when ingesting data, prepend the model name with `cohere/`. Provide your Cohere API key in the request header (`cohere-api-key`), or in the request body in the `options` object. This example uses the Cohere-specific API `output_dimension` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere-upsert/" >}}

Note that the Cohere `embed-v4.0` model does not support passing an image as a URL. You need to provide a base64-encoded image as a Data URL.

At query time, you can use the same model by prepending the model name with `cohere/` and providing your Cohere API key in the `options` object. This example again uses the Cohere-specific API `output_dimension` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/cohere-query/" >}}

Note that, because Qdrant does not store or cache your Cohere API key, you need to provide it with each inference request.

## Jina AI

When you prepend a model name with `jinaai/`, the embedding request is automatically routed to the [Jina AI Embedding API](https://jina.ai/embeddings/).

For example, to use Jina AI's multimodal `jina-clip-v2` model when ingesting data, prepend the model name with `jinaai/`. Provide your Jina AI API key in the request header (`jina-api-key`), or in the request body in the `options` object. This example uses the Jina AI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai-upsert/" >}}

At query time, you can use the same model by prepending the model name with `jinaai/` and providing your Jina AI API key in the `options` object. This example again uses the Jina AI-specific API `dimensions` parameter to reduce the dimensionality to 512:

{{< code-snippet path="/documentation/headless/snippets/inference/jinaai-query/" >}}

Note that, because Qdrant does not store or cache your Jina AI API key, you need to provide it with each inference request

## OpenRouter

OpenRouter is a platform that provides [several embedding models](https://openrouter.ai/models?fmt=cards&output_modalities=embeddings). To use one of the models provided by the [OpenRouter Embeddings API](https://openrouter.ai/docs/api/reference/embeddings), prepend the model name with `openrouter/`. 

For example, to use the `mistralai/mistral-embed-2312` model when ingesting data, prepend the model name with `openrouter/`. Provide your OpenRouter API key in the request header (`openrouter-api-key`), or in the request body in the `options` object.

{{< code-snippet path="/documentation/headless/snippets/inference/openrouter-upsert/" >}}

At query time, you can use the same model by prepending the model name with `openrouter/` and providing your OpenRouter API key in the `options` object:

{{< code-snippet path="/documentation/headless/snippets/inference/openrouter-query/" >}}

Note that, because Qdrant does not store or cache your OpenRouter API key, you need to provide it with each inference request.