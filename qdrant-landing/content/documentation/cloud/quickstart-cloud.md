---
title: Cloud Quickstart
weight: 10
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
---

# Cloud Quickstart
This page shows you how to use the Qdrant Cloud Console to create a free tier cluster and then connect to it with Qdrant Client. 

## Create a Free Tier cluster

1. Start in the **Overview** section of the [Cloud Dashboard](https://cloud.qdrant.io/). 
1. Find the dashboard menu in the left-hand pane. If you do not see it, select
   the icon with three horizonal lines in the upper-left of the screen
1. Select **Clusters**. On the Clusters page, select **Create**.
1. In the **Create a Cluster** page, select **Free**
1. Scroll down. Confirm your cluster configuration, and select **Create**.

You should now see your new free tier cluster in the **Clusters** menu.

A free tier cluster includes the following resources:

| Resource   | Value |
|------------|-------|
| RAM        | 1 GB  |
| vCPU       | 0.5   |
| Disk space | 4 GB  |
| Nodes      | 1     |

## Get an API key

To use your cluster, you need an API key. Read our documentation on [Cloud
Authentication](/documentation/cloud/authentication/) for the process. 

## Test cluster access

After creation, you will receive a code snippet to access your cluster. Your generated request should look very similar to this one:

```bash
curl \
  -X GET 'https://xyz-example.eu-central.aws.cloud.qdrant.io:6333' \
  --header 'api-key: <paste-your-api-key-here>'
```
Open Terminal and run the request. You should get a response that looks like this:

```bash
{"title":"qdrant - vector search engine","version":"1.8.1"}
```

> **Note:** You need to include the API key in the request header for every
> request over REST or gRPC.

## Authenticate via SDK

Now that you have created your first cluster and API key, you can access the
Qdrant Cloud from within your application.
Our official Qdrant clients for Python, TypeScript, Go, Rust, and .NET all
support the API key parameter. 

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

```csharp
using Qdrant.Client;

var client = new QdrantClient(
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<paste-your-api-key-here>"
);
```
