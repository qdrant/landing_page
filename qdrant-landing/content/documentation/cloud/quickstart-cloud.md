---
title: Quickstart
weight: 10
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
---

# Quickstart
This page shows you how to use the Qdrant Cloud Console to create a free tier cluster and then connect to it with Qdrant Client. 

## Step 1: Create a Free Tier cluster

1. Start in the **Overview** section of the Dashboard. 
2. Under **Set a Cluster Up** enter a **Cluster name**.
3. Click **Create Free Tier** and then **Continue**.
4. Under **Get an API Key**, select the cluster and click **Get API Key**.
5. Save the API key, as you won't be able to request it again. Click **Continue**. 
6. Save the code snippet provided to access your cluster. Click **Complete** to finish setup.

![Embeddings](/docs/cloud/quickstart-cloud.png)

## Step 2: Test cluster access

After creation, you will receive a code snippet to access your cluster. Your generated request should look very similar to this one:

```bash
curl \
  -X GET 'https://xyz-example.eu-central.aws.cloud.qdrant.io:6333' \
  --header 'api-key: <paste-your-api-key-here>'
```
Open Terminal and run the request. You should get a response that looks like this:

```bash
{"title":"qdrant - vector search engine","version":"1.4.1"}
```
> **Note:** The API key needs to be present in the request header every time you make a request via Rest or gRPC interface.

## Step 3: Authenticate via SDK

Now that you have created your first cluster and key, you might want to access Qdrant Cloud from within your application.
Our official Qdrant clients for Python, TypeScript, Go, Rust, and .NET all support the API key parameter. 

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
  "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<paste-your-api-key-here>"
);
```