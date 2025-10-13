---
title: "Project: Building a Recommendation System"
weight: 4
---

{{< date >}} Day 5 {{< /date >}}

# Project: Building a Recommendation System

Bring together dense, sparse, and multivectors in one atomic Universal Query. You'll retrieve candidates, fuse signals, rerank with ColBERT, and apply business filters - in a single request.

## Your Mission

Build a complete recommendation system using Qdrant’s Universal Query API with dense, sparse, and ColBERT multivectors in one request.

**Estimated Time:** 90 minutes

## What You'll Build

A hybrid recommendation system using:

- **Multi-vector architecture** with dense, sparse, and ColBERT vectors
- **Universal Query API** for atomic multi-stage search
- **RRF fusion** for combining candidates
- **ColBERT reranking** for fine-grained relevance scoring
- **Business rule filtering** at multiple pipeline stages
- **Production-ready patterns** for recommendation systems

## Build Steps

### Step 1: Set Up the Hybrid Collection

```python
from qdrant_client import QdrantClient, models
from datetime import datetime

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
            hnsw_config=models.HnswConfigDiff(
                m=0
            ),  # Disable HNSW, used only for reranking
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            index=models.SparseIndexParams(on_disk=False)
        )
    },
)

client.create_payload_index(
    collection_name=collection_name,
    field_name="category",
    field_schema="keyword",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="user_segment",
    field_schema="keyword",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="release_date",
    field_schema="datetime",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="popularity_score",
    field_schema="float",
)
client.create_payload_index(
    collection_name=collection_name,
    field_name="rating",
    field_schema="float",
)
```

Why this setup: multivectors with `MAX_SIM` for ColBERT, m=0 since it reranks only, and IDF for sparse.

### Step 2: Prepare and Upload Recommendation Data

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
        "release_date": "1999-03-31T00:00:00Z",
    },
    # Add more sample data...
]

texts = [it["description"] for it in sample_data]

from fastembed import TextEmbedding, SparseTextEmbedding, LateInteractionTextEmbedding

# Models
DENSE_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"  # 384-dim
SPARSE_MODEL_ID = "prithivida/Splade_PP_en_v1"  # SPLADE sparse
COLBERT_MODEL_ID = "colbert-ir/colbertv2.0"  # 128-dim multivector

dense_model = TextEmbedding(DENSE_MODEL_ID)
sparse_model = SparseTextEmbedding(SPARSE_MODEL_ID)
colbert_model = LateInteractionTextEmbedding(COLBERT_MODEL_ID)

dense_embeds = list(
    dense_model.embed(texts, parallel=0)
)  # list[np.ndarray] shape (384,)
sparse_embeds = list(
    sparse_model.embed(texts, parallel=0)
)  # list[SparseEmbedding] with .indices/.values
colbert_multivectors = list(
    colbert_model.embed(texts, parallel=0)
)  # list[np.ndarray] shape (tokens, 128)


# Generate vectors for each item
points = []
for i, item in enumerate(sample_data):
    # Create sparse vector (keyword matching)
    sparse_vector = sparse_embeds[i].as_object()

    # Create dense vector (semantic understanding)
    dense_vector = dense_embeds[i]

    # Create ColBERT multivector (token-level understanding)
    colbert_vector = colbert_multivectors[i]

    points.append(
        models.PointStruct(
            id=i,
            vector={
                "dense": dense_vector,
                "colbert": colbert_vector,
                "sparse": sparse_vector,
            },
            payload=item,
        )
    )

client.upload_points(collection_name=collection_name, points=points)
print(f"Uploaded {len(points)} recommendation items")
```

### Step 3: One Universal Query — Retrieve → Fuse → Rerank → Filter

```python
from datetime import timedelta

# Example user intent
user_query = "premium user likes sci-fi action movies with strong hacker themes"

user_dense_vector = next(dense_model.query_embed(user_query))
user_sparse_vector = next(sparse_model.query_embed(user_query)).as_object()
user_multivector = next(colbert_model.query_embed(user_query))  # list of token vectors

# Filters
must_early_filter = models.Filter(
    must=[
        models.FieldCondition(key="category", match=models.MatchValue(value="movie")),
        models.FieldCondition(
            key="user_segment", match=models.MatchValue(value="premium")
        ),
    ]
)

must_late_filter = models.Filter(
    must=[
        models.FieldCondition(
            key="release_date",
            range=models.DatetimeRange(
                gte=(datetime.now() - timedelta(days=365 * 30)).isoformat()
            ),
        ),
        models.FieldCondition(key="popularity_score", range=models.Range(gte=0.7)),
    ]
)

# Prefetch queries
hybrid_query = [
    models.Prefetch(query=user_dense_vector, using="dense", limit=100),
    models.Prefetch(query=user_sparse_vector, using="sparse", limit=100),
]

fusion_query = models.Prefetch(
    prefetch=hybrid_query,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    filter=must_early_filter,
    limit=100,
)

response = client.query_points(
    collection_name=collection_name,
    prefetch=fusion_query,
    query=user_multivector,
    using="colbert",
    query_filter=must_late_filter,
    limit=10,
    with_payload=True,
)

for hit in response.points or []:
    print(hit.payload)
```

Why this works: Fusion happens inside `Prefetch` with `RRF`, then ColBERT reranks with multivectors in the main `query`. All in one call.


### Step 4: Build a Recommendation Service

```python
def get_recommendations(user_profile, user_preference=None, limit=10):
    """
    Get personalized recommendations using Universal Query API

    Args:
        user_profile: {
            "liked_titles": list[str],      # optional
            "preferred_genres": list[str],  # e.g. ["sci-fi","action"]
            "segment": str,                 # e.g. "premium"
            "query": str                    # free-text intent, e.g. "smart sci-fi with hacker vibe"
        }
        user_preference: {
            "category": str | None,         # e.g. "movie"
            "min_rating": float | None,     # e.g. 8.0
            "released_within_days": int | None  # e.g. 365
        }
        limit: top-k to return
    """

    # Build a compact free-text query from profile
    user_dense_vector = next(dense_model.query_embed(user_profile["query"]))
    user_sparse_vector = next(
        sparse_model.query_embed(user_profile["query"])
    ).as_object()
    user_multivector = next(colbert_model.query_embed(user_profile["query"]))

    # Build dynamic filters
    must_early = []
    if user_profile.get("segment"):
        must_early.append(
            models.FieldCondition(
                key="user_segment",
                match=models.MatchValue(value=user_profile["segment"]),
            )
        )
    if user_preference and user_preference.get("category"):
        must_early.append(
            models.FieldCondition(
                key="category",
                match=models.MatchValue(value=user_preference["category"]),
            )
        )
    must_early_filter = models.Filter(must=must_early)

    must_late = []
    if user_preference and user_preference.get("min_rating") is not None:
        must_late.append(
            models.FieldCondition(
                key="rating", range=models.Range(gte=user_preference["min_rating"])
            )
        )
    if user_preference and user_preference.get("released_within_days"):
        from datetime import datetime, timedelta

        days = int(user_preference["released_within_days"])
        must_late.append(
            models.FieldCondition(
                key="release_date",
                range=models.DatetimeRange(
                    gte=(datetime.utcnow() - timedelta(days=days)).isoformat()
                ),
            )
        )
    must_late_filter = models.Filter(must=must_late)

    # Prefetch queries
    hybrid_query = [
        models.Prefetch(query=user_dense_vector, using="dense", limit=100),
        models.Prefetch(query=user_sparse_vector, using="sparse", limit=100),
    ]

    fusion_query = models.Prefetch(
        prefetch=hybrid_query,
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        filter=must_early_filter,
        limit=100,
    )

    # Universal query with all stages
    response = client.query_points(
        collection_name=collection_name,
        prefetch=fusion_query,
        query=user_multivector,
        using="colbert",
        query_filter=must_late_filter,
        limit=limit,
        with_payload=True,
    )

    return [
        {
            "title": hit.payload["title"],
            "description": hit.payload["description"],
            "score": hit.score,
            "metadata": {
                k: v
                for k, v in hit.payload.items()
                if k not in ["title", "description"]
            },
        }
        for hit in (response.points or [])
    ]
```

Test:

```python
# Test the recommendation service
user_profile = {
    "liked_titles": ["The Matrix", "Blade Runner"],
    "preferred_genres": ["sci-fi", "action"],
    "segment": "premium",
    "query": "highly rated cyberpunk movies",
}

recommendations = get_recommendations(
    user_profile,
    user_preference={
        "category": "movie",
        "min_rating": 8.0,
        "released_within_days": 365 * 30,
    },
    limit=10,
)

for i, rec in enumerate(recommendations, 1):
    print(f"{i}. {rec['title']} (Score: {rec['score']:.3f})")
```

## What Happened Under the Hood

Qdrant retrieved 100 candidates from dense and 100 from sparse in parallel, fused them with RRF, reranked with ColBERT's MaxSim over token‑level subvectors, applied final business filters, and returned the top 10 - all in one call.

## Success Criteria

You'll know you've succeeded when:

<input type="checkbox"> Your collection contains dense, sparse, and ColBERT vectors  
<input type="checkbox"> You can execute complex multi-stage searches in a single API call  
<input type="checkbox"> RRF fusion effectively combines different vector types  
<input type="checkbox"> ColBERT reranking improves result relevance  
<input type="checkbox"> Business filters work at both early and late stages  
<input type="checkbox"> Your recommendation service provides personalized, high-quality results

## Key Questions to Answer

1. How does the Universal Query API simplify your recommendation pipeline?
2. Which fusion strategy (RRF vs DBSF) works better for your use case?
3. How does ColBERT reranking affect recommendation quality?
4. What's the performance impact of multi-stage filtering?

## Share Your Discovery

Show your run and learn from others. 

**Post your results in** <a href="https://discord.com/invite/qdrant" target="_blank" rel="noopener noreferrer" aria-label="Qdrant Discord">
  <img src="https://img.shields.io/badge/Qdrant%20Discord-5865F2?style=flat&logo=discord&logoColor=white&labelColor=5865F2&color=5865F2"
       alt="Post your results in Discord"
       style="display:inline; margin:0; vertical-align:middle; border-radius:9999px;" />
</a> **with this copy-paste template:**

```bash
Domain: “I built recs for [domain]”
Data: [N items], fields: [category, user_segment, rating, date...]

Query: “[user intent]”
Early filter: category=[...], segment=[...]
Late filter: rating≥..., release_date≥...

Fusion: [RRF or DBSF], k_dense=100, k_sparse=100
Reranker: ColBERT (MaxSim), top-k=10

Top picks (rank → title → score):
1) ...
2) ...
3) ...

Why these won: [token match like “hacker”, genre overlap, strong rating]
Speed: prefetch ~X ms | rerank ~Y ms | total ~Z ms
Dropped by rules: [ids/titles and which rule]
Surprise: “[one thing you didn’t expect]”
Next step: “[what you’ll try next]”
```

### What to include

* One line on how dense, sparse, and ColBERT each helped.
* Early vs late filter effect (what got filtered where).
* RRF vs DBSF quick note (which ranked better for your query).
* A short timing snapshot (prefetch, rerank, total).
* One decision you’d ship with today (e.g., “use RRF for cold start users”).

### Bonus (optional)

* Add a tiny table with `rank, id, title, dense_score, sparse_score, colbert_score`.
* Share a before/after list showing items removed by business rules.

## Optional Extensions

### Experiment with Fusion Strategies

Compare RRF with Distribution-Based Score Fusion:

```python
# Test DBSF vs RRF
# Filters and other prefetch params same as above

fusion_query = models.Prefetch(
    prefetch=hybrid_query,
    query=models.FusionQuery(fusion=models.Fusion.DBSF),
    filter=must_early_filter,
    limit=100,
)

response = client.query_points(
    collection_name=collection_name,
    prefetch=fusion_query,
    query=user_multivector,
    using="colbert",
    query_filter=must_late_filter,
    limit=10,
    with_payload=True,
)

for hit in response.points or []:
    print(hit.payload)
```

### A/B Testing Framework

```python
def ab_test_fusion_strategies(user_profiles, user_preferences):
    """Compare RRF vs DBSF performance"""

    results = {"RRF": [], "DBSF": []}

    for user_profile, user_preference in zip(user_profiles, user_preferences):
        for fusion_type in [models.Fusion.RRF, models.Fusion.DBSF]:
            # Run recommendation query
            user_dense_vector = next(dense_model.query_embed(user_profile["query"]))
            user_sparse_vector = next(
                sparse_model.query_embed(user_profile["query"])
            ).as_object()
            user_multivector = next(colbert_model.query_embed(user_profile["query"]))

            # Build dynamic filters
            must_early = []
            if user_profile.get("segment"):
                must_early.append(
                    models.FieldCondition(
                        key="user_segment",
                        match=models.MatchValue(value=user_profile["segment"]),
                    )
                )
            if user_preference and user_preference.get("category"):
                must_early.append(
                    models.FieldCondition(
                        key="category",
                        match=models.MatchValue(value=user_preference["category"]),
                    )
                )
            must_early_filter = models.Filter(must=must_early)

            must_late = []
            if user_preference and user_preference.get("min_rating") is not None:
                must_late.append(
                    models.FieldCondition(
                        key="rating", range=models.Range(gte=user_preference["min_rating"])
                    )
                )
            if user_preference and user_preference.get("released_within_days"):
                from datetime import datetime, timedelta

                days = int(user_preference["released_within_days"])
                must_late.append(
                    models.FieldCondition(
                        key="release_date",
                        range=models.DatetimeRange(
                            gte=(datetime.utcnow() - timedelta(days=days)).isoformat()
                        ),
                    )
                )
            must_late_filter = models.Filter(must=must_late)

            # Prefetch queries
            hybrid_query = [
                models.Prefetch(query=user_dense_vector, using="dense", limit=100),
                models.Prefetch(query=user_sparse_vector, using="sparse", limit=100),
            ]

            fusion_query = models.Prefetch(
                prefetch=hybrid_query,
                query=models.FusionQuery(fusion=fusion_type),
                filter=must_early_filter,
                limit=100,
            )

            response = client.query_points(
                collection_name=collection_name,
                prefetch=fusion_query,
                query=user_multivector,
                using="colbert",
                query_filter=must_late_filter,
                limit=10,
                with_payload=True,
            )

            strategy_name = "RRF" if fusion_type == models.Fusion.RRF else "DBSF"
            results[strategy_name].append(
                {
                    "user_id": user_profile["user_id"],
                    "recommendations": [hit.id for hit in response.points],
                    "scores": [hit.score for hit in response.points],
                }
            )

    return results
```

## Next Steps

Turn this into a mini‑service: ingest your own items and user signals, write a tiny function that takes profile vectors and returns top‑k via the Universal Query API, then experiment with filters and fusion strategies (try DBSF vs RRF) to see how ranking shifts. 