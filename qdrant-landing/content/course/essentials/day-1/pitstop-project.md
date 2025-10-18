---
title: "Project: Building a Semantic Search Engine"
weight: 5
---

{{< date >}} Day 1 {{< /date >}}

# Project: Building a Semantic Search Engine

Now that you've seen how semantic search works with movies, it's time to build your own. Choose a domain you care about and create a search engine that understands meaning, not just keywords.

## Your Mission

Build a semantic search engine for a topic of your choice. You'll discover how chunking strategy affects search quality in your specific domain.

**Estimated Time:** 120 minutes

## What You'll Build

A working semantic search engine that demonstrates:

- **Domain expertise**: Choose content you understand so you can evaluate search quality
- **Chunking comparison**: Test different strategies and see which works best for your content type
- **Real semantic understanding**: Search by concept, theme, or meaning rather than exact keywords
- **Practical insights**: Discover what makes chunking effective in your specific domain


## Setup

### Prerequisites
- Qdrant Cloud cluster (URL + API key)
- Python 3.9+ (or Colab)
- Packages: `qdrant-client`, `sentence-transformers`, `python-dotenv` (optional), `google.colab` (if using Colab)

### Models
- SentenceTransformer: `all-MiniLM-L6-v2` (384-dim)  
  *(You can try others in “Optional: Go Further”.)*

### Dataset
Pick something with rich, descriptive text where semantic search adds value:

- **Books/Literature:** Search a collection of book summaries, reviews, or excerpts. Find books by theme, mood, or literary style. 
  *Example queries: "coming of age stories with unreliable narrators", "dystopian fiction with environmental themes"*
- **Recipes/Cooking:** Index recipe descriptions and instructions. Search by cooking technique, flavor profile, or dietary needs. 
  *Example queries: "comfort food for cold weather", "quick weeknight meals with Asian flavors"*
- **News/Articles:** Collect articles from your field of interest. Search by topic, perspective, or journalistic approach. 
  *Example queries: "analysis of remote work trends", "climate change solutions in urban planning"*
- **Research Papers:** Academic abstracts or papers from your field. Search by methodology, findings, or theoretical approach. 
  *Example queries: "machine learning applications in healthcare", "qualitative studies on user behavior"*
- **Product Reviews:** Customer reviews for products you know well. Search by user sentiment, use case, or product features. 
  *Example queries: "laptops good for video editing under budget", "skincare for sensitive skin winter routine"*


## Build Steps

### Step 1: Initialize Client

**Standard init (local)**

```python
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

encoder = SentenceTransformer("all-MiniLM-L6-v2")
```


### Step 2: Prepare Your Dataset

Create a collection of 8-15 items with rich descriptions:

```python
# Example: Recipe collection
my_dataset = [
    {
        "title": "Classic Beef Bourguignon",
        "description": """A rich, wine-braised beef stew from Burgundy, France. 
        Tender chunks of beef are slowly simmered with pearl onions, mushrooms, 
        and bacon in a deep red wine sauce. The long, slow cooking process 
        develops complex flavors and creates a luxurious, velvety texture. 
        Perfect for cold winter evenings when you want something hearty and 
        comforting. Traditionally served with crusty bread or creamy mashed 
        potatoes to soak up the incredible sauce.""",
        "cuisine": "French",
        "difficulty": "Intermediate",
        "time": "3 hours"
    },
    # Add 7-14 more items with similarly rich descriptions
]
```

### Step 3: Implement Three Chunking Strategies

```python
def fixed_size_chunks(text, chunk_size=100, overlap=20):
    """Split text into fixed-size chunks with overlap"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk_words = words[i:i + chunk_size]
        if chunk_words:  # Only add non-empty chunks
            chunks.append(' '.join(chunk_words))
    
    return chunks

def sentence_chunks(text, max_sentences=3):
    """Group sentences into chunks"""
    import re
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    chunks = []
    for i in range(0, len(sentences), max_sentences):
        chunk_sentences = sentences[i:i + max_sentences]
        if chunk_sentences:
            chunks.append('. '.join(chunk_sentences) + '.')
    
    return chunks

def paragraph_chunks(text):
    """Split by paragraphs or double line breaks"""
    chunks = [chunk.strip() for chunk in text.split('\n\n') if chunk.strip()]
    return chunks if chunks else [text]  # Fallback to full text
```

### Step 4: Create Collections and Process Data

Note: If you are already familiar with Qdrant's filterable HNSW, you will know that effective filtering and grouping often relies on creating a [payload index](/documentation/concepts/indexing/#payload-index) before building HNSW indexes. To keep things simple in this tutorial, we will do a basic search with filters without payload indexes and talk about proper usage of payload indexes on [day 2](/content/course/essentials/day-2/_index.md) of this course.

```python
collection_name = "day1_semantic_search"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

# Create a collection with three named vectors
client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "fixed": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "sentence": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "paragraph": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    strict_mode_config=models.StrictModeConfig(unindexed_filtering_retrieve=True),
)

# Process and upload data
points = []
point_id = 0

for item in my_dataset:
    description = item["description"]

    # Process with each chunking strategy
    strategies = {
        "fixed": fixed_size_chunks(description),
        "sentence": sentence_chunks(description),
        "paragraph": paragraph_chunks(description),
    }

    for strategy_name, chunks in strategies.items():
        for chunk_idx, chunk in enumerate(chunks):
            # Create vectors for this chunk
            vectors = {strategy_name: encoder.encode(chunk).tolist()}

            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vectors,
                    payload={
                        **item,  # Include all original metadata
                        "chunk": chunk,
                        "chunk_strategy": strategy_name,
                        "chunk_index": chunk_idx,
                    },
                )
            )
            point_id += 1

client.upload_points(collection_name=collection_name, points=points)
print(f"Uploaded {len(points)} chunks across three strategies")
```

### Step 5: Test and Compare

```python
def compare_search_results(query):
    """Compare search results across all chunking strategies"""
    print(f"Query: '{query}'\n")

    for strategy in ["fixed", "sentence", "paragraph"]:
        results = client.query_points(
            collection_name=collection_name,
            query=encoder.encode(query).tolist(),
            using=strategy,
            limit=3,
        )

        print(f"--- {strategy.upper()} CHUNKING ---")
        for i, point in enumerate(results.points, 1):
            print(f"{i}. {point.payload['title']}")
            print(f"   Score: {point.score:.3f}")
            print(f"   Chunk: {point.payload['chunk'][:80]}...")
        print()


# Test with domain-specific queries
test_queries = [
    "comfort food for winter",  # Adapt these to your domain
    "quick and easy weeknight dinner",
    "elegant dish for special occasions",
]

for query in test_queries:
    compare_search_results(query)
```

### Step 6: Analyze Your Results

After running your tests, analyze what you discovered:

```python
def analyze_chunking_effectiveness():
    """Analyze which chunking strategy works best for your domain"""

    print("CHUNKING STRATEGY ANALYSIS")
    print("=" * 40)

    # Get chunk statistics for each strategy
    for strategy in ["fixed", "sentence", "paragraph"]:
        # Count chunks per strategy
        results = client.scroll(
            collection_name=collection_name,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="chunk_strategy", match=models.MatchValue(value=strategy)
                    )
                ]
            ),
            limit=100,
        )

        chunks = results[0]
        chunk_sizes = [len(chunk.payload["chunk"]) for chunk in chunks]

        print(f"\n{strategy.upper()} STRATEGY:")
        print(f"  Total chunks: {len(chunks)}")
        print(f"  Avg chunk size: {sum(chunk_sizes)/len(chunk_sizes):.0f} chars")
        print(f"  Size range: {min(chunk_sizes)}-{max(chunk_sizes)} chars")


analyze_chunking_effectiveness()
```

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> Your search engine finds relevant results by meaning, not just keywords  
<input type="checkbox"> You can clearly explain which chunking strategy works best for your domain  
<input type="checkbox"> You've discovered something surprising about how chunking affects search  
<input type="checkbox"> You can articulate the trade-offs between different approaches

## Share Your Discovery

Now it's time to analyze your results and share what you've learned. Follow these steps to document your findings and prepare them for sharing.

### Step 1: Reflect on Your Findings

* **Domain & Dataset:** What content you chose and why; dataset size/complexity.
* **Chunking Comparison:** What you observed for fixed / sentence / paragraph.
* **The Winner:** Which worked best and why (one clear reason).
* **Example Query:** One query where the winner beat another strategy.

### Step 2: Post Your Results

**Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **using this short template—copy, fill, and send:**

```markdown
**[Day 1] Building a Semantic Search Engine**

**High-Level Summary**
- **Domain:** "I built a semantic search for [recipes/books/articles/etc.]"
- **Winner:** "Best chunking strategy was [fixed/sentence/paragraph] because [one reason]"

**Project-Specific Details**
- **Collection:** day1_semantic_search (Cosine) with vectors: fixed/sentence/paragraph
- **Dataset:** [N items] (snapshot: YYYY-MM-DD)
- **Chunks:** fixed=[count]/[avg chars], sentence=[count]/[avg chars], paragraph=[count]/[avg chars]
- **Demo query:** "Try '[your example query]'" — it found [what was interesting]

**Surprise**
- "[Most unexpected finding was …]"

**Next step**
- "[What you’ll try tomorrow]"
```

## Optional: Go Further

### Add Metadata Filtering
Enhance your search with filters like we saw in the movie demo:

```python
# Example: Find Italian recipes that are quick to make

results = client.query_points(
    collection_name=collection_name,
    query=encoder.encode("comfort food").tolist(),
    using="sentence",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(key="cuisine", match=models.MatchValue(value="Italian")),
            models.FieldCondition(key="time", match=models.MatchValue(value="30 minutes"))
        ]
    ),
    limit=3
)
```

### Try Different Embedding Models
Experiment with other models to see how they affect results:

```python
# Compare with a different model
encoder_large = SentenceTransformer("all-mpnet-base-v2")  # Larger, potentially better
encoder_fast = SentenceTransformer("all-MiniLM-L12-v2")   # Different size/speed tradeoff
```

**Ready for Day 2?** Tomorrow you'll learn how Qdrant makes vector search lightning-fast through [HNSW](https://qdrant.tech/articles/filtrable-hnsw/) indexing and how to optimize for production workloads.