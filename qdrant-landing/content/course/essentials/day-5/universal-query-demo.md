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

### Initialize the Collection with Vector Configurations

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
```

### Create Payload Indexes

Before ingesting any data, we create payload indexes for the fields we'll filter by. Qdrant's version of HNSW incorporates payload filtering directly into the search process for efficiency.

```python
# Index fields that will be used for filtering
client.create_payload_index(
    collection_name=collection_name,
    field_name="research_area",
    field_schema="keyword",  # For filtering by domain (ML, CV, NLP)
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="open_access",
    field_schema="bool",  # For filtering open access papers
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
```

## Prepare and Ingest Research Paper Data

Now that our collection is configured with vectors and payload indexes, let's take some sample research papers:

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
```

We'll use FastEmbed to generate dense, sparse, and ColBERT embeddings for the abstracts. Then we upload everything to Qdrant:

```python
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

Let's build a sophisticated research discovery query step by step. We'll orchestrate dense search, sparse search, RRF fusion, and ColBERT reranking - all in a single API call.

### Prepare Query Embeddings

First, we encode our research query using all three embedding models:

```python
research_query = "transformer architectures for multimodal learning"

research_query_dense = next(dense_model.query_embed(research_query))
research_query_sparse = next(sparse_model.query_embed(research_query)).as_object()
research_query_colbert = next(colbert_model.query_embed(research_query))
```

We generate three different representations of the same query - each optimized for a different stage of our retrieval pipeline.

### Define Global Filter with Automatic Propagation

Now we define quality constraints that will apply throughout our entire search pipeline:

```python
# Define global filter - this will be propagated to ALL prefetch stages
global_filter = models.Filter(
    must=[
        # Research domain filtering
        models.FieldCondition(
            key="research_area",
            match=models.MatchAny(any=[
                "machine_learning",
                "computer_vision",
                "nlp",
            ]),
        ),
        # Open access only
        models.FieldCondition(
            key="open_access",
            match=models.MatchValue(value=True)
        ),
        # Recent research only (last 6 years)
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
```

**Key insight**: This filter will be automatically propagated to ALL prefetch stages. Qdrant doesn't do "late filtering" or "post-filtering" - the filters are applied at the HNSW search level for maximum efficiency. This is enabled by the payload indexes we created in Step 1.

### Set Up Parallel Prefetch Queries

Next, we configure our hybrid retrieval with two concurrent searches:

```python
# Prefetch queries - global filter will be automatically applied to both
hybrid_query = [
    # Dense retrieval: semantic understanding
    models.Prefetch(query=research_query_dense, using="dense", limit=100),
    # Sparse retrieval: exact technical term matching
    models.Prefetch(query=research_query_sparse, using="sparse", limit=100),
]
```

These two prefetch queries run in parallel:

- **Dense search**: Finds semantically similar papers based on research concepts - but only considers papers matching our global filter (ML/CV/NLP domains, open access, recent, high-impact, well-cited)
- **Sparse search**: Matches exact technical terms like "transformer," "multimodal," "attention" - but only within the same filtered subset
- Both searches execute concurrently for maximum speed
- Filter propagation happens automatically - no manual coordination needed

We could retrieve up to 200 candidates total (100 from each search), but many will overlap.

### Add Fusion Stage

Now we combine the two filtered candidate lists using Reciprocal Rank Fusion:

```python
# Fusion stage - combines dense and sparse results
fusion_query = models.Prefetch(
    prefetch=hybrid_query,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=100,
)
```

The RRF algorithm:
- Combines the two filtered candidate lists intelligently
- Papers appearing high in both lists get boosted scores
- Creates a unified ranking that balances semantic similarity with technical term relevance
- All results still satisfy the global filter constraints

### Execute the Universal Query with ColBERT Reranking

Finally, we send our complete query that ties everything together:

```python
# The Universal Query: Global filter propagates through all stages
response = client.query_points(
    collection_name=collection_name,
    prefetch=fusion_query,
    query=research_query_colbert,
    using="colbert",
    query_filter=global_filter,  # Propagates to all prefetch stages
    limit=10,
    with_payload=True,
)
```

This final stage applies ColBERT reranking to the fused results:
- Token-level late interaction scoring examines fine-grained text alignment
- Each query token is compared against each abstract token
- MaxSim aggregation finds the best conceptual alignments
- Returns the top 10 papers with precise relevance scores

**Why this matters**: By applying filters at every stage (not after retrieval), Qdrant maintains high accuracy while avoiding wasted computation on papers that would be filtered out anyway.

### Display Results

```python
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

And there you have it - a sophisticated multi-stage research discovery system in a single declarative query!

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
