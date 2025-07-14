dense_model = "sentence-transformers/all-minilm-l6-v2"

bm25_model = "qdrant/bm25"

ds = load_dataset("miriad/miriad-4.4M", split="train[0:100]")

points = []

for idx, item in enumerate(ds):
    passage = item["passage_text"]
    
    point = PointStruct(
        id=uuid.uuid4().hex,  # use unique string ID
        payload={"text": passage},
        vector={
            "dense": Document(
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
    collection_name=collection_name, 
    points=points, 
    batch_size=8
)