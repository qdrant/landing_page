```python
from qdrant_client.serverless.models import (
    DenseVectorConfig,
    Distance,
    StopwordsSet,
    TextIndex,
    TextScoringParams,
    TextScoringType,
    TokenizerType,
)

client.create_collection(
    "menu",
    dense_vectors={"dense": DenseVectorConfig(size=384, distance=Distance.COSINE)},
    payload_indexes={
        "description": TextIndex(
            tokenizer=TokenizerType.WORD,
            stopwords=StopwordsSet(languages=["english"]),
            scoring=TextScoringParams(type=TextScoringType.BM25),
        )
    },
)
```
