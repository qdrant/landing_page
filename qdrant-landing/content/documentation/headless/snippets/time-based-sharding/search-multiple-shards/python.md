```python
from datetime import timedelta
from datetime import datetime, UTC

now = datetime.now(UTC)

query_text = "breaking news vaccine test"

# Only use shard keys that actually exist
valid_shard_keys = "day_2024_12_11"

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    shard_key_selector=valid_shard_keys,
    limit=5,
)
print(resp)

```