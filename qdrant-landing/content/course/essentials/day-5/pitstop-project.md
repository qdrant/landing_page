---
title: "Project: Building a Recommendation System"
weight: 4
---

{{< date >}} Day 5 {{< /date >}}

# Project: Building a Recommendation System

Bring together dense, sparse, and multivectors in one atomic Universal Query. You'll recall candidates, fuse signals, rerank with ColBERT, and apply business filters - in a single request.

## Your Mission

Build a complete recommendation system that demonstrates the full power of Qdrant's Universal Query API by combining multiple vector types and advanced search techniques in a single, optimized request.

**Estimated Time:** 90 minutes

## What You'll Build

A hybrid recommendation system that demonstrates:

- **Multi-vector architecture** with dense, sparse, and ColBERT vectors
- **Universal Query API** for atomic multi-stage search operations
- **Intelligent fusion** using Reciprocal Rank Fusion (RRF)
- **ColBERT reranking** for fine-grained relevance scoring
- **Business rule filtering** at multiple pipeline stages
- **Production-ready patterns** for recommendation systems

## Implementation Steps

### Step 1: Set up the hybrid collection

```python
from qdrant_client import QdrantClient, models
from datetime import datetime, timedelta

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)
collection_name = "recommendations_hybrid"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),  # used only for reranking
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(index=models.SparseIndexParams(on_disk=False))
    },
)
```

### Step 2: Prepare and upload recommendation data

```python
# Example: Create sample movie/content data
sample_data = [
    {
        "title": "The Matrix",
        "description": "A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
        "category": "movie",
        "genre": ["sci-fi", "action"],
        "year": 1999,
        "rating": 8.7,
        "user_segment": "premium",
        "popularity_score": 0.9,
        "release_date": "1999-03-31T00:00:00Z"
    },
    # Add more sample data...
]

# Generate vectors for each item
points = []
for i, item in enumerate(sample_data):
    # Create dense vector (semantic understanding)
    dense_vector = encoder.encode(item["description"]).tolist()
    
    # Create sparse vector (keyword matching)
    sparse_vector = create_sparse_vector(item["description"])
    
    # Create ColBERT multivector (token-level understanding)
    colbert_vector = create_colbert_multivector(item["description"])
    
    points.append(models.PointStruct(
        id=i,
        vector={
            "dense": dense_vector,
            "colbert": colbert_vector
        },
        sparse_vector={"sparse": sparse_vector},
        payload=item
    ))

client.upload_points(collection_name=collection_name, points=points)
print(f"Uploaded {len(points)} recommendation items")
```

### Step 3: One Universal Query: recall → fuse → rerank → filter

```python
# Example user signals
user_dense_vector = [0.12] * 384
user_sparse_vector = models.SparseVector(indices=[1, 42, 58], values=[0.8, 0.5, 0.9])
query_multivector = [[0.1] * 128, [0.09] * 128, [0.13] * 128]

response = client.query_points(
    collection_name=collection_name,
    prefetch=[
        models.Prefetch(
            query=user_dense_vector,
            using="dense",
            limit=100,
            filter=models.Filter(
                must=[
                    models.FieldCondition(key="category", match=models.MatchValue(value="movie")),
                    models.FieldCondition(key="user_segment", match=models.MatchValue(value="premium")),
                ]
            ),
        ),
        models.Prefetch(query=user_sparse_vector, using="sparse", limit=100),
    ],
    query=models.FusionQuery(
        fusion=models.Fusion.RRF,
        query=models.NamedVector(name="colbert", vector=query_multivector),
    ),
    filter=models.Filter(
        must=[
            models.FieldCondition(
                key="release_date",
                range=models.DatetimeRange(gte=(datetime.now() - timedelta(days=365)).isoformat()),
            ),
            models.FieldCondition(key="popularity_score", range=models.Range(gte=0.7)),
        ]
    ),
    limit=10,
    with_payload=True,
)

for hit in (response.points or []):
    print(hit.payload)
```

### Step 4: Build a recommendation service

```python
def get_recommendations(user_profile, preferences=None, limit=10):
    """
    Get personalized recommendations using Universal Query API
    
    Args:
        user_profile: Dict with user preferences and history
        preferences: Optional filters for category, genre, etc.
        limit: Number of recommendations to return
    """
    
    # Generate user vectors based on profile
    user_dense = generate_user_dense_vector(user_profile)
    user_sparse = generate_user_sparse_vector(user_profile)
    user_colbert = generate_user_colbert_vector(user_profile)
    
    # Build dynamic filters
    must_conditions = []
    if preferences:
        if preferences.get("category"):
            must_conditions.append(
                models.FieldCondition(
                    key="category", 
                    match=models.MatchValue(value=preferences["category"])
                )
            )
        if preferences.get("min_rating"):
            must_conditions.append(
                models.FieldCondition(
                    key="rating",
                    range=models.Range(gte=preferences["min_rating"])
                )
            )
    
    # Universal query with all stages
    response = client.query_points(
        collection_name=collection_name,
        prefetch=[
            models.Prefetch(
                query=user_dense,
                using="dense",
                limit=100,
                filter=models.Filter(must=must_conditions) if must_conditions else None
            ),
            models.Prefetch(
                query=user_sparse,
                using="sparse",
                limit=100
            ),
        ],
        query=models.FusionQuery(
            fusion=models.Fusion.RRF,
            query=models.NamedVector(name="colbert", vector=user_colbert),
        ),
        filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="popularity_score",
                    range=models.Range(gte=0.6)
                )
            ]
        ),
        limit=limit,
        with_payload=True,
    )
    
    return [
        {
            "title": hit.payload["title"],
            "description": hit.payload["description"],
            "score": hit.score,
            "metadata": {k: v for k, v in hit.payload.items() 
                        if k not in ["title", "description"]}
        }
        for hit in (response.points or [])
    ]

# Test the recommendation service
user_profile = {
    "viewed_movies": ["The Matrix", "Blade Runner"],
    "preferred_genres": ["sci-fi", "action"],
    "rating_threshold": 7.0
}

recommendations = get_recommendations(
    user_profile, 
    preferences={"category": "movie", "min_rating": 8.0}
)

for i, rec in enumerate(recommendations, 1):
    print(f"{i}. {rec['title']} (Score: {rec['score']:.3f})")
```

## What Happened Under the Hood

Qdrant recalled 100 candidates from dense and 100 from sparse in parallel, fused them with RRF, reranked with ColBERT's MaxSim over token‑level subvectors, applied final business filters, and returned the top 10 - all in one call.

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> Your collection contains dense, sparse, and ColBERT vectors  
<input type="checkbox"> You can execute complex multi-stage searches in a single API call  
<input type="checkbox"> RRF fusion effectively combines different vector types  
<input type="checkbox"> ColBERT reranking improves result relevance  
<input type="checkbox"> Business filters work at both early and late stages  
<input type="checkbox"> Your recommendation service provides personalized, high-quality results

## Optional Extensions

### Experiment with Fusion Strategies

Compare RRF with Distribution-Based Score Fusion:

```python
# Test DBSF vs RRF
dbsf_response = client.query_points(
    collection_name=collection_name,
    prefetch=[
        models.Prefetch(query=user_dense_vector, using="dense", limit=100),
        models.Prefetch(query=user_sparse_vector, using="sparse", limit=100),
    ],
    query=models.FusionQuery(
        fusion=models.Fusion.DBSF,  # Try DBSF instead of RRF
        query=models.NamedVector(name="colbert", vector=query_multivector),
    ),
    limit=10,
    with_payload=True,
)
```

### A/B Testing Framework

```python
def ab_test_fusion_strategies(user_profiles, test_queries):
    """Compare RRF vs DBSF performance"""
    
    results = {"RRF": [], "DBSF": []}
    
    for profile in user_profiles:
        for fusion_type in [models.Fusion.RRF, models.Fusion.DBSF]:
            # Run recommendation query
            response = client.query_points(
                collection_name=collection_name,
                prefetch=[
                    models.Prefetch(query=profile["dense"], using="dense", limit=100),
                    models.Prefetch(query=profile["sparse"], using="sparse", limit=100),
                ],
                query=models.FusionQuery(
                    fusion=fusion_type,
                    query=models.NamedVector(name="colbert", vector=profile["colbert"]),
                ),
                limit=10
            )
            
            strategy_name = "RRF" if fusion_type == models.Fusion.RRF else "DBSF"
            results[strategy_name].append({
                "user_id": profile["user_id"],
                "recommendations": [hit.id for hit in response.points],
                "scores": [hit.score for hit in response.points]
            })
    
    return results
```

### Advanced Filtering

```python
# Complex business logic filtering
def advanced_recommendation_query(user_context):
    """Recommendation with sophisticated business rules"""
    
    return client.query_points(
        collection_name=collection_name,
        prefetch=[
            # Geographic relevance
            models.Prefetch(
                query=user_context["location_vector"],
                using="dense",
                limit=50,
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="available_regions",
                            match=models.MatchAny(any=[user_context["region"]])
                        )
                    ]
                )
            ),
            # Content-based filtering
            models.Prefetch(
                query=user_context["content_vector"],
                using="sparse",
                limit=50,
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="content_rating",
                            match=models.MatchAny(any=user_context["allowed_ratings"])
                        )
                    ]
                )
            ),
        ],
        query=models.FusionQuery(
            fusion=models.Fusion.RRF,
            query=models.NamedVector(name="colbert", vector=user_context["colbert_vector"]),
        ),
        filter=models.Filter(
            must=[
                # Time-based relevance
                models.FieldCondition(
                    key="trending_score",
                    range=models.Range(gte=0.5)
                ),
                # Quality threshold
                models.FieldCondition(
                    key="quality_score",
                    range=models.Range(gte=user_context["quality_threshold"])
                )
            ]
        ),
        limit=10,
        with_payload=True
    )
```

## Key Questions to Answer

1. **How does the Universal Query API simplify your recommendation pipeline?**
2. **Which fusion strategy (RRF vs DBSF) works better for your use case?**
3. **How does ColBERT reranking affect recommendation quality?**
4. **What's the performance impact of multi-stage filtering?**

## Next Steps

Turn this into a mini‑service: ingest your own items and user signals, write a tiny function that takes profile vectors and returns top‑k via the Universal Query API, then experiment with filters and fusion strategies (try DBSF vs RRF) to see how ranking shifts. 