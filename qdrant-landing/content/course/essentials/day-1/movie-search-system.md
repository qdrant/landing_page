---
title: Semantic Movie Search Demo
weight: 4
---

{{< date >}} Day 1 {{< /date >}}

# Building a Semantic Movie Search Engine

Let's synthesize everything we've learned today into a practical project: a semantic search engine for science fiction movies.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

**Follow along:** [Complete Google Colab Notebook](https://colab.research.google.com/github/qdrant/examples/blob/main/movie-search-system/semantic_movie_search.ipynb)

## Project Overview: When Search Understands Meaning

Imagine asking a search engine: *"Show me movies about questioning reality and the nature of existence"* and getting back *The Matrix*, *Inception*, and *Ex Machina*, but not because these titles contain those exact words, but because the system understands what these films are actually about.

**That's semantic search. And you're about to build one.**

We'll take detailed movie descriptions and apply the chunking strategies you learned earlier, embed those chunks using sentence transformers, and store them in Qdrant with rich metadata. The result is a search engine that understands themes, moods, and concepts.

This project synthesizes everything from today: points and vectors, distance metrics, payloads, chunking strategies, and embedding models. By the end, you'll have a working system that can find movies by plot, theme, or emotional resonance.

## What You'll Build

A semantic search engine that can:

- **Understand meaning**: Search for "time travel and family relationships" and find *Interstellar*
- **Compare chunking strategies**: See how fixed-size, sentence-based, and semantic chunking affect search quality
- **Filter intelligently**: Combine semantic search with metadata filters (year, genre, rating)
- **Handle real complexity**: Process long movie descriptions that exceed embedding model limits
- **Group results**: Avoid duplicate movies when multiple chunks match your query

## Step 1: Understanding the Challenge

Our dataset consists of 13 science fiction movies with detailed, literary descriptions. Here's the challenge: each description contains 240-460 tokens, but our embedding model (all-MiniLM-L6-v2) works optimally with 256 tokens or less.

**This is where chunking becomes essential.**

```python
# Example: A movie description that's too long for our embedding model
movie_example = {
    "name": "Ex Machina",
    "year": 2014,
    "description": """Alex Garland's Ex Machina is a cerebral, slow-burning psychological 
    thriller that delves into the ethics and consequences of artificial intelligence. 
    The story begins with Caleb, a young programmer at a tech conglomerate, who wins 
    a contest to spend a week at the secluded estate of Nathan, the reclusive CEO..."""
    # This continues for 386 tokens - too long for optimal embedding!
}
```

**The complete dataset** (including *The Matrix*, *Interstellar*, *Arrival*, *Annihilation*, and more) is available in the [full notebook](https://colab.research.google.com/github/qdrant/examples/blob/main/movie-search-system/semantic_movie_search.ipynb).

## Step 2: The Three-Vector Experiment

Here's what makes this demo unique: we'll create three different vector spaces in a single collection, each representing a different chunking strategy. This lets us directly compare how chunking affects search quality.

```python
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models

# Initialize components
encoder = SentenceTransformer("all-MiniLM-L6-v2")
client = QdrantClient(':memory:')  # In-memory for demo

# Create collection with three named vectors
client.create_collection(
    collection_name='movie_search',
    vectors_config={
        'fixed': models.VectorParams(size=384, distance=models.Distance.COSINE),
        'sentence': models.VectorParams(size=384, distance=models.Distance.COSINE),
        'semantic': models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
)
```

Each vector space will store the same movie content, chunked differently:
- **Fixed**: Raw 40-token chunks (may break mid-sentence)
- **Sentence**: Sentence-aware chunks with overlap
- **Semantic**: Meaning-aware chunks using embedding similarity

## Step 3: Implementing the Chunking Strategies

Here's where the chunking concepts from earlier lessons come alive. We'll implement three different approaches and see how they perform:

```python
from transformers import AutoTokenizer
from llama_index.core.node_parser import SentenceSplitter, SemanticSplitterNodeParser
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
MAX_TOKENS = 40

def fixed_size_chunks(text, size=MAX_TOKENS):
    """Fixed-size chunking: splits at exact token boundaries"""
    tokens = tokenizer.encode(text, add_special_tokens=False)
    return [
        tokenizer.decode(tokens[i:i+size], skip_special_tokens=True)
        for i in range(0, len(tokens), size)
    ]

def sentence_chunks(text):
    """Sentence-aware chunking: respects sentence boundaries"""
    splitter = SentenceSplitter(chunk_size=MAX_TOKENS, chunk_overlap=10)
    return splitter.split_text(text)

def semantic_chunks(text):
    """Semantic chunking: uses embedding similarity to find natural breaks"""
    from llama_index.core import Document
    
    semantic_splitter = SemanticSplitterNodeParser(
        buffer_size=1,
        breakpoint_percentile_threshold=95,
        embed_model=HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    )
    nodes = semantic_splitter.get_nodes_from_documents([Document(text=text)])
    return [node.text for node in nodes]
```

**The key difference**: Fixed chunking may split mid-sentence. Sentence chunking respects grammar. Semantic chunking respects meaning.

## Step 4: Processing and Uploading the Data

For each movie description, we apply all three chunking strategies, embed the resulting chunks, and store them with their respective vector names:

```python
points = []
idx = 0

for movie in movies_data:  # Process each movie
    # Fixed-size chunks
    for chunk in fixed_size_chunks(movie["description"]):
        points.append(models.PointStruct(
            id=idx,
            vector={"fixed": encoder.encode(chunk).tolist()},
            payload={**movie, "chunk": chunk, "chunking": "fixed"}
        ))
        idx += 1

    # Sentence-aware chunks  
    for chunk in sentence_chunks(movie["description"]):
        points.append(models.PointStruct(
            id=idx,
            vector={"sentence": encoder.encode(chunk).tolist()},
            payload={**movie, "chunk": chunk, "chunking": "sentence"}
        ))
        idx += 1

    # Semantic chunks
    for chunk in semantic_chunks(movie["description"]):
        points.append(models.PointStruct(
            id=idx,
            vector={"semantic": encoder.encode(chunk).tolist()},
            payload={**movie, "chunk": chunk, "chunking": "semantic"}
        ))
        idx += 1

client.upload_points(collection_name='movie_search', points=points)
print(f"Uploaded {idx} vectors across three chunking strategies")
```

## Step 5: Comparing Search Results

Now comes the fascinating part: testing how different chunking strategies affect search quality. Let's create a helper function to compare results:

```python
def search_and_compare(query, k=3):
    """Compare search results across all three chunking strategies"""
    print(f"Query: '{query}'\n")
    
    for strategy in ['fixed', 'sentence', 'semantic']:
        results = client.query_points(
            collection_name='movie_search',
            query=encoder.encode(query).tolist(),
            using=strategy,
            limit=k,
        )
        
        print(f"--- {strategy.upper()} CHUNKING ---")
        for i, point in enumerate(results.points, 1):
            payload = point.payload
            print(f"{i}. {payload['name']} ({payload['year']}) | Score: {point.score:.3f}")
            print(f"   Chunk: {payload['chunk'][:100]}...")
        print()

# Test with different queries
search_and_compare("alien invasion")
search_and_compare("questioning reality and existence")
```

**Expected output:**
```
Query: 'alien invasion'

--- FIXED CHUNKING ---
1. E.T. the Extra-Terrestrial (1982) | Score: 0.554
   Chunk: the film opens with a group of botanist aliens visiting earth, only to be interrupted...

--- SENTENCE CHUNKING ---  
1. E.T. the Extra-Terrestrial (1982) | Score: 0.568
   Chunk: The film opens with a group of botanist aliens visiting Earth, only to be interrupted...

--- SEMANTIC CHUNKING ---
1. Annihilation (2018) | Score: 0.440
   Chunk: Annihilation is not a traditional alien invasion story - it is a meditation on the fragility...
```

## Step 6: Advanced Features

### Filtering by Metadata

Combine semantic search with traditional filters:

```python
# Find movies about AI made after 2000
results = client.query_points(
    collection_name='movie_search',
    query=encoder.encode("artificial intelligence").tolist(),
    using="semantic",
    query_filter=models.Filter(
        must=[models.FieldCondition(key="year", range=models.Range(gte=2000))]
    ),
    limit=3
)

for point in results.points:
    print(f"{point.payload['name']} ({point.payload['year']}) | Score: {point.score:.3f}")
```

### Grouping Results to Avoid Duplicates

When multiple chunks from the same movie match, group results by movie title:

```python
# Group by movie name to get unique recommendations
response = client.query_points_groups(
    collection_name='movie_search',
    query=encoder.encode("time travel and family relationships").tolist(),
    using="semantic",
    group_by="name",       # Group by movie title
    limit=3,               # Number of unique movies
    group_size=1,          # Best chunk per movie
)

for group in response.groups:
    print(f"{group.id} | Best match score: {group.hits[0].score:.3f}")
```

## What You've Learned

This demo brings together every concept from Day 1:

**Chunking in Action:**
You've seen how different chunking strategies affect search quality. Fixed chunking is fast but crude, sentence chunking preserves readability, and semantic chunking captures meaning - but at computational cost.

**Embeddings and Distance:**
The all-MiniLM-L6-v2 model converts movie descriptions into 384-dimensional vectors. Cosine similarity finds movies with similar themes, even when they use completely different words.

**Payloads and Filtering:**
Rich metadata enables hybrid queries: "Find movies about AI made after 2000." This combines semantic understanding with traditional database filtering.

**Named Vectors:**
By storing three chunking strategies in one collection, you can directly compare their performance and choose the best approach for your use case.

## Key Insights

**Chunking matters**: The same query can return different movies depending on how you chunk the descriptions. Semantic chunking found *Annihilation* for "alien invasion" because it understood the thematic connection, while fixed chunking focused on literal mentions.

**Context length is a real constraint**: Movie descriptions exceed embedding model limits, making chunking essential for real-world applications.

**Grouping prevents duplicates**: When multiple chunks from the same movie match your query, grouping ensures you get diverse recommendations.

**Continue exploring:** The [complete notebook](https://colab.research.google.com/github/qdrant/examples/blob/main/movie-search-system/semantic_movie_search.ipynb) includes additional features like similarity search, theme-based recommendations, and advanced filtering examples. 