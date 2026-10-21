```python
import voyageai
from qdrant_client import QdrantClient, models

vo = voyageai.Client()
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector search engine.",
    "Voyage AI embedding models turn text into dense vectors.",
]

response = vo.embed(documents, model="voyage-4-large", input_type="document")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": text})
        for idx, (vector, text) in enumerate(zip(response.embeddings, documents))
    ],
)

query_vector = vo.embed(
    ["What is Qdrant?"], model="voyage-4-large", input_type="query"
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

response = vo.embed(
    documents,
    model="voyage-4-large",
    input_type="document",
    output_dimension=512,
)

from PIL import Image

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

image_inputs = [[Image.open("diagram.png")]]

image_response = vo.multimodal_embed(
    image_inputs,
    model="voyage-multimodal-3.5",
    input_type="document",
)

client.upsert(
    collection_name="{image_collection_name}",
    points=[models.PointStruct(id=0, vector=image_response.embeddings[0], payload={"image": "diagram.png"})],
)

query_inputs = [["How is Qdrant deployed?"]]

query_vector = vo.multimodal_embed(
    query_inputs, model="voyage-multimodal-3.5", input_type="query"
).embeddings[0]

hits = client.query_points(
    collection_name="{image_collection_name}",
    query=query_vector,
    limit=3,
).points

query_vector = vo.embed(
    ["What is Qdrant?"],
    model="voyage-4-nano",
    input_type="query",
    output_dimension=1024,
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
