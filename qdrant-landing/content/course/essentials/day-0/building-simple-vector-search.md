---
title: Implementing a Basic Vector Search
weight: 2
---

{{< date >}} Day 0 {{< /date >}}

# Implementing a Basic Vector Search

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/_83L9ZIoOjM?si=ZTpn6fMXSjc_7JgL"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

Follow along as we build your first collection, insert vectors, and run similarity searches. This guided tutorial walks you through each step.

## Step 1: Install the Qdrant Client

To interact with Qdrant, we need the Python client. This enables us to communicate with the Qdrant service, manage collections, and perform vector searches.

```python
!pip install qdrant-client
```

## Step 2: Import Required Libraries

Import the necessary modules from the qdrant-client package. The QdrantClient class establishes connection to Qdrant, while the models module provides configurations for `Distance`, `VectorParams`, and `PointStruct`.

```python
from qdrant_client import QdrantClient, models
```

## Step 3: Connect to Qdrant Cloud

To connect to Qdrant Cloud, you need your cluster URL and API key from your Qdrant Cloud dashboard. Replace with your actual credentials:

```python
from qdrant_client import QdrantClient, models
from google.colab import userdata

client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

# Standard init (local)
# import os
# from dotenv import load_dotenv
# load_dotenv()
# client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
```

**Note:** You can also use in-memory mode for testing: `client = QdrantClient(":memory:")`, but data won't persist after restart.

## Step 4: Create a Collection

A [collection](/documentation/concepts/collections/) in Qdrant is like a table in relational databases - a container for storing vectors and their metadata. When creating a collection, specify:

- **Name**: A unique identifier for the collection
- **Vector Configuration**:
  - **Size**: The dimensionality of the vectors
  - **Distance Metric**: The method to measure similarity between vectors

```python
# Define the collection name
collection_name = "my_first_collection"

# Create the collection with specified vector parameters
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=4,  # Dimensionality of the vectors
        distance=models.Distance.COSINE  # Distance metric for similarity search
    )
)
```

Expected output: `True` (indicating successful creation)

**Distance metrics explained** ([learn more](/documentation/concepts/collections/#distance-metrics)):
- **Euclidean**: Measures straight-line distance between points in space
- **Cosine**: Measures the angle between vectors, focusing on orientation rather than magnitude
- **Dot**: Measures the dot product of vectors, capturing both magnitude and direction

## Step 5: Verify Collection Creation

Confirm that your collection was successfully created by retrieving the list of existing collections:

```python
# Retrieve and display the list of collections
collections = client.get_collections()
print("Existing collections:", collections)
```

The `get_collections()` method returns all collections in your Qdrant instance, useful for managing multiple collections dynamically.

## Step 6: Insert Points into the Collection

[Points](/documentation/concepts/points/) are the core data entities in Qdrant. Each point contains:

- **ID**: A unique identifier
- **Vector Data**: An array of numerical values representing the data point in vector space
- **Payload (Optional)**: Additional metadata as key-value pairs for filtering and categorization

```python
# Define the vectors to be inserted
points = [
    models.PointStruct(
        id=1,
        vector=[0.1, 0.2, 0.3, 0.4],  # 4D vector
        payload={"category": "example"}  # Metadata (optional)
    ),
    models.PointStruct(
        id=2,
        vector=[0.2, 0.3, 0.4, 0.5],
        payload={"category": "demo"}
    )
]

# Insert vectors into the collection
client.upsert(
    collection_name=collection_name,
    points=points
)
```

Expected output: `UpdateResult(operation_id=2, status=<UpdateStatus.COMPLETED: 'completed'>)`

## Step 7: Retrieve Collection Details

Now that we've inserted vectors, let's confirm they're stored correctly by getting collection information:

```python
collection_info = client.get_collection(collection_name)
print("Collection info:", collection_info)
```

Expected output: Detailed collection information showing `points_count=2`, vector configuration, and [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) settings.

## Step 8: Run Your First Similarity Search

Find the most similar vector to a given query using Qdrant's search capabilities:

**How Similarity Search Works:**
- Qdrant searches the collection to find the vectors that are closest to your query vector.
- The results are ranked by their similarity score, with the best matches appearing first.


```python
query_vector = [0.08, 0.14, 0.33, 0.28]

search_results = client.query_points(
    collection_name=collection_name,
    query=query_vector,
    limit=1  # Return the top 1 most similar vector
)

print("Search results:", search_results)
```

Expected output: `points=[ScoredPoint(id=1, score=0.97642946, payload={'category': 'example'})]`

## Step 9: Filtered Search

Refine your search using metadata filters. You can combine multiple [filtering conditions](/documentation/concepts/filtering/#filtering-conditions) using logical [filter clauses](/documentation/concepts/filtering/#filtering-clauses).

The most common clause is `must`, which acts like an `AND` operator: it ensures that all specified conditions are met for a point to be included in the results.

```python
search_filter = models.Filter(
    must=[
        models.FieldCondition(
            key="category",
            match=models.MatchValue(value="example"),  # This condition must be true
        )
    ]
)

client.update_collection(
    collection_name=collection_name,
    strict_mode_config=models.StrictModeConfig(unindexed_filtering_retrieve=True),
)

filtered_results = client.query_points(
    collection_name=collection_name,
    query=query_vector,
    query_filter=search_filter,
    limit=1,
)

print("Filtered search results:", filtered_results)
```

Expected output: Results matching both vector similarity and the category filter.

**Other available clauses include:**
-   **`should`**: At least one of the conditions must be met (like `OR`).
-   **`must_not`**: Ensures none of the specified conditions are met.
