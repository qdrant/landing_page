---
title: "Demo: Implementing a Hybrid Search System"
weight: 4
---

{{< date >}} Day 3 {{< /date >}}

# Demo: Implementing a Hybrid Search System

Build a complete hybrid search system with hands-on examples.

<div class="video">
<iframe
  src="https://www.youtube.com/embed/zaQYa7oa1a8"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

## What You'll Learn

- Step-by-step hybrid search implementation
- RRF algorithm in practice
- Performance optimization techniques
- Testing and evaluation methods

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course/day_3/hybrid_search/Introduction_to_Qdrant_Hybrid_Search_in_practice.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

## What You'll Discover

In the previous lesson, you learned the theory behind hybrid search and the Universal Query API. Today you'll implement it hands-on with a real dataset, comparing dense and sparse vector search and combining them using fusion algorithms.

**You'll learn to:**
- Create collections with both dense and sparse named vectors
- Compare dense vs. sparse search behavior on real queries
- Implement Reciprocal Rank Fusion (RRF) for hybrid search
- Explore Distribution-Based Score Fusion (DBSF) as an alternative
- Understand the limitations and strengths of each approach

## The Hybrid Search Challenge

Working with both semantic (dense) and lexical (sparse) search presents interesting challenges:
- **Different scoring systems**: Dense typically uses cosine similarity (\[-1, 1\]), sparse uses BM25 (unbounded)
- **Different result sets**: The same query may return completely different documents
- **Vocabulary sensitivity**: Sparse search can return fewer results or none if keywords don't match
- **User diversity**: Some users know exact terms, others use natural language

## Step 1: Environment Setup

### Install Required Libraries

```python
!pip install -q qdrant-client[fastembed]
```

**Why the fastembed extra?** This includes FastEmbed, which provides built-in models for generating both dense and sparse embeddings without additional dependencies. You won't need separate libraries for OpenAI or other embedding providers.

### Connect to Qdrant Cloud

Qdrant Cloud provides the persistence and performance needed for hybrid search experimentation:

```python
from qdrant_client import QdrantClient
from google.colab import userdata

client = QdrantClient(
    location="https://your-cluster-url.cloud.qdrant.io:6333",
    api_key=userdata.get("api-key")
)
```

**Using Google Colab secrets:** The `userdata.get()` function accesses secrets stored in your Colab environment, similar to environment variables. This keeps your API key secure and out of your code.

## Step 2: Create Collection with Named Vectors

For hybrid search, we need a collection that supports both sparse and dense vectors. Qdrant allows multiple named vectors per point:

```python
from qdrant_client import models

# Define the collection name
collection_name = "hybrid_search_demo"

# Create our collection with both sparse (bm25) and dense vectors
client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense": models.VectorParams(
            distance=models.Distance.COSINE,
            size=384,
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF
        )
    }
)
```

**Key configuration details:**
- **Named vectors**: `"dense"` and `"sparse"` identify each vector type
- **Dense configuration**: 384 dimensions (matches sentence-transformers/all-MiniLM-L6-v2)
- **Cosine distance**: Typical choice for semantic similarity
- **IDF modifier**: Inverse Document Frequency weighting for BM25 sparse vectors
- **Same collection**: Both vectors exist on the same points for hybrid search

## Step 3: Upload the Cheese Dataset

We're using a small dataset of 10 documents describing different types of cheese and cheese-based dishes. This simple dataset makes it easy to observe the behavior of different search methods:

```python
documents = [
    "Aged Gouda develops a crystalline texture and nutty flavor profile after 18 months of maturation.",
    "Mature Gouda cheese becomes grainy and develops a rich, buttery taste with extended aging.",
    "Brie cheese features a soft, creamy interior surrounded by an edible white rind.",
    "This French cheese has a flowing, buttery center encased in a bloomy white crust.",
    "Fresh mozzarella pairs beautifully with ripe tomatoes and basil leaves.",
    "Classic Margherita pizza topped with tomato sauce, mozzarella, and fresh basil.",
    "Parmesan requires at least 12 months of cave aging to develop its signature sharp taste.",
    "Parmigiano-Reggiano's distinctive piquant flavor comes from extended maturation in controlled environments.",
    "Grilled cheese sandwiches are the ultimate American comfort food for cold winter days.",
    "Croque Monsieur combines ham and Gruyère in France's answer to the toasted cheese sandwich.",
]
```

Now upload with both dense and sparse embeddings:

```python
import uuid

client.upsert(
    collection_name=collection_name,
    points=[
        models.PointStruct(
            id=uuid.uuid4().hex,
            vector={
                "dense": models.Document(
                    text=doc,
                    model="sentence-transformers/all-MiniLM-L6-v2",
                ),
                "sparse": models.Document(
                    text=doc,
                    model="Qdrant/bm25",
                ),
            },
            payload={"text": doc},
        )
        for doc in documents
    ]
)
```

**About this approach:**
- **Document model**: Automatically generates embeddings using specified models
- **Dual embedding**: Each point gets both dense and sparse representations
- **Small dataset**: 10 documents is perfect for observing search behavior differences
- **No batching needed**: For production with larger datasets, implement batching and retry logic

## Step 4: Compare Dense vs. Sparse Search

Let's create helper functions to test each search method independently. First, dense search:

```python
def dense_search(query: str) -> list[models.ScoredPoint]:
    response = client.query_points(
        collection_name=collection_name,
        query=models.Document(
            text=query,
            model="sentence-transformers/all-MiniLM-L6-v2",
        ),
        using="dense",
        limit=3,
    )
    return response.points
```

Now sparse search:

```python
def sparse_search(query: str) -> list[models.ScoredPoint]:
    response = client.query_points(
        collection_name=collection_name,
        query=models.Document(
            text=query,
            model="Qdrant/bm25",
        ),
        using="sparse",
        limit=3,
    )
    return response.points
```

### Test Queries Across Both Methods

Now let's run both methods on different query types:

```python
queries = [
    "nutty aged cheese",
    "soft French cheese",
    "pizza ingredients",
    "a good lunch",
]

for query in queries:
    print("Query:", query)

    dense_results = dense_search(query)
    print("Dense Results:")
    for result in dense_results:
        print("\t-", result.payload["text"], result.score)

    sparse_results = sparse_search(query)
    print("Sparse Results:")
    for result in sparse_results:
        print("\t-", result.payload["text"], result.score)
    print()
```

### Key Observations from Results

1. **Dense and sparse produce different rankings**: For "nutty aged cheese", sparse correctly identifies the exact match as #1, while dense ranks a semantically similar document higher
2. **Sometimes rankings match**: For "soft French cheese", both methods agree on the top results, but with different confidence scores
3. **Dense always returns expected results**: Dense search will always return 3 results because any two vectors have some similarity, even if extremely low
4. **Sparse can return fewer results**: For "pizza ingredients", sparse only returns 1 result. For "a good lunch", sparse returns 0 results due to vocabulary mismatch
5. **Vocabulary mismatch problem**: When query terms don't appear in documents, sparse search fails completely, while dense understands the semantic intent

## Step 5: Hybrid Search with Reciprocal Rank Fusion

Now let's combine both methods using RRF. This fusion algorithm doesn't compare incompatible scores - it only uses the ranking order:

```python
def rrf_search(query: str) -> list[models.ScoredPoint]:
    response = client.query_points(
        collection_name=collection_name,
        prefetch=[
            models.Prefetch(
                query=models.Document(
                    text=query,
                    model="Qdrant/bm25",
                ),
                using="sparse",
                limit=3,
            ),
            models.Prefetch(
                query=models.Document(
                    text=query,
                    model="sentence-transformers/all-MiniLM-L6-v2",
                ),
                using="dense",
                limit=3,
            )
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=3,
    )
    return response.points
```

**How RRF works in this code:**
- **Prefetch from both**: Retrieve top 3 from sparse AND dense search
- **FusionQuery**: Applies RRF algorithm to combine rankings
- **Single API call**: The entire hybrid pipeline executes in one request
- **Result**: Documents that perform well in both methods rank higher

### RRF Results Analysis

```python
for query in queries:
    print("Query:", query)

    rrf_results = rrf_search(query)
    print("RRF Results:")
    for result in rrf_results:
        print("\t-", result.payload["text"], result.score)
    print()
```

**What to notice:**
1. **Best of both worlds**: Results include documents from both dense and sparse searches
2. **Ranking preservation**: When both methods agree (like "soft French cheese"), RRF maintains the consensus
3. **Handles sparse gaps**: When sparse returns fewer results (or none), dense search fills the gaps
4. **Balanced scoring**: Documents ranked highly by both methods get boosted in RRF scores

## Step 6: Distribution-Based Score Fusion (DBSF)

RRF isn't the only fusion method available. DBSF normalizes scores from each query and sums them across different retrievers:

```python
def dbsf_search(query: str) -> list[models.ScoredPoint]:
    response = client.query_points(
        collection_name=collection_name,
        prefetch=[
            models.Prefetch(
                query=models.Document(
                    text=query,
                    model="Qdrant/bm25",
                ),
                using="sparse",
                limit=3,
            ),
            models.Prefetch(
                query=models.Document(
                    text=query,
                    model="sentence-transformers/all-MiniLM-L6-v2",
                ),
                using="dense",
                limit=3,
            )
        ],
        query=models.FusionQuery(fusion=models.Fusion.DBSF),
        limit=3,
    )
    return response.points
```

### DBSF Results

```python
for query in queries:
    print("Query:", query)

    dbsf_results = dbsf_search(query)
    print("DBSF Results:")
    for result in dbsf_results:
        print("\t-", result.payload["text"], result.score)
    print()
```

**Comparing DBSF to RRF:**
- In this simple example, DBSF and RRF produce identical rankings for all queries
- This is NOT a general rule - different fusion methods can produce different results
- With larger datasets and more complex queries, the differences become more apparent
- DBSF considers score distributions, while RRF only uses rank positions

## Evaluation Considerations

**Did fusion improve search quality?** We can't definitively say without proper evaluation. Here's why:

### The Challenge of Search Quality

- **Subjective relevance**: "Best results" depend on unknown user intentions
- **No ground truth**: We don't have a reference dataset defining expected outputs
- **Context matters**: Different users might prefer different results for the same query

### Proper Evaluation Requires

1. **Ground truth dataset**: Define expected results for each query
2. **Metrics**: Use precision, recall, NDCG, or other relevance metrics
3. **User feedback**: Collect real user satisfaction data
4. **A/B testing**: Compare different strategies in production

**For this demo:** We're "eyeballing" results to understand behavior, but production systems need rigorous evaluation frameworks.

## Summary & Key Takeaways

**What you've built:** A complete hybrid search pipeline using Qdrant's Universal Query API that combines dense semantic search with sparse keyword search in a single call.

**Key insights:**
1. **Dense vs. Sparse behavior**: Dense always returns results (semantic), sparse can return none (keyword match)
2. **Fusion solves incompatibility**: RRF and DBSF combine rankings without comparing incompatible scores
3. **Single API call**: The Universal Query API makes complex pipelines simple
4. **Complementary strengths**: Dense handles vague queries, sparse handles exact matches
5. **Evaluation matters**: Proper testing requires ground truth datasets and metrics

**Production recommendations:**
- Start with RRF - it's simple and effective
- Test DBSF if you need score-distribution awareness
- Build evaluation datasets for your specific domain
- Monitor user satisfaction metrics
- Consider adding specialized rerankers for even better quality

## Next Steps & Resources

**What's next:**
1. **Experiment with parameters**: Adjust prefetch limits, try different embedding models
2. **Add reranking**: Explore more complex models for final reranking stage, such as cross-encoders
3. **Build ground truth**: Create evaluation datasets for your use case
4. **Test on your data**: Apply these techniques to domain-specific datasets

**Additional resources:**
- [Qdrant Documentation: Hybrid Search](/documentation/concepts/hybrid-queries/) - Complete technical reference
- [Universal Query API Guide](/documentation/concepts/search/#search-api) - Advanced usage patterns

**Ready for the next challenge?** You've mastered hybrid search fundamentals. These same techniques scale to millions of documents and power production search systems! 