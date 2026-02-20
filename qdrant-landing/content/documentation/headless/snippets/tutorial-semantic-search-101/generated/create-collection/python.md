```python
COLLECTION_NAME="my_books"

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=384,  # Vector size is defined by used model
        distance=models.Distance.COSINE,
    ),
)
```
