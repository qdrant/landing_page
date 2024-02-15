---
title: Authentication
weight: 30
---

# Authentication

This page shows you how to use the Qdrant Cloud Console to create a custom API key for a cluster. You will learn how to connect to your cluster using the new API key.

## Create API keys

The API key is only shown once after creation. If you lose it, you will need to create a new one. 
However, we recommend rotating the keys from time to time. To create additional API keys do the following.

1. Go to the [Cloud Dashboard](https://qdrant.to/cloud).
2. Select **Access Management** to display available API keys.
3. Click **Create** and choose a cluster name from the dropdown menu.
> **Note:** You can create a key that provides access to multiple clusters. Select desired clusters in the dropdown box.
4. Click **OK** and retrieve your API key. 

## Authenticate via SDK

Now that you have created your first cluster and key, you might want to access Qdrant Cloud from within your application.
Our official Qdrant clients for Python, TypeScript, Go, Rust, .NET and Java all support the API key parameter. 

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333 \
  --header 'api-key: <provide-your-own-key>'

# Alternatively, you can use the `Authorization` header with the `Bearer` prefix
curl \
  -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333 \
  --header 'Authorization: Bearer <provide-your-own-key>'
```

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    "xyz-example.eu-central.aws.cloud.qdrant.io",
    api_key="<paste-your-api-key-here>",
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  apiKey: "<paste-your-api-key-here>",
});
```

```csharp
using Qdrant.Client;

var client = new QdrantClient(
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<paste-your-api-key-here>"
);
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("xyz-example.eu-central.aws.cloud.qdrant.io:6334")
    .with_api_key("<paste-your-api-key-here>")
    .build()
    .unwrap();
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder(
                "xyz-example.eu-central.aws.cloud.qdrant.io",
                6334,
                true)
            .withApiKey("<paste-your-api-key-here>")
            .build());
```
