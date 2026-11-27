```python
client.create_collection(
    collection_name="docs",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "late_interaction": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
        ),
    },
)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=dense_query, using="dense", limit=100),
    query=late_interaction_query,  # one vector per query token
    using="late_interaction",
    limit=10,
)

from fastembed.postprocess import Muvera

muvera = Muvera(dim=128, k_sim=4, dim_proj=16, r_reps=40, random_seed=42)

client.create_vector_name(
    collection_name="docs",
    vector_name="muvera",
    vector_name_config=models.DenseVectorNameConfig(
        dense=models.DenseVectorConfig(size=10240, distance=models.Distance.COSINE),
    ),
)

# At ingestion, store muvera.process_document(doc_tokens) in a "muvera" vector.
query_fde = muvera.process_query(query_tokens)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=query_fde, using="muvera", limit=500),
    query=query_tokens,
    using="late_interaction",
    limit=10,
)

client.create_vector_name(
    collection_name="docs",
    vector_name="mean_pooled",
    vector_name_config=models.DenseVectorNameConfig(
        dense=models.DenseVectorConfig(size=128, distance=models.Distance.COSINE),
    ),
)

# At ingestion, store doc_tokens.mean(axis=0) in a "mean_pooled" vector.
query_pooled = query_tokens.mean(axis=0)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=query_pooled, using="mean_pooled", limit=500),
    query=query_tokens,
    using="late_interaction",
    limit=10,
)
```
