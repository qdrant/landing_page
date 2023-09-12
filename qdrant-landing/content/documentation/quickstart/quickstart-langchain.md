---
title: Start with LangChain
weight: 1
---

# Chat With Your Documents 

This is a very short tutorial that shows you how to retrieve information from your documents using Qdrant, OpenAI and LangChain.
You will load a text file into Qdrant and ask a few basic questions. Qdrant will retrieve semantically appropriate answers. This process is fun and we recommend you try this with all sorts of books, journal articles and other content you wish to break down efficiently.  

## Prerequisites
- You can use any text file. For your convenience, [download our short story]().
- To create embeddings from this text file, [you will need an OpenAI API key](). 
- To retrieve answers with Qdrant, [create a Qdrant Cloud Cluster and an API key]().

## Initialize libraries

In this example, we are using LangChain, Qdrant's Python Client, OpenAI and its tokenizer.

```python
pip install langchain qdrant_client openai tiktoken
```

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
QDRANT_COLLECTION_NAME = # "WRITE COLLECTION NAME HERE"

collection_config = qdrant_client.http.models.VectorParams(
        size=1536, 
        distance=qdrant_client.http.models.Distance.COSINE
    )

client.recreate_collection(
    collection_name=os.getenv("QDRANT_COLLECTION"),
    vectors_config=collection_config
)
```

## Create a vector store

```python
os.environ['OPENAI_API_KEY'] = # "PASTE OPENAI API KEY HERE"

embeddings = OpenAIEmbeddings()

vectorstore = Qdrant(
        client=client,
        collection_name= QDRANT_COLLECTION_NAME,
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

```python
query = "Which of the brothers has an issue and what is his problem?"
response = qa.run(query)

print(response)
```
