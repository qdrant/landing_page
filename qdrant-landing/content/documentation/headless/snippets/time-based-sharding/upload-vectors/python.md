```python
from datetime import datetime
from qdrant_client.http.models import PointStruct, Document
import uuid

import pandas as pd

csv_url = 'https://raw.githubusercontent.com/qdrant/examples/blob/master/time-based-sharding/social-media-posts.csv'
df = pd.read_csv(csv_url)
df['datetime'] = pd.to_datetime(df['datetime'])
df = df.set_index(["datetime"])

dense_model = "sentence-transformers/all-MiniLM-L6-v2"

dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05", "2026-01-06", "2026-01-07"]

for date in dates:
    client.create_shard_key(collection_name, date)
    points = []

    for _, row in df.loc[date].iterrows():
        points.append(PointStruct(
            id=uuid.uuid4().hex,
            payload={"text": row['text'], "datetime": str(row.name)},
            vector={
                "dense_vector": Document(text=row["text"], model=dense_model)
            }))

    client.upload_points(
                collection_name=collection_name,
                points=points,
                batch_size=8,
                shard_key_selector=date,
            )
```