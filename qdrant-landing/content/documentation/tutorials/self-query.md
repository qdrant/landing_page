---
title: Self Query Retrieval
weight: 24
---

# Self Query Retrieval

In this tutorial, we’ll walk through how to create a vector-based search system for wine reviews using Qdrant. We will also touch on **self-query retrieval**, a technique that makes querying smarter, more flexible, and more intuitive.

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/iaXFggqqGD0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></p>

We will explore how to:
- Set up a vector collection in Qdrant.
- Encode wine review data into vectors.
- Query for wine reviews based on specific criteria using self-query retrieval.

### What You’ll Need
- A dataset of wine reviews (we’ll use a sample dataset).
- Basic knowledge of Python.
- A running Qdrant instance (you can use [Qdrant Cloud](https://qdrant.tech/) or run it locally).

---

### Understanding Self-Query Retrieval

**Self-query retrieval** is an advanced method that enables automatic extraction of relevant information from a query. Unlike traditional search systems where users must manually specify filters and constraints, self-query retrieval allows the system to infer and apply those constraints automatically.

For example, in a search query like, "Show me US wines under $30 with a rating above 90," the system will automatically understand that:
- **Location** is set to "US".
- **Price** is less than $30.
- **Rating (points)** is greater than 90.

This approach saves users from needing to input explicit filters. Both the query and data are converted into vectors, enabling a more semantic and flexible search experience.

### How Self-Query Retrieval Works in Qdrant

In Qdrant, self-query retrieval leverages **semantic embeddings** to represent both the query and the data points. By using the vector representation of the query, we can match it against the vectors in our collection and filter based on inferred constraints. This method makes the search process smarter and more user-friendly, as it doesn’t require precise keywords or filters from the user.

---

### Step 1: Preparing the Wine Review Dataset

We’ll start with a dataset of wine reviews. Each review has multiple attributes, such as country of origin, points (ratings), price, title, and variety. We’ll also add a text description of the wine. Here’s a sample dataset that we’ll use for this demonstration:

```python
import pandas as pd

# Sample dataset of wine reviews
wines = pd.DataFrame({
    'country': ['US', 'France', 'Italy'],
    'points': [95, 90, 88],
    'price': [50.0, 25.0, 15.0],
    'title': ['Wine A', 'Wine B', 'Wine C'],
    'variety': ['Cabernet Sauvignon', 'Pinot Noir', 'Chianti'],
    'description': [
        "A bold and structured wine with flavors of blackberry and oak.",
        "A smooth and silky Pinot Noir with notes of cherry and earth.",
        "A fruity Chianti with bright acidity and red fruit aromas."
    ]
})

# Show the dataset
print(wines)
```

The dataset contains reviews, including features like the wine’s **country**, **rating (points)**, **price**, and **description**.

### Step 2: Setting Up a Qdrant Collection

We’ll create a collection in Qdrant to store our wine review data. Each review will be converted into a vector using a sentence embedding model (explained in Step 3). Qdrant will store these vectors, which can be queried using semantic similarity.

```python
from qdrant_client import QdrantClient, models

# Connect to Qdrant
client = QdrantClient(host='localhost', port=6333)

# Create the 'wine_reviews' collection with vector size and distance metric
collection_name = "wine_reviews"
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=512,  # This depends on the encoder model's output size
        distance=models.Distance.COSINE  # Cosine distance for vector similarity
    )
)
```

The collection is named `wine_reviews`, and we set the vector size to 512, which is typical for sentence embeddings.

---

### Step 3: Encoding the Reviews

Next, we’ll convert the text of each wine review into vectors using a **sentence embedding model**. In this case, we’ll use the `SentenceTransformer` model from HuggingFace.

```python
from sentence_transformers import SentenceTransformer

# Load a sentence embedding model (adjust to your needs)
encoder = SentenceTransformer('all-MiniLM-L6-v2')

# Encode the wine descriptions into 512-dimension vectors
wines['vector'] = wines['description'].apply(lambda x: encoder.encode(x).tolist())

# Show the vectorized dataset
print(wines[['description', 'vector']].head())
```

For each wine review, the `description` field is encoded into a dense vector that captures the semantic meaning of the text. The `vector` field now holds 512-dimensional vectors, which Qdrant will use for efficient similarity search.

---

### Step 4: Structuring the Data

Each review will be stored as a document containing both the **vector** (encoded description) and **metadata** (such as country, points, and price). We’ll define a helper class to structure the data.

```python
# Helper class to structure documents
class Document:
    def __init__(self, page_content, metadata):
        self.page_content = page_content
        self.metadata = metadata

# Convert DataFrame rows into Document objects
def df_to_documents(df):
    documents = []
    for _, row in df.iterrows():
        metadata = {
            "country": row["country"],
            "points": row["points"],
            "price": row["price"],
            "title": row["title"],
            "variety": row["variety"]
        }
        document = Document(page_content=row["description"], metadata=metadata)
        documents.append(document)
    return documents

# Convert wine reviews into documents
docs = df_to_documents(wines)

# Print the first document
print(docs[0].metadata)
```

Each document consists of the encoded **description** (as `page_content`) and metadata such as **country**, **price**, and **points**. This metadata will help in filtering and fine-tuning queries later on.

---

### Step 5: Uploading Data to Qdrant

Now that we’ve encoded the wine reviews into vectors and structured the metadata, we’ll upload the data points into the Qdrant collection. Each point will include a vector and its corresponding metadata.

```python
# Create points for each wine review
points = [
    models.PointStruct(
        id=idx, 
        vector=doc.page_content,  # Encoded vector
        payload={'metadata': doc.metadata}  # Metadata
    )
    for idx, doc in enumerate(docs)
]

# Upload the points to Qdrant
client.upload_points(
    collection_name=collection_name,
    points=points
)
```

Each wine review is uploaded as a point in the collection, with both the vector representation and metadata attached to it.

---

### Step 6: Self-Query Retrieval in Action

Let’s use **self-query retrieval** to allow the system to infer relevant filters and conditions from a natural language query. Suppose we want to find US wines priced between $15 and $30 with a rating (points) above 90. Instead of manually constructing the query, the system will automatically parse these constraints.

```python
# Custom handler for displaying results
def query_handler(response):
    for result in response["result"]["matches"]:
        metadata = result['payload']['metadata']
        print(f"Title: {metadata['title']}, Price: {metadata['price']}, Points: {metadata['points']}")

# Natural language query for self-query retrieval
query = "Show me US wines under $30 with a rating above 90."

# Encode the query and filter the results using Qdrant
response = client.search(
    collection_name=collection_name,
    query_vector=encoder.encode(query).tolist(),
    filter=models.Filter(
        must=[
            models.FilterCondition(
                key="metadata.country",
                match=models.MatchValue(value="US")
            ),
            models.FilterCondition(
                key="metadata.price",
                range=models.ValueRange(gt=15, lt=30)
            ),
            models.FilterCondition(
                key="metadata.points",
                range=models.ValueRange(gt=90)
            )
        ]
    )
)

# Display the results
query_handler(response)
```

With this approach, we encoded the query into a vector and let the system extract and apply constraints automatically. The result is a semantic search that retrieves the most relevant wines based on both the vector representation and the metadata filters.

---

### Conclusion

In this tutorial, we demonstrated how to build a vector search system for wine reviews using Qdrant, enhanced by **self-query retrieval**. We showed how to encode reviews into vectors, store them in a Qdrant collection, and retrieve them based on natural language queries. By leveraging vector search and automatic query filtering, we’ve made the search process more intuitive and powerful.
