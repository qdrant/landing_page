from qdrant_client import QdrantClient
from qdrant_client.models import Document

client = QdrantClient(url="https://xyz-example.qdrant.io:6333", api_key="<your-api-key>", cloud_inference=True) # @hide

query_text = "vegetarian dishes"

results = client.query_points(
    collection_name="items",
    query=Document(text=query_text, model="sentence-transformers/all-MiniLM-L6-v2"),
    with_payload=True,
    limit=5,
)

for result in results.points:
    payload = result.payload or {}
    print(f"Item: {payload.get('item_name', 'N/A')}")
    print(f"Score: {result.score}")
    print(f"Description: {payload.get('description', 'N/A')[:150]}...")
    print(f"Price: {payload.get('price', 'N/A')}")
    print("---")
