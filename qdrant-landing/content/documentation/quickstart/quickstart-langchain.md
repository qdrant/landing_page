---
title: Start with LangChain
weight: 1
---

| Time: 30 min | Level: Beginner | Output: [GitHub](https://github.com/qdrant/examples) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/)   |
| --- | ----------- | ----------- |----------- |

# Chat With Your Documents 

This is a very short tutorial that shows you how to retrieve information from your documents using Qdrant, OpenAI and LangChain.
You will load a text file into Qdrant and ask a few basic questions. Qdrant will retrieve semantically appropriate answers. This process is fun and we recommend you try this with all sorts of books, journal articles and other content you wish to break down efficiently.  

## Prerequisites
- You can use any text file. For your convenience, [download our short story]().
- To create embeddings from this text file, [you will need an OpenAI API key](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key). 
- To retrieve answers with Qdrant, [create a Qdrant Cloud Cluster and an API key](/documentation/cloud/create-cluster/).

## Initialize libraries

In this example, we are using LangChain, Qdrant's Python Client, OpenAI and its tokenizer.

First, install everything.

```bash
pip install langchain qdrant_client openai tiktoken
```

Then, import all the libraries. 

```python
from langchain.vectorstores import Qdrant
from langchain.embeddings.openai import OpenAIEmbeddings
import qdrant_client
import os
```

## Setup the client

From the Qdrant Cloud dashboard, retrieve your hostname and the API key. 

```python
os.environ['QDRANT_HOST'] = # "PASTE CLUSTER HOSTNAME HERE"
os.environ['QDRANT_API_KEY'] = # "PASTE QDRANT API KEY HERE"


client = qdrant_client.QdrantClient(
    os.getenv("QDRANT_HOST"),
    api_key=os.getenv("QDRANT_API_KEY")
)

```

## Create a collection

```python
QDRANT_COLLECTION_NAME =# "WRITE COLLECTION NAME HERE"

collection_config = qdrant_client.http.models.VectorParams(
    size=1536, 
    distance=qdrant_client.http.models.Distance.COSINE
)

client.recreate_collection(
    collection_name=os.getenv("QDRANT_COLLECTION_NAME"),
    vectors_config=collection_config
)
```
**Response:**

```python
True
```

## Create a vector store

```python
os.environ['OPENAI_API_KEY'] = # "PASTE OPENAI API KEY HERE"

embeddings = OpenAIEmbeddings()

vectorstore = Qdrant(
    client=client,
    collection_name=QDRANT_COLLECTION_NAME,
    embeddings=embeddings
)
```

## Upload a document

```python
from langchain.text_splitter import CharacterTextSplitter

def get_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

with open("document.txt") as f:
    raw_text = f.read()

texts = get_chunks(raw_text)

vectorstore.add_texts(texts)
```

**Response:**

```python
['98329da9dac8410e960eac922c11784b',
 'c7d59c24df764154b7eb3ae84c059bf5',
 '2f41cedab834456fa61cb1467a4d6e62',
 'cd51a4d3f83f4696a43ff781a573e263',
 'f54b0341f6e14486b5090bddba930c5d']
```

## Activate the retrieval chain

```python
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

qa = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    chain_type="stuff",
    retriever=vectorstore.as_retriever()
)
```

## Ask a question
```python
query = "How many brothers are there and what are their names?"
response = qa.run(query)

print(response)
```

**Response:**

```bash
There are six frat brothers. Their names are Alex, Patrick, Derek, David, Daniel, and Lorenzo.
```

## Next steps:

To move onto some more complex examples of vector search, read our Tutorials and create your own app with the help of our Examples.

For more support with LangChain integrations, read our documentation here. 