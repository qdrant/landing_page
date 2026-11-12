```python
from qdrant_client import QdrantClient, models

client.create_payload_index(
    collection_name="books",
    field_name="title",
    field_schema=models.TextIndexParams(
        type=models.TextIndexType.TEXT,
        stemmer=models.SnowballParams(
            type=models.Snowball.SNOWBALL,
            language=models.SnowballLanguage.SPANISH,
        ),
        stopwords=models.Language.SPANISH,
        scoring=True,
    ),
)
```
