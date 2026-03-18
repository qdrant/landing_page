# @hide-start
# mypy: disable-error-code="arg-type"
QDRANT_URL=""
QDRANT_API_KEY=""
# @hide-end

# @block-start initialize-client
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    cloud_inference=True
)
# @block-end initialize-client

# @block-start create-collection
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
    sharding_method=models.ShardingMethod.CUSTOM,
    shard_number=1, # The number of shards per shard key
)
# @block-end create-collection

# @block-start upload-vectors
import csv
import urllib.request
from qdrant_client.http.models import PointStruct, Document
import uuid

csv_url = 'https://raw.githubusercontent.com/qdrant/examples/blob/master/time-based-sharding/social-media-posts.csv'

existing_shard_keys = list(client.list_shard_keys(collection_name=collection_name).shard_keys)

dense_model = "sentence-transformers/all-MiniLM-L6-v2"
batch_size = 100
current_date = None
buffer: list[PointStruct] = []

with urllib.request.urlopen(csv_url) as response:
    reader = csv.DictReader(line.decode('utf-8') for line in response)
    for row in reader:
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

        buffer.append(PointStruct(
            id=uuid.uuid4().hex,
            payload={"text": row['text'], "datetime": row['datetime']},
            vector={"dense_vector": Document(text=row["text"], model=dense_model)}
        ))

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
# @block-end upload-vectors

# @block-start search-single-shard
query_text = "coffee"

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector="2026-04-07"
)
print(resp)
# @block-end search-single-shard

# @block-start search-multiple-shards
resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector=["2026-04-06","2026-04-07"]
)
print(resp)
# @block-end search-multiple-shards

# @block-start search-all-shards
resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
)
print(resp)
# @block-end search-all-shards

# @block-start pruning-shards
from datetime import date, timedelta

today = "2026-04-08"
oldest_shard_key = (date.fromisoformat(today) - timedelta(days=7)).isoformat()

client.create_shard_key(collection_name, today)
client.delete_shard_key(collection_name, oldest_shard_key)
# @block-end pruning-shards

# @block-start ingest-new-data
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
# @block-end ingest-new-data
