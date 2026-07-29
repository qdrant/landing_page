---
title: "Project: Building Your First Vector Search System"
short_description: "Hands-on starter project: build a working vector search system with a collection, points, payloads, similarity search, and filter conditions."
description: Apply your Qdrant skills to build a complete vector search system. Create collections, insert data, run similarity and filtered searches, and share your results. 
weight: 4
isLesson: true
---

{{< date >}} Module 0 {{< /date >}}

# Project: Building Your First Vector Search System

Time to make it your own. In the previous lesson you followed along with example data. Now you'll build a small search system from scratch and design the data yourself. This is where the ideas start to stick.

## Your Mission

Build a working search system that uses the core pieces you've met: a collection, points, similarity search, and filtering. You'll invent simple four-number vectors that represent something you choose.

**Estimated Time:** 30 minutes

## What You'll Build

A working search system with:

- One collection using four-number vectors and Cosine distance.
- Five to ten points with vectors you design and meaningful payloads.
- A similarity search that finds the nearest matches.
- A filtered search that combines similarity with a payload condition.

## Setup

### Prerequisites

- A Qdrant Cloud cluster (URL and API key).
- Python 3.9 or newer (or Colab).
- The `qdrant-client` package.

### Models

None. You'll create vectors by hand.

### Dataset

None. You'll invent your own data points.

Before writing any code, decide what each of the four numbers in your vectors will mean. This is the creative part of vector search, and there's no single right answer.

**Some Ideas to Get You Started:**

- **Product categories:** each number is a feature such as affordability, quality, popularity, or innovation. Electronics might be `[0.8, 0.7, 0.9, 0.6]`, while books could be `[0.3, 0.9, 0.4, 0.8]`.
- **Color mixes:** numbers for red, green, and blue. Bright red: `[0.9, 0.1, 0.1]`. Forest green: `[0.1, 0.8, 0.2]`.
- **Movie genres:** intensity of action, drama, comedy, and science fiction. Action thriller: `[0.9, 0.3, 0.1, 0.7]`. Romantic comedy: `[0.1, 0.6, 0.9, 0.2]`.

For this walkthrough, we'll use the **product categories** idea.

## Build Steps

### Step 1: Connect to Qdrant

```python
from qdrant_client import QdrantClient, models
import os

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))
```

### Step 2: Create the Collection

You'll also add a **payload index** on the `category` field. An index makes it possible to filter by that field later. Create it right after the collection and before adding data:

```python
collection_name = "module0_first_system"
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)

# Create the payload index before uploading data so filtering works.
# If you add it later, bump ef_construct (for example, 100 to 101) to trigger a safe rebuild.
client.create_payload_index(
    collection_name=collection_name,
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

### Step 3: Add Your Points

These vectors are made up by hand, which is fine for learning:

```python
points = [
    models.PointStruct(
        id=1,
        vector=[0.9, 0.1, 0.1, 0.8],  # affordable and innovative
        payload={"name": "Budget Smartphone", "category": "electronics", "price": 299},
    ),
    models.PointStruct(
        id=2,
        vector=[0.2, 0.9, 0.8, 0.5],  # high quality and popular
        payload={"name": "Bestselling Novel", "category": "books", "price": 19},
    ),
    models.PointStruct(
        id=3,
        vector=[0.8, 0.3, 0.2, 0.9],  # affordable and innovative, similar to id 1
        payload={"name": "Smart Home Hub", "category": "electronics", "price": 89},
    ),
    # Add two to five more points to experiment with.
]

client.upsert(collection_name=collection_name, points=points)
```

### Step 4: Run Your Searches

Try a plain similarity search first, then the same search narrowed to one category:

```python
# A query vector for "affordable and innovative"
query_vector = [0.85, 0.2, 0.1, 0.9]

# 1. Basic similarity search
basic_results = client.query_points(collection_name, query=query_vector)
print("Basic search results:", basic_results)

# 2. Filtered search (electronics only)
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

You'll know you've succeeded when:

<input type="checkbox"> The collection is created without errors  
<input type="checkbox"> Search returns results ranked by similarity score  
<input type="checkbox"> Filtered search works and returns the right subset  
<input type="checkbox"> You can explain why certain items rank as more similar than others  

## Share Your Discovery

### Step 1: Reflect on What You Found

Pick a new idea (not the product categories one), run your code, and think through:

- **Vector meaning:** what did each of your four numbers represent?
- **Query and results:** for one query vector you tried, which items were the top matches, and does that make sense given how you designed the vectors?
- **Filtering:** how did adding a filter change your results?
- **Surprise:** was anything unexpected? For example, a small change in one number moving the score a lot.

### Step 2: Post Your Results

Show what you built and compare notes with others. **Post your results in** <a href="https://discord.com/channels/907569970500743200/1429673887590776832" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **using this short template. Copy it, fill it in, and send:**

```markdown
**[Module 0] Building Your First Vector Search System**

**High-Level Summary**
- **Domain:** "I built a vector search for [topic]"
- **Key Finding:** "[one sentence on what your vectors captured well]"

**Project-Specific Details**
- **Vector meaning:** d1=…, d2=…, d3=…, d4=…
- **Collection:** module0_first_system (Cosine), points: [count]
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
- "[one thing you didn't expect]"

**Next step**
- "[what you'll try next]"
```

## Troubleshooting

- **No results from filtered search?** If no vectors match the filter, Qdrant returns an empty set. Adjust your filter values or check your payload data.
- **Collection already exists?** Use `client.delete_collection(collection_name)` to remove it, then create it again.
- **Vector dimension mismatch?** Every vector must have the same number of values as the collection's `size` setting.
- **Connection issues?** Recheck your Qdrant Cloud credentials and make sure your cluster is running.

**Congratulations! You've completed Module 0.** 🎉
