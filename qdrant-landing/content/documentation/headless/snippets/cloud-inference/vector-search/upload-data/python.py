from qdrant_client import QdrantClient  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

from qdrant_client.http.models import PointStruct, Document
from datasets import load_dataset

dense_model = "sentence-transformers/all-minilm-l6-v2"

bm25_model = "qdrant/bm25"

ds = (
    load_dataset("miriad/miriad-4.4M", split="train", streaming=True)  # no full download
    .shuffle(seed=42, buffer_size=1_000)
    .filter(lambda row: row["qa_id"].endswith("_1"))  # one question per passage
    .take(100)
)

points = []

for idx, item in enumerate(ds):
    passage = item["passage_text"]

    point = PointStruct(
        id=idx,  # stable IDs: a rerun overwrites points instead of adding duplicates
        payload=item,
        vector={
            "dense_vector": Document(
                text=passage,
                model=dense_model
            ),
            "bm25_sparse_vector": Document(
                text=passage,
                model=bm25_model
            )
        }
    )
    points.append(point)

client.upload_points(
    collection_name="{collection_name}",
    points=points,
    batch_size=8,
    wait=True,  # return only after all points are stored, so the search sees them
)
