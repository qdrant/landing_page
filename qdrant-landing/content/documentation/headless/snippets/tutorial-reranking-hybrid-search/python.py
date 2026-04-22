# @hide-start
# mypy: disable-error-code="arg-type"
# @hide-end
# @block-start client-connection
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)
# @block-end client-connection

# @block-start define-models
dense_embedding_model = "sentence-transformers/all-MiniLM-L6-v2"
sparse_embedding_model = "qdrant/bm25"
late_interaction_embedding_model = "answerdotai/answerai-colbert-small-v1"
# @block-end define-models

# @block-start create-collection
from qdrant_client.models import Distance, VectorParams, models

collection_name = "hybrid-search"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

client.create_collection(
    collection_name,
    vectors_config={
        "dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE,
        ),
        "multi": models.VectorParams(
            size=96,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            hnsw_config=models.HnswConfigDiff(m=0)  #  Disable HNSW for reranking
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(modifier=models.Modifier.IDF)
    }
)
# @block-end create-collection

# @block-start parse-csv
import csv
import urllib.request

def parse_csv(url):
    with urllib.request.urlopen(url) as response:
        reader = csv.DictReader(line.decode('utf-8') for line in response)
        yield from reader
# @block-end parse-csv

# @block-start ingest-data
from qdrant_client.models import Document, PointStruct

csv_url = 'https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv'

points = (
    PointStruct(
        id=idx,
        vector={
            "dense": Document(text=row['Description'], model=dense_embedding_model),
            "sparse": Document(text=row['Description'], model=sparse_embedding_model),
            "multi": Document(text=row['Description'], model=late_interaction_embedding_model),
        },
        payload={"title": row['Title'], "author": row['Author'], "description": row['Description']}
    )
    for idx, row in enumerate(parse_csv(csv_url))
)
client.upload_points(
    collection_name=collection_name,
    points=points,
    batch_size=25
)
# @block-end ingest-data

# @block-start dense-retrieval
import pprint

query = "time travel"

results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=dense_embedding_model),
    using="dense",
    limit=10,
)

pprint.pp(results.points)
# @block-end dense-retrieval

# @block-start sparse-retrieval
results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=sparse_embedding_model),
    using="sparse",
    limit=10,
)

pprint.pp(results.points)
# @block-end sparse-retrieval

# @block-start hybrid-search
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.Document(text=query, model=sparse_embedding_model),
        using="sparse",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
# @block-end hybrid-search

# @block-start rerank
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.Document(text=query, model=sparse_embedding_model),
        using="sparse",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.Document(text=query, model=late_interaction_embedding_model),
    using="multi",
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
# @block-end rerank
