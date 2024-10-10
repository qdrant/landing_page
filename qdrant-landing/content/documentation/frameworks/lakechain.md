---
title: AWS Lakechain
---

# AWS Lakechain

[Project Lakechain](https://awslabs.github.io/project-lakechain/) is a framework based on the AWS Cloud Development Kit (CDK), allowing to express and deploy scalable document processing pipelines on AWS using infrastructure-as-code. It emphasizes on modularity and extensibility of pipelines, and provides 60+ ready to use components for prototyping complex processing pipelines that scale out of the box to millions of documents.

The Qdrant storage connector available with Lakechain enables uploading vector embeddings produced by other middlewares to a Qdrant collection.

<aside role="status">You can find an end-to-end example usage of the Qdrant Lakechain connector <a a target="_blank" href="https://github.com/awslabs/project-lakechain/tree/main/examples/simple-pipelines/embedding-pipelines/bedrock-qdrant-pipeline">here.</a></aside>

To use the Qdrant storage connector, you import it in your CDK stack, and connect it to a data source providing document embeddings.

> You need to specify a Qdrant API key to the connector, by specifying a reference to an [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) secret containing the API key.

```typescript
import { QdrantStorageConnector } from '@project-lakechain/qdrant-storage-connector';
import { CacheStorage } from '@project-lakechain/core';

class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    const cache = new CacheStorage(this, 'Cache');

    const qdrantApiKey = secrets.Secret.fromSecretNameV2(
      this,
      'QdrantApiKey',
      process.env.QDRANT_API_KEY_SECRET_NAME as string
    );

    const connector = new QdrantStorageConnector.Builder()
      .withScope(this)
      .withIdentifier('QdrantStorageConnector')
      .withCacheStorage(cache)
      .withSource(source) // 👈 Specify a data source
      .withApiKey(qdrantApiKey)
      .withCollectionName('{collection_name}')
      .withUrl('https://xyz-example.eu-central.aws.cloud.qdrant.io:6333')
      .build();
  }
}
```

When the document being processed is a text document, you can choose to store the text of the document in the Qdrant payload. To do so, you can use the `withStoreText` and `withTextKey` options. If the document is not a text, this option is ignored.

```typescript
const connector = new QdrantStorageConnector.Builder()
  .withScope(this)
  .withIdentifier('QdrantStorageConnector')
  .withCacheStorage(cache)
  .withSource(source)
  .withApiKey(qdrantApiKey)
  .withCollectionName('{collection_name}')
  .withStoreText(true)
  .withTextKey('my-content')
  .withUrl('https://xyz-example.eu-central.aws.cloud.qdrant.io:6333')
  .build();
```

Since Qdrant supports [multiple vectors](/documentation/concepts/vectors/#named-vectors) per point, you can use the `withVectorName` option to specify one. The connector defaults to unnamed (default) vector.

```typescript
const connector = new QdrantStorageConnector.Builder()
      .withScope(this)
      .withIdentifier('QdrantStorageConnector')
      .withCacheStorage(cache)
      .withSource(source)
      .withApiKey(qdrantApiKey)
      .withCollectionName('collection_name')
      .withVectorName('my-vector-name')
      .withUrl('https://xyz-example.eu-central.aws.cloud.qdrant.io:6333')
      .build();
```

## Further Reading

- [Introduction to Lakechain](https://awslabs.github.io/project-lakechain/general/introduction/)
- [Lakechain Examples](https://github.com/awslabs/project-lakechain/tree/main/examples)
