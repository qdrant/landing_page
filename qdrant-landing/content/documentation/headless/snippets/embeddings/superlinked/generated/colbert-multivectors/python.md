```python
colbert_vectorizer = SIENamedVectorizer(
    base_url="http://localhost:8080",
    model="jinaai/jina-colbert-v2",
    output_types=["multivector"],
)

client.create_collection(
    collection_name="{colbert_collection_name}",
    vectors_config={
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
        ),
    },
)

client.upsert(
    collection_name="{colbert_collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector={"colbert": named["multivector"]},
            payload={"text": documents[idx]},
        )
        for idx, named in enumerate(colbert_vectorizer.embed_documents(documents))
    ],
)

query = colbert_vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{colbert_collection_name}",
    query=query["multivector"],
    using="colbert",
    limit=3,
).points
```
