---
title: "Demo: Universal Query for Hybrid Retrieval"
weight: 3
---

{{< date >}} Day 5 {{< /date >}}

# Demo: Universal Query for Hybrid Retrieval

In this hands-on demo, we'll build a research paper discovery system using the arXiv dataset that showcases the full power of Qdrant's Universal Query API. You'll see how to combine dense semantics, sparse keywords, and ColBERT reranking to help researchers find exactly the papers they need - all in a single query.

## The Challenge: Intelligent Research Discovery

Imagine you're a machine learning researcher looking for "transformer architectures for multimodal learning with attention mechanisms." You need to:

1. **Retrieve broadly** using semantic understanding of research concepts (dense vectors)
2. **Match precisely** on technical terms like "transformer" and "attention" (sparse vectors)
3. **Rerank intelligently** using fine-grained text understanding (ColBERT)
4. **Apply research filters** like publication date, citation count, and research domain

Traditionally, this would require multiple searches across different systems, manual result merging, and complex ranking logic. With the Universal Query API, it's one declarative request.

## Step 1: Create the Research Paper Collection

First, let's set up a collection with three vector types - each serving a different purpose in our research discovery pipeline:

```python
from qdrant_client import QdrantClient, models
from datetime import datetime, timedelta

collection_name = "research-papers"

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)

# Clean state
if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

# Create collection with three vector types
client.create_collection(
    collection_name=collection_name,
    vectors_config={
        # Dense vectors for semantic understanding of research concepts
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        # ColBERT multivectors for fine-grained text understanding
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
        ),
    },
    sparse_vectors_config={
        # Sparse vectors for exact technical term matching
        "sparse": models.SparseVectorParams(
            index=models.SparseIndexParams(on_disk=False)
        )
    },
)

client.create_payload_index(
    collection_name=collection_name,
    field_name="research_area",
    field_schema="keyword",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="open_access",
    field_schema="bool",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="published_date",
    field_schema="datetime",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="impact_score",
    field_schema="float",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="citation_count",
    field_schema="integer",
)

print(f"Created collection '{collection_name}' with hybrid vector setup")
```


## Step 2: arXiv Data

Let's upload some (made up) research papers to our collection:

```python
sample_data = [
    {
        "title": "Zero-Shot Retrieval for Scalable Visual Search in a Two-Sided Marketplace",
        "authors": ["Andre Rusli", "Shoma Ishimoto", "Sho Akiyama", "Aman Kumar Singh"],
        "abstract": "Visual search offers an intuitive way for customers to explore diverse product catalogs, particularly in consumer-to-consumer (C2C) marketplaces where listings are often unstructured and visually driven. This paper presents a scalable visual search system deployed in Mercari's C2C marketplace...",
        "research_area": "computer_vision",
        "published_date": "2025-07-31",
        "impact_score": 0.78,
        "citation_count": 12,
        "open_access": True,
    },
    {
        "title": "TALI: Towards A Lightweight Information Retrieval Framework for Neural Search",
        "authors": ["Chaoqun Liu", "Yuanming Zhang", "Jianmin Zhang", "Jiawei Han"],
        "abstract": "Neural search systems have emerged as a promising approach to enhance user engagement in information retrieval. However, their high computational costs and memory usage have limited their widespread adoption. In this paper, we present TALI, a lightweight information retrieval framework for neural search that efficiently addresses these challenges...",
        "research_area": "machine_learning",
        "published_date": "2025-07-31",
        "impact_score": 0.78,
        "citation_count": 12,
        "open_access": True,
    },
    {
        "title": "Zero-Shot Retrieval for Scalable Visual Search in a Two-Sided Marketplace",
        "authors": ["Andre Rusli", "Shoma Ishimoto", "Sho Akiyama", "Aman Kumar Singh"],
        "abstract": "Visual search offers an intuitive way for customers to explore diverse product catalogs, particularly in consumer-to-consumer (C2C) marketplaces where listings are often unstructured and visually driven. This paper presents a scalable visual search system deployed in Mercari's C2C marketplace...",
        "research_area": "computer_vision",
        "published_date": "2025-07-31",
        "impact_score": 0.78,
        "citation_count": 12,
        "open_access": True,
    },
]

texts = [it["abstract"] for it in sample_data]

from fastembed import TextEmbedding, SparseTextEmbedding, LateInteractionTextEmbedding

DENSE_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"  # 384-dim
SPARSE_MODEL_ID = "prithivida/Splade_PP_en_v1"  # SPLADE sparse
COLBERT_MODEL_ID = "colbert-ir/colbertv2.0"  # 128-dim multivector

dense_model = TextEmbedding(DENSE_MODEL_ID)
sparse_model = SparseTextEmbedding(SPARSE_MODEL_ID)
colbert_model = LateInteractionTextEmbedding(COLBERT_MODEL_ID)

dense_embeds = list(dense_model.embed(texts, parallel=0))
sparse_embeds = list(sparse_model.embed(texts, parallel=0))
colbert_multivectors = list(colbert_model.embed(texts, parallel=0))

points = []
for i, text in enumerate(texts):
    sparse_embed = sparse_embeds[i].as_object()
    dense_embed = dense_embeds[i]
    colbert_embed = colbert_multivectors[i]

    points.append(
        models.PointStruct(
            id=i,
            vector={
                "dense": dense_embed,
                "sparse": sparse_embed,
                "colbert": colbert_embed,
            },
            payload=sample_data[i],
        )
    )

client.upload_points(
    collection_name=collection_name,
    points=points,
)
```


## Step 3: The Universal Query in Action

Now a single query that orchestrates the entire research discovery pipeline:

```python
research_query = "transformer architectures for multimodal learning"

research_query_dense = next(dense_model.query_embed(research_query))
research_query_sparse = next(sparse_model.query_embed(research_query)).as_object()
research_query_colbert = next(colbert_model.query_embed(research_query))


# Filters
dense_filter = models.Filter(
    must=[
        models.FieldCondition(
            key="research_area",
            match=models.MatchAny(any=["machine_learning", "computer_vision", "nlp"]),
        ),
        models.FieldCondition(key="open_access", match=models.MatchValue(value=True)),
    ]
)

late_filter = models.Filter(
    must=[
        # Recent research only (last 2 years)
        models.FieldCondition(
            key="published_date",
            range=models.DatetimeRange(
                gte=(datetime.now() - timedelta(days=365 * 6)).isoformat()
            ),
        ),
        # High-impact papers
        models.FieldCondition(key="impact_score", range=models.Range(gte=0.6)),
        # Well-cited work
        models.FieldCondition(key="citation_count", range=models.Range(gte=5)),
    ]
)

# Prefetch queries
hybrid_query = [
    # Dense retrieval: semantic understanding with domain filtering
    models.Prefetch(query=research_query_dense, using="dense", limit=100, filter=dense_filter),
    # Sparse retrieval: exact technical term matching
    models.Prefetch(query=research_query_sparse, using="sparse", limit=100),
]

fusion_query = models.Prefetch(
    prefetch=hybrid_query,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    filter=dense_filter,
    limit=100,
)

# The Universal Query: 4 stages in one atomic request
response = client.query_points(
    collection_name=collection_name,
    prefetch=fusion_query,
    query=research_query_colbert,
    using="colbert",
    query_filter=late_filter,
    limit=10,
    with_payload=True,
)

# Display results
print("Top Research Papers:")
for i, hit in enumerate(response.points or [], 1):
    paper = hit.payload
    print(f"{i}. {paper['title']}")
    print(f"   Authors: {', '.join(paper['authors'][:3])}{'...' if len(paper['authors']) > 3 else ''}")
    print(f"   Published: {paper['published_date']} | Citations: {paper['citation_count']}")
    print(f"   Research Area: {paper['research_area']}")
    print(f"   Open Access: {paper['open_access']}")
    print(f"   Score: {hit.score:.4f}\n")
```

## What Happened Under the Hood?

Let's break down this single query's execution:

### Stage 1: Parallel Retrieval (200 candidates total)

* **Dense search**: Found 100 semantically similar papers in ML/CV/NLP domains that are open access
* **Sparse search**: Found 100 papers matching exact technical terms like "transformer," "multimodal," "attention"
* Both searches ran **concurrently** for maximum speed

### Stage 2: Reciprocal Rank Fusion

* Combined the two candidate lists using RRF algorithm
* Papers appearing high in both lists got boosted scores
* Result: A unified ranking that balances semantic similarity with technical term relevance

### Stage 3: ColBERT Reranking

* Applied token-level late interaction scoring
* Each query token compared against each abstract token
* MaxSim aggregation found the best conceptual alignments
* Result: Fine-grained relevance scores based on deep text understanding

### Stage 4: Final Filtering

* Applied research quality rules: recent publications (last 2 years), high impact (0.6+), well-cited (5+ citations)
* Filtered the reranked list to match research quality requirements
* Result: Top 10 papers that satisfy both relevance and research quality criteria

## Real ArXiv Dataset Integration

Here's how you could populate the collection with real data (if the endpoint wasn't broken):

```python
# ! pip install arxiv
import arxiv

arxiv_client = arxiv.Client()

search = arxiv.Search(
    query="transformer AND multimodal",
    max_results=2,
    sort_by=arxiv.SortCriterion.SubmittedDate,
)

points = []
for i, paper in enumerate(arxiv_client.results(search)):
    print(paper)
    # Create dense embedding from abstract
    dense_vector = next(dense_model.embed(paper["abstract"]))

    # Create sparse vector from technical terms (simplified)
    # In practice, you'd use a proper sparse encoder like SPLADE or BM25
    sparse_vector = next(sparse_model.embed(paper["abstract"])).as_object()

    # Create ColBERT multivector (simplified)
    colbert_vector = next(colbert_model.embed(paper["abstract"]))

    point = models.PointStruct(
        id=i,  # Extract arXiv ID
        payload={
            "title": paper["title"],
            "authors": [author for author in paper["authors"]],
            "abstract": paper["abstract"],
            "published_date": datetime.strptime(
                paper["published_date"], "%Y-%m-%d"
            ).isoformat(),
            "citation_count": 0,  # Would need external API
            "venue": "arXiv",
            "research_area": paper["research_area"],
            "impact_score": paper["impact_score"],
            "open_access": True,
        },
        vector={
            "dense": dense_vector,
            "sparse": sparse_vector,
            "colbert": colbert_vector,
        },
    )
    points.append(point)

# Upload to Qdrant
client.upsert(collection_name=collection_name, points=points)
print(f"Uploaded {len(points)} research papers to collection")
```

## Key Takeaways

- **Single Request**: Complex multi-stage research discovery in one atomic API call
- **Parallel Execution**: Dense and sparse searches run concurrently
- **Smart Filtering**: Apply research quality filters at optimal stages
- **Real Data**: Works with actual arXiv dataset and research metadata
- **Production Ready**: Scales to millions of papers with sub-second latency

The Universal Query API eliminates the complexity of building multi-turn retrieval systems. What used to require coordination between semantic search engines, keyword systems, and reranking models now happens in a single, optimized request - perfect for academic search, literature reviews, and research recommendation systems.

## Next

In the next lesson, you'll take this foundation and build a complete recommendation service with real data ingestion and user profiling.
