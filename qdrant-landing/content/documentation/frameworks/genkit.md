---
title: Firebase Genkit
---

# Firebase Genkit

[Genkit](https://firebase.google.com/products/genkit) is a framework to build, deploy, and monitor production-ready AI-powered apps.

You can build apps that generate custom content, use semantic search, handle unstructured inputs, answer questions with your business data, autonomously make decisions, orchestrate tool calls, and more.

You can use Qdrant for indexing/semantic retrieval of data in your Genkit applications via the [Qdrant-Genkit plugin](https://github.com/qdrant/qdrant-genkit).

Genkit currently supports server-side development in JavaScript/TypeScript (Node.js) with Go support in active development.

## Installation

```bash
npm i genkitx-qdrant
```

## Configuration

To use this plugin, specify it when you call `configureGenkit()`:

```js
import { qdrant } from 'genkitx-qdrant';
import { textEmbeddingGecko } from '@genkit-ai/vertexai';

export default configureGenkit({
  plugins: [
    qdrant([
      {
        clientParams: {
          host: 'localhost',
          port: 6333,
        },
        collectionName: 'some-collection',
        embedder: textEmbeddingGecko,
      },
    ]),
  ],
  // ...
});
```

You'll need to specify a collection name, the embedding model you want to use and the Qdrant client parameters. In
addition, there are a few optional parameters:

- `embedderOptions`: Additional options to pass options to the embedder:

  ```js
  embedderOptions: { taskType: 'RETRIEVAL_DOCUMENT' },
  ```

- `contentPayloadKey`: Name of the payload filed with the document content. Defaults to "content".

  ```js
  contentPayloadKey: 'content';
  ```

- `metadataPayloadKey`: Name of the payload filed with the document metadata. Defaults to "metadata".

  ```js
  metadataPayloadKey: 'metadata';
  ```

- `collectionCreateOptions`: [Additional options](/documentation/concepts/collections/#create-a-collection/) when creating the Qdrant collection.

## Usage

Import retriever and indexer references like so:

```js
import { qdrantIndexerRef, qdrantRetrieverRef } from 'genkitx-qdrant';
import { Document, index, retrieve } from '@genkit-ai/ai/retriever';
```

Then, pass the references to `retrieve()` and `index()`:

```js
// To specify an indexer:
export const qdrantIndexer = qdrantIndexerRef({
  collectionName: 'some-collection',
  displayName: 'Some Collection indexer',
});

await index({ indexer: qdrantIndexer, documents });
```

```js
// To specify a retriever:
export const qdrantRetriever = qdrantRetrieverRef({
  collectionName: 'some-collection',
  displayName: 'Some Collection Retriever',
});

let docs = await retrieve({ retriever: qdrantRetriever, query });
```

You can refer to [Retrieval-augmented generation](https://firebase.google.com/docs/genkit/rag) for a general
discussion on indexers and retrievers.

## Further Reading

- [Introduction to Genkit](https://firebase.google.com/docs/genkit)
- [Genkit Documentation](https://firebase.google.com/docs/genkit/get-started)
- [Source Code](https://github.com/qdrant/qdrant-genkit)
