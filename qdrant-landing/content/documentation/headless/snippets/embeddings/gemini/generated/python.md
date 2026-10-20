```python
from google import genai
from google.genai import types
from qdrant_client import QdrantClient, models

gemini_client = genai.Client()
client = QdrantClient(url="http://localhost:6333")

MODEL = "gemini-embedding-2"

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=3072, distance=models.Distance.COSINE),
)

documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Gemini embedding models map text, images, video, audio, and PDFs into one vector space.",
]

contents = [
    types.Content(parts=[types.Part.from_text(text=f"title: none | text: {doc}")])
    for doc in documents
]

response = gemini_client.models.embed_content(model=MODEL, contents=contents)
assert response.embeddings is not None

points = []
for idx, embedding in enumerate(response.embeddings):
    assert embedding.values is not None
    points.append(
        models.PointStruct(
            id=idx,
            vector=embedding.values,
            payload={"text": documents[idx]},
        )
    )

client.upsert(collection_name="{collection_name}", points=points)

query_response = gemini_client.models.embed_content(
    model=MODEL,
    contents="task: search result | query: What is Qdrant?",
)
assert query_response.embeddings is not None
query_vector = query_response.embeddings[0].values
assert query_vector is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points

legacy_response = gemini_client.models.embed_content(
    model="gemini-embedding-001",
    contents=documents,
    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
)

with open("filename.pdf", "rb") as f:
    pdf_bytes = f.read()

pdf_response = gemini_client.models.embed_content(
    model=MODEL,
    contents=types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
)
assert pdf_response.embeddings and pdf_response.embeddings[0].values

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=100,
            vector=pdf_response.embeddings[0].values,
            payload={"file": "filename.pdf"},
        )
    ],
)

reduced = gemini_client.models.embed_content(
    model=MODEL,
    contents="task: search result | query: What is Qdrant?",
    config=types.EmbedContentConfig(output_dimensionality=768),
)
```
