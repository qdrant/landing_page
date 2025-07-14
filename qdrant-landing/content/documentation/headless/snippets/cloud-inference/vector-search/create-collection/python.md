collection_name = "my_collection_name"

if not client.collection_exists(collection_name=collection_name):
    client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense_vector": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        )
    },
    sparse_vectors_config={
        "bm25_sparse_vector": models.SparseVectorParams(
            modifier=models.Modifier.IDF #Inverse Document Frequency
        )
    }
)