```python
from qdrant_client import QdrantClient, models

results = client.query_points(
    collection_name="quantization_example",
    query=query_vector,
    limit=10,
    search_params=models.SearchParams(
        hnsw_ef=256,
        quantization=models.QuantizationSearchParams(
            rescore=True,
            oversampling=2.0,
        ),
    ),
)
```
