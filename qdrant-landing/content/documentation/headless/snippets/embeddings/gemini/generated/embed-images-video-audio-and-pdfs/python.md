```python
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
```
