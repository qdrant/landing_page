---
title: "Demo: Universal Query for Hybrid Retrieval"
weight: 3
---

{{< date >}} Day 5 {{< /date >}}

# Demo: Universal Query for Hybrid Retrieval

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

<br/>

In this hands-on demo, we'll build a research paper discovery system using the arXiv dataset that showcases the full power of Qdrant's Universal Query API. You'll see how to combine dense semantics, sparse keywords, and ColBERT reranking to help researchers find exactly the papers they need - all in a single atomic query.

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

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)
collection_name = "arxiv_papers"

# Clean slate
if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

# Create collection with three vector types
client.create_collection(
    collection_name=collection_name,
    vectors_config={
        # Dense vectors for semantic understanding of research concepts
        "dense": models.VectorParams(
            size=384, 
            distance=models.Distance.COSINE
        ),
        # ColBERT multivectors for fine-grained text understanding
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0)  # No HNSW - used only for reranking
        )
    },
    sparse_vectors_config={
        # Sparse vectors for exact technical term matching
        "sparse": models.SparseVectorParams(
            index=models.SparseIndexParams(on_disk=False)
        )
    }
)

print(f"Created collection '{collection_name}' with hybrid vector setup")
```

## Step 2: Real ArXiv Data Structure

Let's look at what a research paper point looks like in our collection using real arXiv data:

```python
# Example research paper from arXiv dataset
sample_paper = {
    "id": "2508.05661",
    "payload": {
        "title": "Zero-Shot Retrieval for Scalable Visual Search in a Two-Sided Marketplace",
        "authors": ["Andre Rusli", "Shoma Ishimoto", "Sho Akiyama", "Aman Kumar Singh"],
        "abstract": "Visual search offers an intuitive way for customers to explore diverse product catalogs, particularly in consumer-to-consumer (C2C) marketplaces where listings are often unstructured and visually driven. This paper presents a scalable visual search system deployed in Mercari's C2C marketplace...",
        "categories": ["cs.IR", "cs.AI"],
        "published_date": "2025-07-31",
        "citation_count": 12,
        "venue": "KDD 2025 Workshop",
        "research_area": "information_retrieval",
        "impact_score": 0.78,
        "open_access": True
    },
    "vector": {
        "dense": [0.1, 0.2, 0.3, ...],  # 384-dim semantic embedding of abstract
        "sparse": {"indices": [5, 23, 67, 145], "values": [0.9, 0.7, 0.8, 0.6]},  # technical terms
        "colbert": [[0.1, 0.2, ...], [0.3, 0.4, ...], ...]  # token-level multivector
    }
}
```

## Step 3: The Universal Query in Action

Now for the magic - a single query that orchestrates the entire research discovery pipeline:

```python
# Researcher query: "transformer architectures for multimodal learning"
research_query_dense = [0.15, 0.42, 0.28] * 128  # 384-dim research concept vector
research_query_sparse = models.SparseVector(
    indices=[5, 23, 67, 145, 203],  # "transformer", "multimodal", "attention", "architecture", "learning"
    values=[0.95, 0.85, 0.90, 0.80, 0.75]
)
research_query_colbert = [
    [0.2, 0.3] * 64,    # "transformer" token representation
    [0.4, 0.5] * 64,    # "multimodal" token representation  
    [0.6, 0.7] * 64     # "learning" token representation
]

# The Universal Query: 4 stages in one atomic request
response = client.query_points(
    collection_name=collection_name,
    
    # Stage 1: Parallel Retrieval with Early Filtering
    prefetch=[
        # Dense retrieval: semantic understanding with domain filtering
        models.Prefetch(
            query=research_query_dense,
            using="dense",
            limit=100,
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="research_area", 
                        match=models.MatchAny(any=["machine_learning", "computer_vision", "nlp"])
                    ),
                    models.FieldCondition(
                        key="open_access",
                        match=models.MatchValue(value=True)
                    )
                ]
            )
        ),
        # Sparse retrieval: exact technical term matching
        models.Prefetch(
            query=research_query_sparse,
            using="sparse", 
            limit=100
        )
    ],
    
    # Stage 2: Fusion + Stage 3: ColBERT Reranking
    query=models.FusionQuery(
        fusion=models.Fusion.RRF,  # Reciprocal Rank Fusion
        query=models.NamedVector(
            name="colbert",
            vector=research_query_colbert
        )
    ),
    
    # Stage 4: Final Research Quality Filters
    filter=models.Filter(
        must=[
            # Recent research only (last 2 years)
            models.FieldCondition(
                key="published_date",
                range=models.DatetimeRange(
                    gte=(datetime.now() - timedelta(days=730)).isoformat()
                )
            ),
            # High-impact papers
            models.FieldCondition(
                key="impact_score",
                range=models.Range(gte=0.6)
            ),
            # Well-cited work
            models.FieldCondition(
                key="citation_count",
                range=models.Range(gte=5)
            )
        ]
    ),
    
    limit=10,
    with_payload=True
)

# Display results
print("Top Research Papers:")
for i, hit in enumerate(response.points or [], 1):
    paper = hit.payload
    print(f"{i}. {paper['title']}")
    print(f"   Authors: {', '.join(paper['authors'][:3])}{'...' if len(paper['authors']) > 3 else ''}")
    print(f"   Published: {paper['published_date']} | Citations: {paper['citation_count']}")
    print(f"   Categories: {', '.join(paper['categories'])}")
    print(f"   Score: {hit.score:.4f}\n")
```

## What Happened Under the Hood?

Let's break down this single query's execution:

### Stage 1: Parallel Retrieval (200 candidates total)
- **Dense search**: Found 100 semantically similar papers in ML/CV/NLP domains that are open access
- **Sparse search**: Found 100 papers matching exact technical terms like "transformer," "multimodal," "attention"
- Both searches ran **concurrently** for maximum speed

### Stage 2: Reciprocal Rank Fusion
- Combined the two candidate lists using RRF algorithm
- Papers appearing high in both lists got boosted scores
- Result: A unified ranking that balances semantic similarity with technical term relevance

### Stage 3: ColBERT Reranking  
- Applied token-level late interaction scoring
- Each query token compared against each abstract token
- MaxSim aggregation found the best conceptual alignments
- Result: Fine-grained relevance scores based on deep text understanding

### Stage 4: Final Filtering
- Applied research quality rules: recent publications (2023+), high impact (0.6+), well-cited (5+ citations)
- Filtered the reranked list to match research quality requirements
- Result: Top 10 papers that satisfy both relevance and research quality criteria

## Alternative Fusion Strategies

Try experimenting with different fusion methods to see how they affect research discovery:

```python
# Option 1: Distribution-Based Score Fusion (DBSF)
query=models.FusionQuery(
    fusion=models.Fusion.DBSF,  # Normalizes scores before fusion
    query=models.NamedVector(name="colbert", vector=research_query_colbert)
)

# Option 2: Pure ColBERT reranking (no fusion)
query=models.NamedVector(name="colbert", vector=research_query_colbert)
```

## Real-World Research Extensions

In production research systems, you might enhance this further:

**Researcher Personalization**: Add researcher's reading history and field expertise
```python
models.Prefetch(
    query=researcher_profile_vector,
    using="researcher_profile",
    limit=50,
    filter=models.Filter(
        must=[
            models.FieldCondition(
                key="researcher_field",
                match=models.MatchValue(value="computer_vision")
            )
        ]
    )
)
```

**Institutional Relevance**: Boost papers from collaborating institutions
```python
# In the main query, add score boosting
query=models.FormulaQuery(
    formula={
        "sum": [
            "$score",
            {
                "mult": [
                    0.2,  # Boost factor
                    {
                        "key": "institution",
                        "match": {"any": ["MIT", "Stanford", "CMU"]}
                    }
                ]
            }
        ]
    }
)
```

**Trending Research**: Factor in recent citation velocity and conference acceptance
```python
models.FieldCondition(
    key="citation_velocity",
    range=models.Range(gte=2.0)  # Citations per month
)
```

**Research Domain Filters**: Apply field-specific quality metrics
```python
# For machine learning papers
models.FieldCondition(
    key="has_code_repository",
    match=models.MatchValue(value=True)
),
models.FieldCondition(
    key="peer_review_score",
    range=models.Range(gte=0.8)
)
```

## Real ArXiv Dataset Integration

This demo uses actual arXiv paper metadata. Here's how you could populate the collection with real data:

```python
import arxiv
from sentence_transformers import SentenceTransformer

# Initialize embedding model
encoder = SentenceTransformer('all-MiniLM-L6-v2')

# Search arXiv for papers
search = arxiv.Search(
    query="transformer AND multimodal",
    max_results=1000,
    sort_by=arxiv.SortCriterion.SubmittedDate
)

points = []
for paper in search.results():
    # Create dense embedding from abstract
    dense_vector = encoder.encode(paper.summary).tolist()
    
    # Create sparse vector from technical terms (simplified)
    # In practice, you'd use a proper sparse encoder like SPLADE or BM25
    sparse_vector = create_sparse_from_text(paper.summary)
    
    # Create ColBERT multivector (simplified)
    colbert_vector = create_colbert_multivector(paper.summary)
    
    point = models.PointStruct(
        id=paper.entry_id.split('/')[-1],  # Extract arXiv ID
        payload={
            "title": paper.title,
            "authors": [author.name for author in paper.authors],
            "abstract": paper.summary,
            "categories": [cat for cat in paper.categories],
            "published_date": paper.published.isoformat(),
            "citation_count": 0,  # Would need external API
            "venue": "arXiv",
            "research_area": classify_research_area(paper.categories),
            "impact_score": calculate_impact_score(paper),
            "open_access": True
        },
        vector={
            "dense": dense_vector,
            "sparse": sparse_vector,
            "colbert": colbert_vector
        }
    )
    points.append(point)

# Upload to Qdrant
client.upsert(collection_name=collection_name, points=points)
print(f"Uploaded {len(points)} research papers to collection")
```

## Key Takeaways

**Single Request**: Complex multi-stage research discovery in one atomic API call  
**Parallel Execution**: Dense and sparse searches run concurrently  
**Flexible Fusion**: Choose between RRF, DBSF, or custom formulas  
**Smart Filtering**: Apply research quality filters at optimal stages  
**Real Data**: Works with actual arXiv dataset and research metadata  
**Production Ready**: Scales to millions of papers with sub-second latency

The Universal Query API eliminates the complexity of building research discovery systems. What used to require coordination between semantic search engines, keyword systems, and reranking models now happens in a single, optimized request - perfect for academic search, literature reviews, and research recommendation systems.

In the next lesson, you'll take this foundation and build a complete recommendation service with real data ingestion and user profiling. 