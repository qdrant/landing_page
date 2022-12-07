---
title: Cloud
weight: 55
---

[Qdrant Cloud](https://qdrant.tech/surveys/cloud-request/) is an official SaaS offering of the Qdrant vector database. It provides the same 
fast and reliable similarity search engine, but without a need to maintain your own infrastructure. The transition from the on-premise 
to the cloud version of Qdrant does not require changing anything in the way you interact with the service, except for an API key that has 
to be provided to each request.

The transition is even easier if you use the official client libraries. For example, the [Python Qdrant client](/documentation/install/#python-client) 
has the support of the API key already built-in, so you only need to provide it once, when the `QdrantClient` instance is created.

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    host="xyz-example.eu-central.aws.staging-cloud.qdrant.io", 
    prefer_grpc=True,
    api_key="<<-provide-your-own-key->>",
)
```

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.staging-cloud.qdrant.io:6333 \
  --header 'api-key: <provide-your-own-key>'
