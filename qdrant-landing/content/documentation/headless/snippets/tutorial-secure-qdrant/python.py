from qdrant_client import QdrantClient, models

# @block-start upsert-no-auth
client = QdrantClient(url="https://localhost:6333")

try:
    client.create_collection(
        collection_name="my_collection",
        vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
    )

    client.upsert(
        collection_name="my_collection",
        points=[models.PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4])],
    )
except Exception as e:
    print(e)  # 401 Unauthorized
# @block-end upsert-no-auth

# @block-start upsert-admin-key
client = QdrantClient(url="https://localhost:6333", api_key="my-admin-key")

client.create_collection(
    collection_name="my_collection",
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)

client.upsert(
    collection_name="my_collection",
    points=[models.PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4])],
)
# @block-end upsert-admin-key

# @block-start delete-read-only-key
client = QdrantClient(url="https://localhost:6333", api_key="my-read-only-key")

try:
    client.delete(
        collection_name="my_collection",
        points_selector=models.PointIdsList(points=[1]),
    )
except Exception as e:
    print(e)  # 403 Forbidden
# @block-end delete-read-only-key

# @block-start upsert-jwt-rw-collection
client = QdrantClient(url="https://localhost:6333", api_key="<your-jwt>")

client.upsert(
    collection_name="my_collection",
    points=[models.PointStruct(id=2, vector=[0.5, 0.6, 0.7, 0.8])],
)
# @block-end upsert-jwt-rw-collection

# @block-start upsert-jwt-ro-collection
client = QdrantClient(url="https://localhost:6333", api_key="<your-jwt>")

try:
    client.upsert(
        collection_name="other_collection",
        points=[models.PointStruct(id=2, vector=[0.5, 0.6, 0.7, 0.8])],
    )
except Exception as e:
    print(e)  # 403 Forbidden
# @block-end upsert-jwt-ro-collection
