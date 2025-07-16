```python
import uuid
from datetime import datetime

from qdrant_client.http.models import PointStruct, Document
from datasets import load_dataset

# Load dataset: using beauty-reviews for this example
ds = load_dataset("jhan21/amazon-beauty-reviews-dataset", split="train[:2000]")
# Parse timestamps to datetime
ds = ds.add_column("ts", [datetime.fromisoformat(x) for x in ds["timestamp"]])
ds = ds.remove_columns(["images"])

dense_model = "sentence-transformers/all-MiniLM-L6-v2"

points = []

for idx, item in enumerate(ds):

    point = PointStruct(
        id=uuid.uuid4().hex,  # use unique string ID
        payload=item,
        vector={"dense_vector": Document(text=str(item["text"]), model=dense_model)},
    )
    points.append(point)

client.upload_points(collection_name=collection_name, points=points, batch_size=8)

```