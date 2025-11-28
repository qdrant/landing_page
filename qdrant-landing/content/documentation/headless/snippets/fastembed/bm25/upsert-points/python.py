from qdrant_client import QdrantClient, models  # @hide

client = QdrantClient(url="http://localhost:6333")  # @hide

documents: list[str] = [] # @hide

#Estimating the average length of the documents in the corpus
avg_documents_length = sum(len(document.split()) for document in documents) / len(documents)

client.upsert(
    collection_name="{bm25_collection_name}",
    points=[
        models.PointStruct(
            id=i,
            payload={
                "text": documents[i]
            },
            vector={
                # Sparse vector from BM25
                "bm25": models.Document(
                    text=documents[i],
                    model="Qdrant/bm25",
                    options={"avg_len": avg_documents_length}   
                    #Average length of documents in the corpus 
                    # (a part of the BM25 formula)
                )
            },
        )
        for i in range(len(documents))
    ],
)
