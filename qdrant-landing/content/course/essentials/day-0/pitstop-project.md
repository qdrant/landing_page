---
title: "Project: Building Your First Vector Search System"
weight: 4
---

{{< date >}} Day 0 {{< /date >}}

# Project: Building Your First Vector Search System

Time to apply what you've learned. You'll create a complete, working vector search system from scratch.

## Your Mission

Build a functional vector search system that demonstrates the core concepts: collections, points, similarity search, and filtering. You'll design simple 4-dimensional vectors that represent different concepts or items.

**Estimated Time:** 30 minutes

## What You'll Build

A working search system with:
- One collection with 4-dimensional vectors and Cosine distance
- 5–10 points with hand-crafted vectors and meaningful payloads
- Basic similarity search to find nearest neighbors
- Filtered search combining similarity with payload conditions

## Setup

### Prerequisites
- Qdrant Cloud cluster (URL + API key)
- Python 3.9+ (or Colab)
- Required packages: `qdrant-client`, `python-dotenv`.

### Models
- None. We will create vectors by hand.

### Dataset
- None. We will create our own data points.

Before creating data, decide what each of the four dimensions in your vectors will represent. This is the creative part of vector search!

**Example Ideas:**
- **Product categories**: Create vectors where each dimension represents a feature (affordability, quality, popularity, innovation). Electronics might be `[0.8, 0.7, 0.9, 0.6]`, while books could be `[0.3, 0.9, 0.4, 0.8]`.
- **Color palettes**: Each dimension represents color intensity (red, green, blue, brightness). Bright red: `[0.9, 0.1, 0.1, 0.8]`, forest green: `[0.1, 0.8, 0.2, 0.5]`.
- **Data types**: Dimensions for structure, size, complexity, frequency. Spreadsheets: `[0.9, 0.6, 0.3, 0.7]`, images: `[0.2, 0.8, 0.5, 0.4]`.
- **Movie genres**: Action, drama, comedy, sci-fi intensities. Action thriller: `[0.9, 0.3, 0.1, 0.7]`, romantic comedy: `[0.1, 0.6, 0.9, 0.2]`.

For this tutorial, we'll use the **Product Categories** concept.

## Build Steps
### Step 1: Initialize Client
```python
from qdrant_client import QdrantClient, models
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))
```

### Step 2: Create Collection
```python
collection_name = "day0_first_system"
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)

# Create payload index right after creating the collection and before uploading any data to enable filtering.
# If you add it later, HNSW won't rebuild automatically—bump ef_construct (e.g., 100→101) to trigger a safe rebuild.
client.create_payload_index(
    collection_name=collection_name,
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```


### Step 3: Insert Points

We use dummy embeddings.

```python
points=[
    models.PointStruct(
        id=1,
        vector=[0.9, 0.1, 0.1, 0.8], # High affordability, high innovation
        payload={"name": "Budget Smartphone", "category": "electronics", "price": 299},
    ),
    models.PointStruct(
        id=2,
        vector=[0.2, 0.9, 0.8, 0.5], # High quality, high popularity
        payload={"name": "Bestselling Novel", "category": "books", "price": 19},
    ),
    models.PointStruct(
        id=3,
        vector=[0.8, 0.3, 0.2, 0.9], # High affordability, high innovation (similar to ID 1)
        payload={"name": "Smart Home Hub", "category": "electronics", "price": 89},
    ),
    # Add 2-5 more points to experiment with...
]

client.upsert(collection_name=collection_name, points=points)
```

### Step 5: Test Searches
```python
# Define a query vector for "affordable and innovative"
query_vector = [0.85, 0.2, 0.1, 0.9]

# 1. Basic similarity search
basic_results = client.query_points(collection_name, query=query_vector)

# 2. Filtered search (only find electronics)
filtered_results = client.query_points(
    collection_name,
    query=query_vector,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="category", match=models.MatchValue(value="electronics"))]
    ),
)
print("Filtered search results:", filtered_results)
```

## Success Criteria

You’ll know you’ve succeeded when:

<input type="checkbox"> Collection created without errors  
<input type="checkbox"> Search returns results ranked by similarity score  
<input type="checkbox"> Filtered search works and returns appropriate subsets  
<input type="checkbox"> You can explain why certain items are more similar than others  


## Share Your Discovery

### Step 1: Reflect on Your Findings

For a new concept (not the Product Categories concept) run the code above and do the following:

* **Vector Meaning:** What did each of your four dimensions represent?
* **Query & Results:** Pick one query vector you tried. Which items were the top matches, and why does that make sense based on your vector design?
* **Filtering:** How did adding a filter change your results?
* **Surprise:** Was there anything unexpected about the results? (e.g., “a small change in one dimension affected the score a lot”)

### Step 2: Post Your Results

Show what you built and compare notes with others. **Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **using this short template—copy, fill, and send:**


```markdown
**[Day 0] Building Your First Vector Search System**

**High-Level Summary**
- **Domain:** “I built a vector search for [topic]”
- **Key Finding:** “[one sentence on what your vectors captured well]”

**Project-Specific Details**
- **Vector meaning:** d1=…, d2=…, d3=…, d4=…
- **Collection:** day0_first_system (Cosine), points: [count]
- **Query vector:** [a, b, c, d]
- **Top matches (id → score):**
  1) [id] → [score]
  2) [id] → [score]
  3) [id] → [score]
- **Filter used:** category=electronics
- **Filtered result:** [ids returned]

**Why these matched**
- [brief note about direction in 4D space]

**Surprise**
- “[one thing you didn’t expect]”

**Next step**
- “[what you’ll try tomorrow]”
```

## Troubleshooting

**No results from filtered search?** If no vectors satisfy the filter conditions, Qdrant returns an empty result set. Try adjusting your filter values or checking your payload data.

**Collection already exists?** Use `client.delete_collection(collection_name)` to remove it, then recreate.

**Vector dimension mismatch?** Ensure all vectors have exactly the same number of dimensions as specified in your collection configuration.

**Connection issues?** Verify your Qdrant Cloud credentials and ensure your cluster is running. 

**Congratulations! 🎉 You've completed Day 0!**