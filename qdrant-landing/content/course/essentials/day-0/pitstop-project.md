---
title: "Project: Building Your First Vector Search System"
weight: 4
---

{{< date >}} Day 0 {{< /date >}}

# Project: Building Your First Vector Search System

Time to apply what you've learned. You'll create a complete, working vector search system from scratch.

## Your mission

Build a functional vector search system that demonstrates the core concepts: collections, points, similarity search, and filtering. You'll design simple 4-dimensional vectors that represent different concepts or items.

## What you'll build

A working search system with:
- One collection with 4-dimensional vectors and Cosine distance
- 5–10 points with hand-crafted vectors and meaningful payloads
- Basic similarity search to find nearest neighbors
- Filtered search combining similarity with payload conditions

## Example concepts to represent

** Product categories**: Create vectors where each dimension represents a feature (price, quality, popularity, innovation). Electronics might be `[0.8, 0.7, 0.9, 0.6]`, while books could be `[0.3, 0.9, 0.4, 0.8]`.

** Color palettes**: Each dimension represents color intensity (red, green, blue, brightness). Bright red: `[0.9, 0.1, 0.1, 0.8]`, forest green: `[0.1, 0.8, 0.2, 0.5]`.

** Data types**: Dimensions for structure, size, complexity, frequency. Spreadsheets: `[0.9, 0.6, 0.3, 0.7]`, images: `[0.2, 0.8, 0.5, 0.4]`.

** Movie genres**: Action, drama, comedy, sci-fi intensities. Action thriller: `[0.9, 0.3, 0.1, 0.7]`, romantic comedy: `[0.1, 0.6, 0.9, 0.2]`.

## Sample implementation

```python
from qdrant_client import QdrantClient, models

# Connect (use your credentials)
client = QdrantClient("https://your-cluster.cloud.qdrant.io", api_key="your-key")

# Create collection
collection_name = "my_vector_system"
client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE)
)

# Insert points with hand-crafted vectors
points = [
    models.PointStruct(
        id=1,
        vector=[0.8, 0.2, 0.6, 0.4],  # High on first and third dimensions
        payload={"name": "Item A", "category": "tech", "price": 99}
    ),
    models.PointStruct(
        id=2,
        vector=[0.1, 0.9, 0.3, 0.7],  # High on second and fourth dimensions
        payload={"name": "Item B", "category": "lifestyle", "price": 45}
    ),
    # Add 3-8 more points...
]

client.upsert(collection_name=collection_name, points=points)

# Test searches
basic_results = client.query_points(collection_name, query=[0.7, 0.3, 0.5, 0.4])
filtered_results = client.query_points(
    collection_name, 
    query=[0.7, 0.3, 0.5, 0.4],
    query_filter=models.Filter(must=[models.FieldCondition(key="category", match=models.MatchValue(value="tech"))])
)
```

## Success criteria

- Collection created without errors
- Search returns results ranked by similarity score
- Filtered search works and returns appropriate subsets
- You can explain why certain items are more similar than others

## Tips

- Decide what each dimension represents before creating points
- Try vectors like `[1.0, 0.0, 0.0, 0.0]` vs `[0.0, 0.0, 0.0, 1.0]` to see maximum differences
- Include fields you'd actually want to filter on
- 5 points are enough to see patterns; add more if you want to explore further

## Troubleshooting

**No results from filtered search?** If no vectors satisfy the filter conditions, Qdrant returns an empty result set. Try adjusting your filter values or checking your payload data.

**Collection already exists?** Use `client.delete_collection(collection_name)` to remove it, then recreate.

**Vector dimension mismatch?** Ensure all vectors have exactly the same number of dimensions as specified in your collection configuration.

**Connection issues?** Verify your Qdrant Cloud credentials and ensure your cluster is running. 

## What You've Accomplished

**Congratulations! 🎉 You've completed Day 0!**

Today, you laid the foundation for working with Qdrant by:

<input type="checkbox"> **Installed and connected** to Qdrant  
<input type="checkbox"> **Created your first collection** with proper vector configuration  
<input type="checkbox"> **Inserted vectors** with metadata  
<input type="checkbox"> **Performed similarity search** to find nearest neighbors  
<input type="checkbox"> **Applied filters** using payloads to refine results  