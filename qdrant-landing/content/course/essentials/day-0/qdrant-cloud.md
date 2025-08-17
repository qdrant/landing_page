---
title: Setting Up Qdrant Cloud
weight: 1
---

{{< date >}} Day 0 {{< /date >}}

# Qdrant Cloud Setup

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

Qdrant Cloud is the fastest path to a production-grade vector database. In a few minutes you’ll have a managed endpoint with TLS, automatic backups, high availability options, and a simple API.

## Create a cluster

Sign in at [cloud.qdrant.io](https://cloud.qdrant.io) and create a cluster. Pick a region close to your users. The Free Tier is perfect for this course. Once deployed, open the cluster page to copy the HTTPS URL.

## Get an API key

From the cluster’s Access tab, create an API key. Store it in a secret manager or your local `.env` file during development.

```env
QDRANT_URL=https://YOUR-CLUSTER.cloud.qdrant.io:6333
QDRANT_API_KEY=YOUR_API_KEY
```

## Connect from Python

```python
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# quick health check
client.get_collections()
print("Connected to Qdrant Cloud")
```

Prefer environment variables over hard‑coding secrets. For quick tests only:

```python
from qdrant_client import QdrantClient
client = QdrantClient(url="https://…", api_key="…")
```

## Explore the Web UI

Most of Day 0 happens in the browser.

Collections
- Open your cluster → Collections → Create Collection. Name it, set vector size (e.g., 1536) and distance (Cosine is a solid default). Advanced options like named vectors, on‑disk payload, or HNSW/quantization can be left for later.

Points
- From the collection view, Add point or Upload. You can paste a vector and a small JSON payload, or import JSONL/CSV when you’re ready. Keep it simple for now—one or two points is enough to validate the pipeline.

Search
- Use the Search tab to run a nearest‑neighbor query. Provide a query vector and adjust top‑k. Add a filter on payload to see hybrid filtering in action. Inspect scores and payloads inline.

Snapshots & Access
- Snapshots let you create/restore backups. Access is where you manage API keys and IP allow‑lists. Use them before exposing your endpoint to other services.

## Curl checks (optional)

```bash
# service health
curl -s "$QDRANT_URL/healthz" -H "api-key: $QDRANT_API_KEY"

# list collections
curl -s "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"
```

## Good practices

Keep secrets out of code. Restrict access with IP allow‑lists or private networking. Rotate API keys regularly. Use HTTPS only. Enable RBAC and strict limits when exposing endpoints to untrusted clients.

## Troubleshooting

- Authentication error: verify the key and that requests include `api-key` header.
- Connection error: confirm the cluster status and region URL; corporate proxies may block outbound TLS.
- Dimension mismatch: the `size` in `VectorParams` must match your embedding width.) 