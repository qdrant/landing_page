---
title: Basic Vector Search Demo
weight: 2
---

{{< date >}} Day 0 {{< /date >}}

# Basic Vector Search Demo

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

## What We'll Build

In this hands-on tutorial, we'll build a complete vector search engine from scratch! By the end, you'll have:

- ✅ **A working collection** with proper vector configuration
- ✅ **Sample data** with vectors and rich metadata
- ✅ **Search functionality** with similarity scoring
- ✅ **Filtering capabilities** combining vector similarity with business logic
- ✅ **Understanding** of core Qdrant concepts

This is your "Hello, World!" for vector databases!

## Prerequisites Check

Before we start coding, ensure you have:
- ✅ Qdrant Cloud cluster running (from previous section)
- ✅ Python environment with `qdrant-client` installed
- ✅ API credentials configured
- ✅ Basic Python knowledge

## Step 1: Initialize Your Vector Search Engine

Let's start by connecting to Qdrant and setting up our imports:

```python
import os
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, 
    VectorParams, 
    PointStruct,
    Filter, 
    FieldCondition, 
    MatchValue
)

# Connect to Qdrant Cloud
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

print("🚀 Connected to Qdrant Cloud!")
print("Building your first vector search engine...")
```

## Step 2: Design Your Collection

A collection in Qdrant is like a table in a database, but optimized for vector operations:

```python
collection_name = "simple_search_engine"

# Create collection with 4-dimensional vectors
client.create_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size=4,                    # Vector dimensions
        distance=Distance.COSINE,  # Similarity metric
    ),
)

print(f"✅ Created collection: {collection_name}")
```

### Understanding Vector Configuration

**Vector Size (4 dimensions):**
- Each item will be represented as a 4-number array
- Example: `[0.1, 0.2, 0.3, 0.4]`
- In real applications, this might be 384, 768, or 1536 dimensions

**Distance Metrics:**
- **Cosine:** Best for normalized vectors (values between -1 and 1)
- **Euclidean:** Good for spatial data and raw distances
- **Dot Product:** Efficient for positive vectors

## Step 3: Create Your Dataset

Let's build a sample dataset of products with vectors and metadata:

```python
# Sample products for our search engine
products = [
    {
        "id": 1,
        "name": "Wireless Headphones",
        "vector": [0.1, 0.8, 0.2, 0.6],
        "category": "electronics",
        "price": 99.99,
        "rating": 4.5,
        "brand": "TechSound"
    },
    {
        "id": 2,
        "name": "Running Shoes",
        "vector": [0.9, 0.1, 0.7, 0.3],
        "category": "sports",
        "price": 129.99,
        "rating": 4.8,
        "brand": "RunFast"
    },
    {
        "id": 3,
        "name": "Coffee Maker",
        "vector": [0.3, 0.4, 0.9, 0.1],
        "category": "kitchen",
        "price": 79.99,
        "rating": 4.2,
        "brand": "BrewMaster"
    },
    {
        "id": 4,
        "name": "Bluetooth Speaker",
        "vector": [0.2, 0.9, 0.1, 0.8],
        "category": "electronics",
        "price": 59.99,
        "rating": 4.3,
        "brand": "TechSound"
    },
    {
        "id": 5,
        "name": "Yoga Mat",
        "vector": [0.8, 0.2, 0.4, 0.9],
        "category": "sports",
        "price": 29.99,
        "rating": 4.6,
        "brand": "FitLife"
    },
]

print(f"📦 Created dataset with {len(products)} products")
```

## Step 4: Insert Data into Your Vector Database

Convert our products into Qdrant points and insert them:

```python
# Convert products to Qdrant points
points = []
for product in products:
    point = PointStruct(
        id=product["id"],
        vector=product["vector"],
        payload={
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "rating": product["rating"],
            "brand": product["brand"]
        }
    )
    points.append(point)

# Insert all points into the collection
client.upsert(
    collection_name=collection_name,
    points=points
)

print(f"✅ Inserted {len(points)} products into vector database")
```

### Understanding Points Structure

Each point contains:
- **ID:** Unique identifier (1, 2, 3, etc.)
- **Vector:** The mathematical representation `[0.1, 0.8, 0.2, 0.6]`
- **Payload:** Metadata we can search and filter on

## Step 5: Build Search Functions

Now let's create functions to search our vector database:

### Basic Similarity Search

```python
def search_products(query_vector, limit=3):
    """Find products similar to query vector"""
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=limit
    )
    
    print(f"🔍 Found {len(results)} similar products:")
    print("=" * 50)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.payload['name']}")
        print(f"   Category: {result.payload['category']}")
        print(f"   Price: ${result.payload['price']}")
        print(f"   Similarity: {result.score:.3f}")
        print("-" * 30)
    
    return results

# Test basic search
print("🎯 Searching for products similar to [0.2, 0.7, 0.3, 0.5]")
query = [0.2, 0.7, 0.3, 0.5]
search_results = search_products(query)
```

### Category-Filtered Search

```python
def search_by_category(query_vector, category, limit=2):
    """Search within a specific category"""
    category_filter = Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchValue(value=category)
            )
        ]
    )
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=category_filter,
        limit=limit
    )
    
    print(f"🎯 Found {len(results)} {category} products:")
    print("=" * 50)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.payload['name']}")
        print(f"   Brand: {result.payload['brand']}")
        print(f"   Rating: {result.payload['rating']} ⭐")
        print(f"   Similarity: {result.score:.3f}")
        print("-" * 30)
    
    return results

# Test category search
print("\n🏷️ Searching for electronics similar to [0.1, 0.9, 0.1, 0.7]")
electronics_query = [0.1, 0.9, 0.1, 0.7]
electronics_results = search_by_category(electronics_query, "electronics")
```

### Advanced Multi-Filter Search

```python
def search_premium_products(query_vector, min_price=50, min_rating=4.0):
    """Search for premium products with price and rating filters"""
    premium_filter = Filter(
        must=[
            FieldCondition(
                key="price",
                range={"gte": min_price}  # Greater than or equal
            ),
            FieldCondition(
                key="rating",
                range={"gte": min_rating}
            )
        ]
    )
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=premium_filter,
        limit=5
    )
    
    print(f"💎 Found {len(results)} premium products (${min_price}+, {min_rating}+ rating):")
    print("=" * 60)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.payload['name']}")
        print(f"   Price: ${result.payload['price']}")
        print(f"   Rating: {result.payload['rating']} ⭐")
        print(f"   Category: {result.payload['category']}")
        print(f"   Similarity: {result.score:.3f}")
        print("-" * 30)
    
    return results

# Test premium search
print("\n💎 Searching for premium products similar to [0.5, 0.5, 0.5, 0.5]")
premium_query = [0.5, 0.5, 0.5, 0.5]
premium_results = search_premium_products(premium_query, min_price=60, min_rating=4.3)
```

## Step 6: Explore Your Search Engine

Let's try different search scenarios:

### Scenario 1: Find Electronics

```python
# User is looking for electronic gadgets
print("\n🔌 Scenario 1: Looking for electronic gadgets")
electronics_vector = [0.1, 0.9, 0.2, 0.8]  # High on electronic features
search_products(electronics_vector, limit=2)
```

### Scenario 2: Sports Equipment

```python
# User wants sports/fitness products  
print("\n🏃 Scenario 2: Looking for sports equipment")
sports_vector = [0.9, 0.1, 0.6, 0.4]  # High on sports features
search_by_category(sports_vector, "sports", limit=2)
```

### Scenario 3: Brand-Specific Search

```python
def search_by_brand(query_vector, brand_name):
    """Search for products from a specific brand"""
    brand_filter = Filter(
        must=[
            FieldCondition(
                key="brand",
                match=MatchValue(value=brand_name)
            )
        ]
    )
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=brand_filter,
        limit=3
    )
    
    print(f"🏷️ {brand_name} products:")
    for result in results:
        print(f"- {result.payload['name']} (${result.payload['price']})")
    
    return results

print("\n🏷️ Scenario 3: TechSound brand products")
brand_vector = [0.3, 0.7, 0.3, 0.7]
search_by_brand(brand_vector, "TechSound")
```

## Step 7: Understand Your Results

### Similarity Scores Explained

```python
# Let's understand what similarity scores mean
test_vector = [0.1, 0.8, 0.2, 0.6]  # Identical to Wireless Headphones

print("\n📊 Understanding Similarity Scores")
print("Query vector:", test_vector)
print("=" * 50)

results = client.search(
    collection_name=collection_name,
    query_vector=test_vector,
    limit=5
)

for result in results:
    product_vector = None
    # Find the original vector for comparison
    for product in products:
        if product["id"] == result.id:
            product_vector = product["vector"]
            break
    
    print(f"Product: {result.payload['name']}")
    print(f"Vector: {product_vector}")
    print(f"Similarity Score: {result.score:.4f}")
    
    if result.score > 0.99:
        print("🎯 Perfect match!")
    elif result.score > 0.8:
        print("✅ Very similar")
    elif result.score > 0.6:
        print("📍 Somewhat similar")
    else:
        print("❓ Not very similar")
    
    print("-" * 30)
```

## Step 8: Collection Statistics

Let's examine our search engine's performance:

```python
# Get collection information
collection_info = client.get_collection(collection_name)

print("\n📈 Search Engine Statistics")
print("=" * 40)
print(f"Collection Name: {collection_name}")
print(f"Vector Count: {collection_info.vectors_count}")
print(f"Points Count: {collection_info.points_count}")
print(f"Vector Size: {collection_info.config.params.vectors.size}")
print(f"Distance Metric: {collection_info.config.params.vectors.distance}")
print(f"Status: {collection_info.status}")
```

## Complete Search Engine Code

Here's the complete code for your vector search engine:

```python
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from qdrant_client.models import Filter, FieldCondition, MatchValue

class SimpleVectorSearchEngine:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
        )
        self.collection_name = "simple_search_engine"
        
    def create_collection(self):
        """Create a new collection for our search engine"""
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=4, distance=Distance.COSINE),
        )
        
    def add_products(self, products):
        """Add products to the search engine"""
        points = [
            PointStruct(
                id=p["id"],
                vector=p["vector"],
                payload={k: v for k, v in p.items() if k not in ["id", "vector"]}
            )
            for p in products
        ]
        self.client.upsert(collection_name=self.collection_name, points=points)
        
    def search(self, query_vector, limit=3, filters=None):
        """Search for similar products"""
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=filters,
            limit=limit
        )

# Usage example
if __name__ == "__main__":
    search_engine = SimpleVectorSearchEngine()
    search_engine.create_collection()
    
    # Add your products here
    # search_engine.add_products(products)
    
    # Search for similar items
    # results = search_engine.search([0.1, 0.8, 0.2, 0.6])
```

## What You've Accomplished

Congratulations! You've just built a complete vector search engine!

✅ **Created a collection** with proper vector configuration  
✅ **Inserted products** with vectors and rich metadata  
✅ **Implemented search functions** for different use cases  
✅ **Applied filters** to combine similarity with business logic  
✅ **Analyzed results** to understand similarity scoring  
✅ **Built reusable code** for future projects  

## Key Concepts Learned

### 1. Vector Similarity
- Vectors close in space represent similar items
- Cosine similarity works well for most applications
- Higher scores = more similar items

### 2. Metadata Filtering
- Combine vector similarity with business rules
- Filter by category, price, rating, brand, etc.
- Use `must`, `should`, and `must_not` conditions

### 3. Search Patterns
- **Basic search:** Find similar items
- **Filtered search:** Narrow by criteria
- **Multi-filter search:** Complex business logic

## Real-World Applications

This simple search engine can be extended for:

🛒 **E-commerce:** Product recommendations  
📚 **Content:** Article/blog similarity  
🎵 **Media:** Music/video recommendations  
🏠 **Real Estate:** Property matching  
💼 **Jobs:** Job/candidate matching  
📱 **Apps:** Feature/content discovery  

## Next Steps

In the upcoming sections, we'll:
- Work on a hands-on project to reinforce these concepts
- Explore more advanced vector operations
- Learn about embedding models and real-world vectors
- Build more sophisticated search applications

Ready to take on your first project? Let's continue! 🚀

## Troubleshooting

**Issue:** Collection already exists  
**Solution:** `client.delete_collection(collection_name)` then recreate

**Issue:** Vector dimension mismatch  
**Solution:** Ensure all vectors have exactly 4 dimensions

**Issue:** No search results  
**Solution:** Check if points were inserted and query vector is reasonable

**Issue:** Connection errors  
**Solution:** Verify Qdrant Cloud credentials and internet connection

Great work building your first vector search engine! 🎯 