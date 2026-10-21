```python
legacy_response = gemini_client.models.embed_content(
    model="gemini-embedding-001",
    contents=documents,
    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
)
```
