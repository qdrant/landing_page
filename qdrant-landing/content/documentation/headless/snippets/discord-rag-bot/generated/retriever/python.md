```python
def build_retriever() -> VectorRetriever:
    load_dotenv()
    embedding = OpenAIEmbedding(
        model_type=EmbeddingModelType.TEXT_EMBEDDING_3_LARGE,
        api_key=required_env("OPENAI_API_KEY"),
    )
    storage = QdrantStorage(
        vector_dim=embedding.get_output_dim(),
        collection_name=os.getenv("QDRANT_COLLECTION", "qdrant-discord-docs-v1"),
        url_and_api_key=(
            required_env("QDRANT_CLOUD_URL"),
            required_env("QDRANT_CLOUD_API_KEY"),
        ),
        timeout=60,
    )
    return VectorRetriever(embedding_model=embedding, storage=storage)
```
