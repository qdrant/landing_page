```python
from qdrant_edge import (
    Language,
    SnowballLanguage,
    SnowballParams,
    TextIndexParams,
    UpdateOperation,
)

shard.update(UpdateOperation.create_field_index(
    "title",
    TextIndexParams(
        scoring=True,
        stemmer=SnowballParams(language=SnowballLanguage.English),
        stopwords=Language.English,
    ),
))
```
