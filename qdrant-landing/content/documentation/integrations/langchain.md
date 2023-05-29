---
title: LangChain
weight: 100
---

# LangChain

LangChain is a library that makes developing Large Language Models based applications much easier. It unifies the interfaces 
to different libraries, including major embedding providers and Qdrant. Using LangChain, you can focus on the business value 
instead of writing the boilerplate.

Langchain comes with the Qdrant integration by default. It might be installed with pip:

```bash
pip install langchain
```

Qdrant acts as a vector index that may store the embeddings with the documents used to generate them. There are various ways 
how to use it, but calling `Qdrant.from_texts` is probably the most straightforward way how to get started:

```python
from langchain.vectorstores import Qdrant
from langchain.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)
doc_store = Qdrant.from_texts(
    texts, embeddings, url="<qdrant-url>", api_key="<qdrant-api-key>", collection_name="texts"
)
```

Calling `Qdrant.from_documents` or `Qdrant.from_texts` will always recreate the collection and remove all the existing points. 
That's fine for some experiments, but you'll prefer not to start from scratch every single time in a real-world scenario. 
If you prefer reusing an existing collection, you can create an instance of Qdrant on your own:

```
import qdrant_client

client = qdrant_client.QdrantClient(
    "<qdrant-url>",
    api_key="<qdrant-api-key>", # For Qdrant Cloud, None for local instance
)

doc_store = Qdrant(
    client=client, collection_name="texts", 
    embedding_function=embeddings.embed_query,
)
```
 
If you'd like to know more about running Qdrant in a LangChain-based application, please read our article 
[Question Answering with LangChain and Qdrant without boilerplate](/articles/langchain-integration/). Some more information
might also be found in the [LangChain documentation](https://python.langchain.com/en/latest/modules/indexes/vectorstores/examples/qdrant.html).
