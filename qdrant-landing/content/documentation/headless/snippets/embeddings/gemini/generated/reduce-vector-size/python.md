```python
reduced = gemini_client.models.embed_content(
    model=MODEL,
    contents="task: search result | query: What is Qdrant?",
    config=types.EmbedContentConfig(output_dimensionality=768),
)
```
