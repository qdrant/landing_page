```python
from fastembed.postprocess import Muvera

muvera = Muvera(dim=128, k_sim=4, dim_proj=16, r_reps=40, random_seed=42)

# At ingestion, store muvera.process_document(doc_tokens) in a "muvera" vector.
query_fde = muvera.process_query(query_tokens)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=query_fde, using="muvera", limit=500),
    query=query_tokens,
    using="late_interaction",
    limit=10,
)
```
