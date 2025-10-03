---
title: Qdrant Cloud Setup
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
2. Go to **Clusters** and select **Create a Free Cluster**. The Free Tier is perfect for this course.

![Create cluster](/docs/gettingstarted/gui-quickstart/create-cluster.png)

3. Pick a region close to your users or application. 
4. When you create the cluster, you'll receive an API key. Copy and store it securely. It won't be displayed again. You can create new keys later from the **API Keys** tab on your cluster detail page.

![Get API key](/docs/gettingstarted/gui-quickstart/api-key.png)


## Access the Web UI

1. Click **Cluster UI** on the top right corner of your cluster detail page to access the dashboard.

![Access dashboard](/docs/gettingstarted/gui-quickstart/access-dashboard.png)

### What you can do in the Web UI

The Qdrant Web UI is a powerful tool for developers to manage collections, inspect data, and debug search performance.

#### Main Navigation

**Console**: Run REST API calls directly in the browser. Test endpoints, inspect responses, and debug queries without writing code. This is perfect for exploring Qdrant's full API surface.

**Collections**: View and manage all collections in your cluster. From here, you can create new collections, upload snapshots, and get a high-level overview of their status, size, and configuration.

**Tutorial**: Follow an interactive walkthrough with sample data and queries to create a collection, add vectors, and run a semantic search. The output shows live results as you experiment.

![Interactive tutorial](/docs/gettingstarted/gui-quickstart/interactive-tutorial.png)

**Datasets**: Bulk-load data for experimentation by importing pre-configured public datasets directly into your cluster. This is the fastest way to get started with a meaningful amount of data.

#### Inside a Collection

When you select a collection, 

![Select collection](/docs/gettingstarted/gui-quickstart/select-collection.png)

you gain access to a detailed dashboard with the following tabs:

![Collection points](/docs/gettingstarted/gui-quickstart/collection-points.png)

*   **Points Tab**: Inspect, search, and manage individual data points. The search bar allows you to find points by ID or filter them using key-value pairs from their payload (e.g., `colony: "Mars"`). For each point, you can:
    *   View its payload and vector(s).
    *   Click **Find Similar** to perform an ad-hoc similarity search.
    *   Click **Open Graph** to jump to a visualization of its connections in the HNSW graph.

*   **Info Tab**: Provides a comprehensive overview of the collection's health, configuration, and statistics. Key metrics include:
    *   `status`: `green` indicates the collection is healthy.
    *   `points_count`: The total number of active data points.
    *   `indexed_vectors_count`: The number of points currently included in the HNSW index. If this lags behind `points_count`, it indicates that background indexing is in progress.
    *   `config`: A detailed JSON view of all collection parameters, from vector configuration to optimizer settings.

*   **Cluster Tab**: Visualizes the distribution of the collection's shards across the cluster nodes. This is essential for monitoring health, identifying hot spots, and verifying shard placement in a distributed deployment.

*   **Search Quality Tab**: An advanced tool for evaluating and benchmarking the precision of your vector search against a ground-truth dataset. It helps you tune parameters and measure the impact on retrieval accuracy.

*   **Snapshots Tab**: Manage backups for this specific collection. You can create a new [snapshot](/documentation/concepts/snapshots/) of the collection's current state, which can be restored later or migrated to another cluster.

*   **Visualize Tab**: Explore the structure of your vector space with an interactive 2D projection of your data points. This tab helps you understand clusters, identify outliers, and get an intuition for how your embeddings are distributed.

*   **Graph Tab**: Offers an interactive visualization of the HNSW graph structure. Starting from a specific point, you can explore its nearest neighbors and see the connections that Qdrant uses to enable fast, efficient search. It's an excellent tool for debugging and understanding how HNSW works.

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

## Qdrant Cloud Inference

Beyond vector storage and search, Qdrant Cloud now offers **[Cloud Inference](/cloud-inference/)**: managed embedding generation for text and images. Instead of running your own embedding models, you can generate vectors directly in Qdrant Cloud and seamlessly store them in your collections. 

<iframe width="900" height="506"
  src="https://www.youtube.com/embed/nJIX0zhrBL4?rel=0"
  style="display:block; margin:40px auto;"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>

Cloud Inference simplifies your pipeline: send raw text or images to Qdrant, get back vectors and search results in one API call. Perfect for prototyping and production workloads where you want to eliminate the embedding infrastructure layer.

Learn more: [Qdrant Cloud Inference](/documentation/cloud/inference/)