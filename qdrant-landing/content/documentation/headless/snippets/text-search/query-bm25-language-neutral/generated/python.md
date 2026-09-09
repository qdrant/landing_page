```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.query_points(
    collection_name="books",
    query=models.Document(
        text="Mieville",
        model="qdrant/bm25",
        options=models.Bm25Config(
            stemmer=models.DisabledStemmerParams(type=models.NoStemmer.NONE),
            stopwords=models.StopwordsSet(),
            tokenizer=models.TokenizerType.MULTILINGUAL,
            ascii_folding=True,
        ),
    ),
    using="author-bm25",
    limit=10,
    with_payload=True,
)
```
