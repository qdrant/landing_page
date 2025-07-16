```python
query = "Vectors in Medicine"

client.query_points(
    collection_name="{bm25_collection_name}",
    query=models.Document(
        text=query, 
        model="Qdrant/bm25"
    ),
    using="bm25",
    limit=1,
)
```