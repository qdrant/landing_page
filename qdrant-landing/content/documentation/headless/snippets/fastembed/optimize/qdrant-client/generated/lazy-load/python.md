```python
point = models.PointStruct(
    id=1,
    vector=models.Document(
        text="The text to embed",
        model="BAAI/bge-small-en-v1.5",
        options={
            "lazy_load": True,
        },
    )
)
```
