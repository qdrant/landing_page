---
title: Authentication
weight: 30
---

# Authentication

This page shows you how to use the Qdrant Cloud Console to create a custom API key for a cluster. You will learn how to connect to your cluster using the new API key.

## Create API keys

The API key is only shown once after creation. If you lose it, you will need to create a new one. 
However, we recommend rotating the keys from time to time. To create additional API keys do the following.

1. Go to the **Access** section in the Dashboard.
2. The **Access Management** list will display all available API keys.
3. Click **Create** and choose a cluster name from the dropdown menu.
> **Note:** You can create a key that provides access to multiple clusters. Simply check off which cluster in the dropdown
4. Click **OK** and retrieve your API key. 

## Authenticate via Python client

Now that you have created your first cluster and key, you might want to access Qdrant Cloud from within your application.
Our official Qdrant clients for Python, Go, and Rust all support the API key parameter. 

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    "xyz-example.eu-central.aws.staging-cloud.qdrant.io", 
    prefer_grpc=True,
    api_key="<<-provide-your-own-key->>",
)
```

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.staging-cloud.qdrant.io:6333 \
  --header 'api-key: <provide-your-own-key>'
```
