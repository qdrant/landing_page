### Fine-Tuning Search Parameters

You can adjust search parameters like `hnsw_ef` and `exact` to balance between speed and precision:

**Key Parameters:**
- `hnsw_ef`: Number of neighbors to visit during search (higher value = better accuracy, slower speed).
- `exact`: Set to `true` for exact search, which is slower but more accurate. You can use it to compare results of the search with different `hnsw_ef` values versus the ground truth.

