# @block-start setup
from typing import cast  # @hide
import voyageai
from qdrant_client import QdrantClient, models

vo = voyageai.Client()
client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)
# @block-end setup

# @block-start embed-documents
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Voyage AI embedding models turn text into dense vectors.",
]

response = vo.embed(documents, model="voyage-4-large", input_type="document")
response.embeddings = cast(list[list[float]], response.embeddings)  # @hide

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": text})
        for idx, (vector, text) in enumerate(zip(response.embeddings, documents))
    ],
)
# @block-end embed-documents

# @block-start embed-queries
query_vector = vo.embed(
    ["What is Qdrant?"], model="voyage-4-large", input_type="query"
).embeddings[0]
query_vector = cast(list[float], query_vector)  # @hide

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
# @block-end embed-queries

# @block-start reduce-vector-size
response = vo.embed(
    documents,
    model="voyage-4-large",
    input_type="document",
    output_dimension=512,
)
# @block-end reduce-vector-size

# @block-start embed-images
from PIL import Image

client.create_collection(
    collection_name="{image_collection_name}",
    vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE),
)

from voyageai.video_utils import Video  # @hide

image_inputs: list[list[str | Image.Image | Video]]  # @hide
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

query_inputs: list[list[str | Image.Image | Video]]  # @hide
query_inputs = [["How is Qdrant deployed?"]]

query_vector = vo.multimodal_embed(
    query_inputs, model="voyage-multimodal-3.5", input_type="query"
).embeddings[0]

hits = client.query_points(
    collection_name="{image_collection_name}",
    query=query_vector,
    limit=3,
).points
# @block-end embed-images

# @block-start run-voyage-4-nano-locally
query_vector = vo.embed(
    ["What is Qdrant?"],
    model="voyage-4-nano",
    input_type="query",
    output_dimension=1024,
).embeddings[0]
query_vector = cast(list[float], query_vector)  # @hide

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
# @block-end run-voyage-4-nano-locally
