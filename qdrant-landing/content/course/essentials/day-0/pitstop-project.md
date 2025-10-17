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
### Models
### Dataset

Example Concepts to Represent: 
- **Product categories**: Create vectors where each dimension represents a feature (affordability, quality, popularity, innovation). Electronics might be `[0.8, 0.7, 0.9, 0.6]`, while books could be `[0.3, 0.9, 0.4, 0.8]`.
- **Color palettes**: Each dimension represents color intensity (red, green, blue, brightness). Bright red: `[0.9, 0.1, 0.1, 0.8]`, forest green: `[0.1, 0.8, 0.2, 0.5]`.
- **Data types**: Dimensions for structure, size, complexity, frequency. Spreadsheets: `[0.9, 0.6, 0.3, 0.7]`, images: `[0.2, 0.8, 0.5, 0.4]`.
- **Movie genres**: Action, drama, comedy, sci-fi intensities. Action thriller: `[0.9, 0.3, 0.1, 0.7]`, romantic comedy: `[0.1, 0.6, 0.9, 0.2]`.

## Build Steps
### Step 1: Initialize Client
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

### Step 2: Create Collection
```python
collection_name = "my_vector_system"
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)
```

### Step 3: Insert Points

We use dummy embeddings.

```python
points = [
    models.PointStruct(
        id=1,
        vector=[0.8, 0.2, 0.6, 0.4],  # High on first and third dimensions
        payload={"name": "Item A", "category": "tech", "price": 99},
    ),
    models.PointStruct(
        id=2,
        vector=[0.1, 0.9, 0.3, 0.7],  # High on second and fourth dimensions
        payload={"name": "Item B", "category": "lifestyle", "price": 45},
    ),
    # Add 3-8 more points...
]

client.upsert(collection_name=collection_name, points=points)

client.update_collection(
    collection_name=collection_name,
    optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0),
    strict_mode_config=models.StrictModeConfig(unindexed_filtering_retrieve=True),
)

# Test searches
basic_results = client.query_points(collection_name, query=[0.7, 0.3, 0.5, 0.4])
filtered_results = client.query_points(
    collection_name,
    query=[0.7, 0.3, 0.5, 0.4],
    query_filter=models.Filter(
        must=[
            models.FieldCondition(key="category", match=models.MatchValue(value="tech"))
        ]
    ),
)
```

## Success Criteria

You’ll know you’ve succeeded when:

<input type="checkbox"> Collection created without errors  
<input type="checkbox"> Search returns results ranked by similarity score  
<input type="checkbox"> Filtered search works and returns appropriate subsets  
<input type="checkbox"> You can explain why certain items are more similar than others  


## Share Your Discovery

Show what you built and compare notes with others. **Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **using this short template—copy, fill, and send:**


```bash
Domain: “I built a vector search for [topic]”
Vector meaning: d1=…, d2=…, d3=…, d4=…
Collection: my_vector_system (Cosine), points: [count]

Query vector: [a, b, c, d]
Top matches (id → score): 
1) [id] → [score]
2) [id] → [score]
3) [id] → [score]

Filter used: key=value (e.g., category=tech)
Filtered result: [ids returned]

Why these matched: [brief note about direction in 4D space]
Surprise: “[one thing you didn’t expect]”
Next step: “[what you’ll try tomorrow]”
```

### What to include

* A one-line map of what each dimension means.
* One raw query vector and the top 3 results with scores.
* A filtered search (e.g., `category=tech`) and what changed.
* One quick takeaway about Cosine direction (e.g., scaling didn’t change ranking).

### Bonus (optional)

* Add a tiny table of your points (id, name, vector, payload) or a screenshot of your query + results.

## Tips

- Decide what each dimension represents before creating points
- Try vectors like `[1.0, 0.0, 0.0, 0.0]` vs `[0.0, 0.0, 0.0, 1.0]` to see maximum differences
- **Note on Cosine Similarity:** When using `Cosine` distance, Qdrant automatically normalizes vectors (scales them to a length of 1.0). This means that only the *direction* of the vector matters, not its magnitude. For example, the vectors `[2, 2, 0, 0]` and `[0.5, 0.5, 0, 0]` will be treated as identical.
- Include fields you'd actually want to filter on
- 5 points are enough to see patterns; add more if you want to explore further

## Troubleshooting

**No results from filtered search?** If no vectors satisfy the filter conditions, Qdrant returns an empty result set. Try adjusting your filter values or checking your payload data.

**Collection already exists?** Use `client.delete_collection(collection_name)` to remove it, then recreate.

**Vector dimension mismatch?** Ensure all vectors have exactly the same number of dimensions as specified in your collection configuration.

**Connection issues?** Verify your Qdrant Cloud credentials and ensure your cluster is running. 

**Congratulations! 🎉 You've completed Day 0!**