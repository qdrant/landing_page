---
title: Cloud Quickstart
weight: 4
partition: cloud
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
  - cloud-quickstart
  - cloud/quickstart-cloud/
  - /documentation/quickstart-cloud/
---
# How to Get Started With Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/3hrQP3hh69Y?si=hypr-vyKywhjoOTQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>
<p style="text-align: center;">You can try vector search on Qdrant Cloud in three steps. 
</br> Instructions are below, but the video is faster:</p>

## Setup a Qdrant Cloud Cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or Github credentials.
2. Go to **Clusters** and follow the onboarding instructions under **Create First Cluster**. 

![create a cluster](/docs/gettingstarted/gui-quickstart/create-cluster.png)

3. When you create it, you will receive an API key. You will need to copy it and store it somewhere self. It will not be displayed again. If you loose it, you can always create a new one on the **Cluster Detail Page** later.

![get api key](/docs/gettingstarted/gui-quickstart/api-key.png)


## Access the Cluster UI

1. Click on **Cluster UI** on the **Cluster Detail Page** to access the cluster UI dashboard.
2. Paste your new API key here. You can revoke and create new API keys in the **API Keys** tab on your **Cluster Detail Page**.
3. The key will grant you access to your Qdrant instance. Now you can see the cluster Dashboard.

![access the dashboard](/docs/gettingstarted/gui-quickstart/access-dashboard.png)

## Authenticate via SDKs

Now that you have your cluster and key, you can use our official SDKs to access Qdrant Cloud from within your application.

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333 \
  --header 'api-key: <your-api-key>'

# Alternatively, you can use the `Authorization` header with the `Bearer` prefix
curl \
  -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333 \
  --header 'Authorization: Bearer <your-api-key>'
```

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    host="xyz-example.eu-central.aws.cloud.qdrant.io",
    api_key="<your-api-key>",
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  apiKey: "<your-api-key>",
});
```

```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
    .api_key("<your-api-key>")
    .build()?;
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
            .withApiKey("<your-api-key>")
            .build());
```

```csharp
using Qdrant.Client;

var client = new QdrantClient(
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<your-api-key>"
);
```

```go
import "github.com/qdrant/go-client/qdrant"

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.eu-central.aws.cloud.qdrant.io",
	Port:   6334,
	APIKey: "<your-api-key>",
	UseTLS: true,
})
```

## Try the Tutorial Sandbox

1. Open the interactive **Tutorial**. Here, you can test basic Qdrant API requests.
2. Using the **Quickstart** instructions, create a collection, add vectors and run a search.
3. The output on the right will show you some basic semantic search results.

![interactive-tutorial](/docs/gettingstarted/gui-quickstart/interactive-tutorial.png)

## That's Vector Search!
You can stay in the sandbox and continue trying our different API calls.</br>
When ready, use the Console and our complete REST API to try other operations.

## What's Next?

Now that you have a Qdrant Cloud cluster up and running, you should [test remote access](/documentation/cloud/authentication/#test-cluster-access) with a Qdrant Client.

For more about Qdrant Cloud, check our [dedicated documentation](/documentation/cloud-intro/). 
