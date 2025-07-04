```python
#Estimating the average length of the documents in the corpus
avg_documents_length = sum(len(document.split()) for document in documents) / len(documents)

client.upsert(
    collection_name="{minicoil_collection_name}",
    points=[
        models.PointStruct(
            id=i,
            payload={
                "text": documents[i]
            },
            vector={
                # Sparse miniCOIL vectors
                "minicoil": models.Document(
                    text=documents[i],
                    model="Qdrant/minicoil-v1",
                    options={"avg_len": avg_documents_length}   
                    #Average length of documents in the corpus 
                     # (a part of the BM25 formula on which miniCOIL is built)
                )
            },
        )
        for i in range(len(documents))
    ],
)
```