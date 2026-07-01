from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.update_collection(
    collection_name="{collection_name}",
    optimizers_config=models.OptimizersConfigDiff(max_optimization_threads=1),
)
