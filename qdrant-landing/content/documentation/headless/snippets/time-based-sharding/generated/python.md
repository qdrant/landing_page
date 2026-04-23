```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    cloud_inference=True
)

from qdrant_client import models

collection_name = "my_collection"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense_vector": models.VectorParams(
            size=384, distance=models.Distance.COSINE
        )
    },
    sharding_method=models.ShardingMethod.CUSTOM
)

import csv
import urllib.request

def parse_csv(url):
    with urllib.request.urlopen(url) as response:
        reader = csv.DictReader(line.decode('utf-8') for line in response)
        yield from reader

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

query_text = "coffee"

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector="2026-04-07"
)
print(resp)

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector=["2026-04-06","2026-04-07"]
)
print(resp)

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
)
print(resp)

from datetime import date, timedelta

today = "2026-04-08"
oldest_shard_key = (date.fromisoformat(today) - timedelta(days=7)).isoformat()

client.create_shard_key(collection_name, today)
client.delete_shard_key(collection_name, oldest_shard_key)

client.upsert(
    collection_name=collection_name,
    points=[PointStruct(
        id=uuid.uuid4().hex,
        payload={"text": "The best way to start a Wednesday is with a cup of coffee", "datetime": "2026-04-08T07:57:47"},
        vector={
            "dense_vector": Document(text="The best way to start a Wednesday is with a cup of coffee", model=dense_model)
        })],
    shard_key_selector=today
)
```
