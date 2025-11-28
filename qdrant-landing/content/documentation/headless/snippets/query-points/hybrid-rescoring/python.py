# type: ignore # error: Argument "query" to "Prefetch" has incompatible type "list[int]"; expected "list[float] | SparseVector | list[list[float]] | int | str | <13 more items> | None"  [arg-type] # @hide
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[1, 23, 45, 67],  # <------------- small byte vector
        using="mrl_byte",
        limit=1000,
    ),
    query=[0.01, 0.299, 0.45, 0.67],  # <-- full vector
    using="full",
    limit=10,
)
