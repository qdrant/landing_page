```python
documents = [
    "Qdrant is a vector search engine.",
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
```
