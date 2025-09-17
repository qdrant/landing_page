---
title: Setting Up Qdrant Cloud
weight: 1
---

{{< date >}} Day 0 {{< /date >}}

# Qdrant Cloud Setup

<iframe width="900" height="506"
  src="https://www.youtube.com/embed/3hrQP3hh69Y?rel=0"
  style="display:block; margin:40px auto;"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Qdrant Cloud is the fastest path to production-grade vector search. In a few minutes you'll have a managed endpoint with TLS, automatic backups, high availability options, and a simple API.

## Create your cluster

1. Register at [cloud.qdrant.io](https://cloud.qdrant.io/signup) with email, Google, or GitHub credentials.
2. Go to **Clusters** and follow the onboarding instructions under **Create First Cluster**.
3. Pick a region close to your users or application. The Free Tier is perfect for this course.
4. When you create the cluster, you'll receive an API key. Copy and store it securely. It won't be displayed again. You can create new keys later from the **API Keys** tab on your cluster detail page.

![Create cluster](/docs/gettingstarted/gui-quickstart/create-cluster.png)

![Get API key](/docs/gettingstarted/gui-quickstart/api-key.png)

## Access the Web UI

Click **Cluster UI** on your cluster detail page to access the dashboard. Paste your API key when prompted. The key grants access to your Qdrant instance and unlocks the full cluster dashboard.

![Access dashboard](/docs/gettingstarted/gui-quickstart/access-dashboard.png)

### What you can do in the Web UI

**Console**: Run REST API calls directly in the browser. Test endpoints, inspect responses, and debug queries without writing code. Perfect for exploring Qdrant's API surface.

**Collections**: Manage collections, view schemas, and upload snapshots. Create your first collection here: set a name, vector size (e.g., 1536 for OpenAI embeddings), and distance metric (Cosine is a solid default). Advanced options like named vectors, quantization, and [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) tuning can wait.

**Tutorial**: Interactive walkthrough with sample data and queries. Follow the quickstart instructions to create a collection, add vectors, and run semantic search. The output shows live results as you experiment.

![Interactive tutorial](/docs/gettingstarted/gui-quickstart/interactive-tutorial.png)

**Points**: Add individual points or bulk upload via JSONL/CSV. Start simple - paste a vector and small JSON payload to validate the pipeline. Use the Search tab to run nearest-neighbor queries, adjust top-k, and add payload filters to see hybrid filtering in action.

**Snapshots & Access**: Create and restore backups via [Snapshots](/documentation/concepts/snapshots/). Manage API keys and IP allow-lists in Access - essential before exposing your endpoint to other services.

## Connect from Python

Store credentials in environment variables for security:

```env
QDRANT_URL=https://YOUR-CLUSTER.cloud.qdrant.io:6333
QDRANT_API_KEY=YOUR_API_KEY
```

```python
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Quick health check
collections = client.get_collections()
print(f"Connected to Qdrant Cloud: {len(collections.collections)} collections")
```

For quick tests only (avoid hardcoding in production):

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
    api_key="your-api-key-here",
)
```

## Alternative connection methods

You can also authenticate using the `Authorization` header with Bearer token:

```bash
# Using api-key header
curl -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections \
  --header 'api-key: <your-api-key>'

# Using Authorization header  
curl -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections \
  --header 'Authorization: Bearer <your-api-key>'
```

## Quick validation

Test your connection:

```bash
# Service health
curl -s "$QDRANT_URL/healthz" -H "api-key: $QDRANT_API_KEY"

# List collections
curl -s "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"
```

## Good practices

- Keep secrets out of code; use environment variables or secret managers.
- Restrict access with IP allow-lists or private networking.
- Rotate API keys regularly from the cluster Access tab.
- Use HTTPS only; enable RBAC and strict limits when exposing endpoints to untrusted clients.

## Common issues

- **Authentication error**: Verify the API key and that requests include the `api-key` header.
- **Connection error**: Confirm cluster status and region URL; corporate proxies may block outbound TLS.
- **Dimension mismatch**: The `size` in `VectorParams` must match your embedding dimensions.

## What's next: Qdrant Cloud Inference

Beyond vector storage and search, Qdrant Cloud now offers **Cloud Inference**: managed embedding generation for text and images. Instead of running your own embedding models, you can generate vectors directly in Qdrant Cloud and seamlessly store them in your collections.

<iframe width="900" height="506"
  src="https://www.youtube.com/embed/nJIX0zhrBL4?rel=0"
  style="display:block; margin:40px auto;"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Cloud Inference simplifies your pipeline: send raw text or images to Qdrant, get back vectors and search results in one API call. Perfect for prototyping and production workloads where you want to eliminate the embedding infrastructure layer.

Learn more: [Qdrant Cloud Inference](/cloud-inference/) 