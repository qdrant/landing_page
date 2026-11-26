from qdrant_client import QdrantClient, models

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

results = client.query_points(
    collection_name="venues",
    query=models.Document(text="quiet café to work from", model="sentence-transformers/all-minilm-l6-v2"),
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="location",
                geo_radius=models.GeoRadius(
                    center=models.GeoPoint(lon=13.403683, lat=52.520711),
                    radius=1500.0,
                ),
            )
        ]
    ),
    limit=5,
)
