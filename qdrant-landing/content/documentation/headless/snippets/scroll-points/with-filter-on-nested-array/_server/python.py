from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        should=[
            models.FieldCondition(
                key="country.cities[].population",
                range=models.Range(
                    gt=None,
                    gte=9.0,
                    lt=None,
                    lte=None,
                ),
            ),
        ],
    ),
)
