```python
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
