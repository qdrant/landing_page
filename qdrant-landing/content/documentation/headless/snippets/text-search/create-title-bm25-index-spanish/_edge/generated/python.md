```python
from qdrant_edge import (
    Language,
    SnowballLanguage,
    SnowballParams,
    TextIndexParams,
    UpdateOperation,
)

edge_shard.update(UpdateOperation.create_field_index(
    "title",
    TextIndexParams(
        stemmer=SnowballParams(language=SnowballLanguage.Spanish),
        stopwords=Language.Spanish,
        scoring=True,
    ),
))
```
