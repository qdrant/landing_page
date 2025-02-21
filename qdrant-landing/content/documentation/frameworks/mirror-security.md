---
title: VectaX - Mirror Security
---

![VectaX Logo](/documentation/frameworks/mirror-security/vectax-logo.png)

[VectaX](https://mirrorsecurity.io/vectax) by Mirror Security is an AI-centric access control and encryption system  designed for managing and protecting vector embeddings. It combines similarity-preserving encryption with fine-grained RBAC to enable secure storage, retrieval, and operations on vector data.

It can be integrated with Qdrant to secure vector searches.

We'll see how to do so using basic VectaX vector encryption and the sophisticated RBAC mechanism. You can obtain an API key and the Mirror SDK from the [Mirror Security Platform](https://platform.mirrorsecurity.io/en/login).

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

## Vector Encryption

Now, let's secure vector embeddings using VectaX encryption.

```python
from qdrant_client.models import PointStruct
from mirror_sdk.core.models import VectorData

# Generate or retrieve vector embeddings
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

# Encrypt a query vector for secure search
# query_embedding = generate_query_embedding(...)

encrypted_query = mirror_sdk.vectax.encrypt(
    VectorData(vector=query_embedding, id="query")
)

results = qdrant.query_points(
    collection_name="vectax",
    query=encrypted_query.ciphertext,
    limit=5
).points
```

## Vector Search with RBAC

RBAC allows fine-grained access control over encrypted vector data based on roles, groups, and departments.

### Defining Access Policies

```python
app_policy = {
    "roles": ["admin", "analyst", "user"],
    "groups": ["team_a", "team_b"],
    "departments": ["research", "engineering"],
}
mirror_sdk.set_policy(app_policy)
```

### Generating Access Keys

```python
# Generate a secret key for use by the 'admin' role holders.
admin_key = mirror_sdk.rbac.generate_user_secret_key(
    {"roles": ["admin"], "groups": ["team_a"], "departments": ["research"]}
)
```

### Storing Encrypted Data with RBAC Policies

We can now store data that is only accessible to users with the "admin" role.

```python
from mirror_sdk.core.models import RBACVectorData
from mirror_sdk.utils import encode_binary_data

policy = {
    "roles": ["admin"],
    "groups": ["team_a"],
    "departments": ["research"],
}
# vector_embedding = generate_vector_embedding(...)
vector_data = RBACVectorData(
    # Generate or retrieve vector embeddings
    vector=vector_embedding,
    id=1,
    access_policy=policy,
)
encrypted = mirror_sdk.rbac.encrypt(vector_data)

qdrant.upsert(
    collection_name="vectax",
    points=[
        models.PointStruct(
            id=1,
            vector=encrypted.crypto.ciphertext,
            payload={
                "encrypted_header": encrypted.encrypted_header,
                "encrypted_vector_metadata": encode_binary_data(
                    encrypted.crypto.serialize()
                ),
                "content": "My content",
            },
        )
    ],
)
```

### Querying with Role-Based Decryption

Using the admin key, only accessible data will be decrypted.

```python
from mirror_sdk.core import MirrorError
from mirror_sdk.core.models import MirrorCrypto
from mirror_sdk.utils import decode_binary_data

# Encrypt a query vector for secure search
# query_embedding = generate_query_embedding(...)

query_data = RBACVectorData(vector=query_embedding, id="query", access_policy=policy)
encrypted_query = mirror_sdk.rbac.encrypt(query_data)

results = qdrant.query_points(
    collection_name="vectax", query=encrypted_query.crypto.ciphertext, limit=10
)

accessible_results = []
for point in results.points:
    try:
        encrypted_vector_metadata = decode_binary_data(
            point.payload["encrypted_vector_metadata"]
        )
        mirror_data = MirrorCrypto.deserialize(encrypted_vector_metadata)
        admin_decrypted = mirror_sdk.rbac.decrypt(
            mirror_data,
            point.payload["encrypted_header"],
            admin_key,
        )
        accessible_results.append(
            {
                "id": point.id,
                "content": point.payload["content"],
                "score": point.score,
                "accessible": True,
            }
        )

    except MirrorError as e:
        print(f"Access denied for point {point.id}: {e}")

# Proceed to only use results within `accessible_results`.
```

## Further Reading

- [Mirror Security Docs](https://docs.mirrorsecurity.io/introduction)
- [Mirror Security Blog](https://mirrorsecurity.io/blog)
