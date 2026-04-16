```python
from qdrant_client.http.models import PointStruct, Document
import uuid

csv_url = 'https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv'

# Retrieve a list of existing shard keys in the collection
existing_shard_keys = list(client.list_shard_keys(collection_name=collection_name).shard_keys)

dense_model = "sentence-transformers/all-MiniLM-L6-v2"
batch_size = 100
current_date = None
buffer: list[PointStruct] = []

for row in parse_csv(csv_url):
    shard_date = row['datetime'][:10]  # Extract YYYY-MM-DD

    if shard_date != current_date:
        # Flush buffer for the previous date before switching
        if buffer:
            client.upload_points(
                collection_name=collection_name,
                points=buffer,
                shard_key_selector=current_date,
            )
            buffer = []

        # Create shard for the new date if it doesn't exist yet
        if shard_date not in existing_shard_keys:
            client.create_shard_key(collection_name, shard_date)
            existing_shard_keys.append(shard_date)

        current_date = shard_date

    # Add point to buffer
    buffer.append(PointStruct(
        id=uuid.uuid4().hex,
        payload={"text": row['text'], "datetime": row['datetime']},
        vector={"dense_vector": Document(text=row["text"], model=dense_model)}
    ))

    # Flush batch if buffer size exceeds batch size
    if len(buffer) >= batch_size:
        client.upload_points(
            collection_name=collection_name,
            points=buffer,
            shard_key_selector=current_date,
        )
        buffer = []

# Flush remaining partial batch
if buffer:
    client.upload_points(
        collection_name=collection_name,
        points=buffer,
        shard_key_selector=current_date,
    )
```
