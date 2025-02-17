---
title: VectaX - Mirror Security
---

# VectaX - Mirror Security

VectaX by Mirror Security is an AI-centric access control and encryption system  designed for managing and protecting vector embeddings. It combines similarity-preserving encryption with fine-grained RBAC to enable secure storage, retrieval, and operations on vector data.

It can be integrated with Qdrant to secure vector searches.

We'll see how to do so, using basic VectaX vector encryption and the sophisticated RBAC mechanism. You can obtain an API key from the [Mirror Security Platform](https://platform.mirrorsecurity.io/en/login).

Let's set up both the VectaX and Qdrant clients.

```python
from mirror_sdk.core.mirror_core import MirrorSDK, MirrorConfig
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# Get your API key from
# https://platform.mirrorsecurity.io
config = MirrorConfig(
    api_key="<your_api_key>",
    server_url="https://mirrorapi.azure-api.net/v1",
    secret="<your_encrypt_secret>",
)
mirror_sdk = MirrorSDK(config)

# Connects to http://localhost:6333/ by default
qdrant = QdrantClient()
```

- Vector Encryption

We can now secure our vectors after we've retrieved them using VectaX encryption

```python
from qdrant_client.models import PointStruct
from mirror_sdk.core.models import VectorData

# Get the vector embeddings from your provider.
# embedding = generate_document_embedding()

vector_data = VectorData(vector=embedding, id="doc1")
encrypted = mirror_sdk.vectax.encrypt(vector_data)

point = PointStruct(
    id=0,
    vector=encrypted.ciphertext,
    payload={
        "content": "Document content",
        "iv": encrypted.iv,
        "auth_hash": encrypted.auth_hash
    }
)
qdrant.upsert(collection_name="vectax", points=[point])

# Get the vector embeddings from your provider.
# query_embedding = generate_query_embedding()

encrypted_query = mirror_sdk.vectax.encrypt(
    VectorData(vector=query_embedding, id="query")
)

results = qdrant.query_points(
    collection_name="vectax",
    query=encrypted_query.ciphertext,
    limit=5
).points
```

- Vector search with RBAC

```python
from mirror_sdk.core.models import RBACVectorData
from mirros_sdk.core import MirrorError
from qdrant_client import QdrantClient, models


class RBACQdrant:
    def __init__(self, mirror_sdk, qdrant: QdrantClient):
        self.sdk = mirror_sdk
        self.qdrant = qdrant

    def upsert_with_rbac(self, points: list[models.PointStruct], access_policies):
        records = []
        for point, policy in zip(points, access_policies):
            vector_data = RBACVectorData(
                vector=point.vector, id=point.id, access_policy=policy
            )
            encrypted = self.sdk.rbac.encrypt(vector_data)

            records.append(
                (
                    point.id,
                    encrypted.crypto.ciphertext,
                    {
                        "encrypted_header": encrypted.encrypted_header,
                        "access_policy": policy,
                        **point.payload,
                    },
                )
            )

        self.index.upsert(records)

    def query_with_rbac(self, collection_name: str, query_vector, user_key):
        query_data = RBACVectorData(vector=query_vector, id="query")
        encrypted_query = self.sdk.rbac.encrypt(query_data)

        results = self.qdrant.query_points(
            collection_name=collection_name, query=encrypted_query
        )

        verified_results = []
        for match in results.points:
            try:
                self.sdk.rbac.decrypt(
                    match.vector, match.payload["encrypted_header"], user_key
                )
                verified_results.append(match)
            except MirrorError:
                continue

        return verified_results
```

## Further Reading

- [Mirror Security Docs](https://docs.mirrorsecurity.io/introduction).
- [Mirror Security Blog](https://mirrorsecurity.io/blog)
