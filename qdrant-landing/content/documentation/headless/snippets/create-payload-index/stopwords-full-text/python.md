```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

# Simple
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        tokenizer=models.TokenizerType.WORD,
        stopwords=models.Language.ENGLISH,
    ),
)

# Explicit
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        tokenizer=models.TokenizerType.WORD,
        stopwords=models.StopwordsSet(
            languages=[
                models.Language.ENGLISH,
                models.Language.SPANISH,
            ],
            custom=[
                "example"
            ]
        ),
    ),
)
```
