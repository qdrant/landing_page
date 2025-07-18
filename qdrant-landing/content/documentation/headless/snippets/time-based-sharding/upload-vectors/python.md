```python
from datetime import datetime
from datasets import load_dataset
from qdrant_client.http.models import PointStruct, Document
import uuid

# Load the full dataset metadata (streaming=False needed for shuffle/select)
ds = load_dataset("Exorde/exorde-social-media-one-month-2024", split="train")

# Shuffle and select 2000 random rows
ds = ds.shuffle(seed=42).select(range(2000))

# Convert Unix timestamp to datetime for daily key routing
ds = ds.add_column("ts", [datetime.fromisoformat(x) for x in ds["date"]])


dense_model = "sentence-transformers/all-MiniLM-L6-v2"
created_shards = set()

current_day_key = None
current_day_batch = []

for item in ds:
    day_key = item["ts"].strftime("day_%Y_%m_%d")

    # If day has changed, flush previous batch
    if current_day_key and day_key != current_day_key:
        if current_day_key not in created_shards:
            client.create_shard_key(collection_name, current_day_key)
            created_shards.add(current_day_key)

        client.upload_points(
            collection_name=collection_name,
            points=current_day_batch,
            batch_size=8,
            shard_key_selector=current_day_key,
        )
        current_day_batch = []

    # Update batch and tracker
    current_day_key = day_key
    point = PointStruct(
        id=uuid.uuid4().hex,
        payload=item,
        vector={
            "dense_vector": Document(text=item["original_text"], model=dense_model)
        },
    )
    current_day_batch.append(point)

# Flush final batch
if current_day_batch:
    if current_day_key not in created_shards:
        client.create_shard_key(collection_name, current_day_key)
        created_shards.add(current_day_key)

    client.upload_points(
        collection_name=collection_name,
        points=current_day_batch,
        batch_size=8,
        shard_key_selector=current_day_key,
    )

```