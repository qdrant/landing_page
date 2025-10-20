---
title: Isaacus
aliases: [ ../integrations/Isaacus/ ]
---

# Isaacus

[Isaacus](https://isaacus.com/) is a foundational legal AI research company building AI models, apps, and tools for the legal tech ecosystem.

Isaacus' offering includes [Kanon 2 Embedder](https://isaacus.com/blog/introducing-kanon-2-embedder), the world's best legal embedding model (as measured on the [Massive Legal Embedding Benchmark](https://isaacus.com/blog/introducing-mleb)), as well as [legal zero-shot classification](https://docs.isaacus.com/models/introduction#universal-classification) and [legal extractive question answering models](https://docs.isaacus.com/models/introduction#answer-extraction).

The Isaacus API is fully compatible with Qdrant, allowing for seamless integration of Isaacus' legal embeddings into Qdrant collections for efficient vector search and retrieval.

This guide walks you through the process of embedding legal documents with Isaacus' state-of-the-art Kanon 2 Embedder model and indexing them in a Qdrant collection for efficient search and retrieval.

## 1. Set up your Isaacus account

Head to the [Isaacus Platform](https://platform.isaacus.com/accounts/signup/) to [create a new account](https://platform.isaacus.com/accounts/signup/).

Once signed up, [add a payment method](https://platform.isaacus.com/billing/) to claim your free credits.

After adding a payment method, [create a new API key](https://platform.isaacus.com/users/api-keys/).

Make sure to keep your API key safe. You won't be able to see it again after you create it. But don't worry, you can always generate a new one.

## 2. Install dependencies

Now that your account is set up, install the Isaacus [Python](https://pypi.org/project/isaacus/) API client:

```bash
pip install isaacus
```

It is assumed that you have already installed and setup Qdrant, but if not, you can follow the [Qdrant installation guide](https://qdrant.tech/documentation/quickstart/).

## 3. Embed documents

With the Isaacus API client installed, let's embed our first legal documents and index them in Qdrant.

To start, you need to **initialize the client with your API key**. You can do this by setting the `ISAACUS_API_KEY` environment variable or by passing it directly, which is what we're doing in this example.

```python
import qdrant_client

from isaacus import Isaacus

isaacus_client = Isaacus(api_key="PASTE_YOUR_API_KEY_HERE")
client = qdrant_client.QdrantClient(":memory:")
```

Next, let's grab some legal documents to embed. For this example, we'll use [GitHub's terms of service](https://github.com/terms) and [Apple's terms of service](https://www.apple.com/legal/internet-services/terms/site.html).

```python
terms = [isaacus_client.get(path="https://examples.isaacus.com/github-tos.md", cast_to=str), 
         isaacus_client.get(path="https://examples.isaacus.com/apple-tos.md", cast_to=str)]
```

Now let's embed our documents using the `.embeddings.create()` method of our API client. We'll also make sure to flag that we're embedding documents by setting the `task` parameter to `"retrieval/document"`. This will help our embedder produce embeddings that are optimized specifically for being retrieved. We recommend always setting the `task` parameter to either `"retrieval/document"` or `"retrieval/query"` when using Isaacus embedders for retrieval tasks, even if the text in question is not strictly a document or a query, so long as one text is being treated as something to be retrieved, and the other as something to retrieve it with.

If necessary, you can also request a lower-dimensional embedding using the optional `dimensions` parameter, which can help speed up similarity comparisons and save on vector storage costs at the cost of some diminution in accuracy. The default (and maximum) dimensionality for Kanon 2 Embedder is $$1,792$$.

```python
documents_response = isaacus_client.embeddings.create(
    model="kanon-2-embedder",
    texts=terms,
    task="retrieval/document",
)
```

## 4. Index documents
Now, we'll unpack the embeddings from the response and convert them into Qdrant `PointStruct` objects, which we can then insert into a Qdrant collection.

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id=idx,
        vector=data.embedding,
        payload={"text": text[:50]}, # Store only the first 50 characters of the text for the sake of brevity.
    )
    for idx, (data, text) in enumerate(zip(documents_response.embeddings, terms))
]
```

We can use the Qdrant client's `create_collection` method to create a new collection for our documents. We'll specify the vector size (1,792 for Kanon 2 Embedder) and the distance metric (COSINE) to use for similarity comparisons.

```python
from qdrant_client.models import VectorParams, Distance

collection_name = "isaacus_collection"

client.create_collection(
    collection_name,
    vectors_config=VectorParams(
        size=1792, # Size of the Kanon 2 embedding vector
        distance=Distance.COSINE,
    ),
)
client.upsert(collection_name, points)
```

## 5. Search for documents
Now that we've indexed our documents in Qdrant, we're ready to search for relevant documents! Let's use the query 'What are GitHub's billing policies?' as an example, which should hopefully show GitHub's terms of service as more relevant than Apple's. This time, we'll embed the query with the `retrieval/query` task.

```python
query_vec = isaacus_client.embeddings.create(
    model="kanon-2-embedder",
    texts=["What are GitHub's billing policies?"],
    task="retrieval/query",
).embeddings[0].embedding

resp = client.query_points(
    collection_name=collection_name,
    query=query_vec,     
)

for p in resp.points:
    print(p.id, p.score, p.payload)
```
