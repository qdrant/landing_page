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

from fastembed.common.model_description import ModelSource
from fastembed.rerank.cross_encoder import TextCrossEncoder

# FastEmbed doesn't ship this model, so register its ONNX export first.
TextCrossEncoder.add_custom_model(
    model="Alibaba-NLP/gte-reranker-modernbert-base",
    sources=ModelSource(hf="Alibaba-NLP/gte-reranker-modernbert-base"),
    model_file="onnx/model.onnx",
    size_in_gb=0.6,
)
reranker = TextCrossEncoder(model_name="Alibaba-NLP/gte-reranker-modernbert-base")

hits = client.query_points(
    collection_name="docs",
    query=dense_query,
    using="dense",
    limit=50,
    with_payload=["text"],
).points

scores = list(reranker.rerank(query_text, [hit.payload["text"] for hit in hits]))
reranked = [hit for _, hit in sorted(zip(scores, hits), key=lambda pair: -pair[0])][:10]
```
