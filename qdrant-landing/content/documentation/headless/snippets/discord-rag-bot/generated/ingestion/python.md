```python
QDRANT_URLS = [
    "https://qdrant.tech/documentation/overview/",
    "https://qdrant.tech/documentation/installation/",
    "https://qdrant.tech/documentation/search/filtering/",
    "https://qdrant.tech/documentation/manage-data/indexing/",
    "https://qdrant.tech/documentation/scaling/distributed_deployment/",
    "https://qdrant.tech/documentation/manage-data/quantization/",
]

def ingest(retriever: VectorRetriever) -> None:
    if retriever.storage.status().vector_count:
        raise ValueError(
            "Collection already contains vectors. Reuse it for the bot, or set "
            "QDRANT_COLLECTION to a new name for a fresh ingestion."
        )
    for url in QDRANT_URLS:
        previous_count = retriever.storage.status().vector_count
        retriever.process(content=url, max_characters=1200, extra_info={"source": url})
        current_count = retriever.storage.status().vector_count
        if current_count <= previous_count:
            raise RuntimeError(f"No chunks indexed from {url}")
        print(f"Indexed {url}: {current_count - previous_count} chunks")
    print(f"Ingestion complete: {retriever.storage.status().vector_count} vectors")
```
