```python
client.create_collection(
    collection_name="{colbert_collection_name}",
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        multivector_config=models.MultiVectorConfig(
            comparator=models.MultiVectorComparator.MAX_SIM
        ),
    ),
)

colbert_data = jina_embed(model="jina-colbert-v2", input_type="document", input=documents)

client.upsert(
    collection_name="{colbert_collection_name}",
    points=[
        models.PointStruct(
            id=item["index"],
            vector=item["embeddings"],
            payload={"text": documents[item["index"]]},
        )
        for item in colbert_data
    ],
)

colbert_query = jina_embed(model="jina-colbert-v2", input_type="query", input=["What is Qdrant?"])

colbert_hits = client.query_points(
    collection_name="{colbert_collection_name}",
    query=colbert_query[0]["embeddings"],
    limit=3,
).points
```
