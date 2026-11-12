```python
from discord_rag_bot import build_retriever

retriever = build_retriever()
results = retriever.query(
    query="What is quantization in Qdrant?",
    top_k=5,
    similarity_threshold=0.3,
)
for result in results:
    if "similarity score" in result:
        print(result["similarity score"], result["extra_info"]["source"])
        print(result["text"])
```
