---
title: 5 Minute RAG with Qdrant and DeepSeek
weight: 15
partition: build
social_preview_image: /documentation/examples/rag-deepseek/social_preview.png
---

![deepseek-rag-qdrant](/documentation/examples/rag-deepseek/deepseek.png)

# 5 Minute RAG with Qdrant and DeepSeek

| Time: 5 min | Level: Beginner | Output: [GitHub](https://github.com/qdrant/examples/blob/master/rag-with-qdrant-deepseek/deepseek-qdrant.ipynb) |
| --- | ----------- | ----------- |----------- |

This tutorial demonstrates how to build a **Retrieval-Augmented Generation (RAG)** pipeline using Qdrant as a vector storage solution and DeepSeek for semantic query enrichment. RAG pipelines enhance Large Language Model (LLM) responses by providing contextually relevant data.

## Overview
In this tutorial, we will:
1. Take sample text and turn it to vectors with FastEmbed.
2. Send the vectors to a Qdrant collection. 
3. Connect Qdrant and DeepSeek into a minimal RAG pipeline.
4. Ask DeepSeek different questions and test answer accuracy.
5. Enrich DeepSeek prompts with content retrieved from Qdrant.
6. Evaluate answer accuracy before and after.

#### Architecture:

![deepseek-rag-architecture](/documentation/examples/rag-deepseek/architecture.png)

---

## Prerequisites

Ensure you have the following:
- Python environment (3.7+)
- Access to [Qdrant Cloud](https://qdrant.tech)
- A DeepSeek API key from [DeepSeek Platform](https://platform.deepseek.com/api_keys)

## Setup Qdrant


```python
pip install "qdrant-client[fastembed]"
```

[Qdrant](https://qdrant.tech) will act as a knowledge base providing the context information for the prompts we'll be sending to the LLM.

You can get a free-forever Qdrant cloud instance at http://cloud.qdrant.io. Learn about setting up your instance from the [Quickstart](https://qdrant.tech/documentation/quickstart-cloud/).


```python
QDRANT_URL = "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = "<your-api-key>"
```

### Instantiating Qdrant Client


```python
import qdrant_client

client = qdrant_client.QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
```

### Building the knowledge base

Qdrant will use vector embeddings of our facts to enrich the original prompt with some context. Thus, we need to store the vector embeddings and the facts used to generate them.

We'll be using the [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) model via [FastEmbed](https://github.com/qdrant/fastembed/) - A lightweight, fast, Python library for embeddings generation.

The Qdrant client provides a handy integration with FastEmbed that makes building a knowledge base very straighforward.


```python
client.set_model("BAAI/bge-base-en-v1.5")

client.add(
    collection_name="knowledge-base",
    # The collection is automatically created if it doesn't exist.
    documents=[
        "Qdrant is a vector database & vector similarity search engine. It deploys as an API service providing search for the nearest high-dimensional vectors. With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more!",
        "Docker helps developers build, share, and run applications anywhere — without tedious environment configuration or management.",
        "PyTorch is a machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.",
        "MySQL is an open-source relational database management system (RDBMS). A relational database organizes data into one or more data tables in which data may be related to each other; these relations help structure the data. SQL is a language that programmers use to create, modify and extract data from the relational database, as well as control user access to the database.",
        "NGINX is a free, open-source, high-performance HTTP server and reverse proxy, as well as an IMAP/POP3 proxy server. NGINX is known for its high performance, stability, rich feature set, simple configuration, and low resource consumption.",
        "FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.",
        "SentenceTransformers is a Python framework for state-of-the-art sentence, text and image embeddings. You can use this framework to compute sentence / text embeddings for more than 100 languages. These embeddings can then be compared e.g. with cosine-similarity to find sentences with a similar meaning. This can be useful for semantic textual similar, semantic search, or paraphrase mining.",
        "The cron command-line utility is a job scheduler on Unix-like operating systems. Users who set up and maintain software environments use cron to schedule jobs (commands or shell scripts), also known as cron jobs, to run periodically at fixed times, dates, or intervals.",
    ]
)
```

## Setup DeepSeek

RAG changes the way we interact with Large Language Models. We're converting a knowledge-oriented task, in which the model may create a counterfactual answer, into a language-oriented task. The latter expects the model to extract meaningful information and generate an answer. LLMs, when implemented correctly, are supposed to be carrying out language-oriented tasks.

The task starts with the original prompt sent by the user. The same prompt is then vectorized and used as a search query for the most relevant facts. Those facts are combined with the original prompt to build a longer prompt containing more information.

But let's start simply by asking our question directly.


```python
prompt = """
What tools should I need to use to build a web service using vector embeddings for search?
"""
```

Using the Deepseek API requires providing the API key. You can obtain it from the [DeepSeek platform](https://platform.deepseek.com/api_keys).

Now we can finally call the completion API.


```python
import requests
import json

# Provide your own Deepseek API key
# from https://platform.deepseek.com/api_keys
API_KEY = "<YOUR_DEEPSEEK_KEY>"

HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}

def query_deepseek(prompt):
    data = {
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'user', 'content': prompt}
        ],
        'stream': False
    }

    response = requests.post("https://api.deepseek.com/chat/completions", headers=HEADERS, data=json.dumps(data))

    if response.ok:
        result = response.json()
        return result['choices'][0]['message']['content']
    else:
        raise Exception(f"Error {response.status_code}: {response.text}")
```

and also the query

```python
query_deepseek(prompt)
```

The response is:

```bash
"Building a web service that uses vector embeddings for search involves several components, including data processing, embedding generation, storage, search, and serving the service via an API. Below is a list of tools and technologies you can use for each step:\n\n---\n\n### 1. **Data Processing**\n   - **Python**: For general data preprocessing and scripting.\n   - **Pandas**: For handling tabular data.\n   - **NumPy**: For numerical operations.\n   - **NLTK/Spacy**: For text preprocessing (tokenization, stemming, etc.).\n   - **LLM models**: For generating embeddings if you're using pre-trained models.\n\n---\n\n### 2. **Embedding Generation**\n   - **Pre-trained Models**:\n     - Embeddings (e.g., `text-embedding-ada-002`).\n     - Hugging Face Transformers (e.g., `Sentence-BERT`, `all-MiniLM-L6-v2`).\n     - Google's Universal Sentence Encoder.\n   - **Custom Models**:\n     - TensorFlow/PyTorch: For training custom embedding models.\n   - **Libraries**:\n     - `sentence-transformers`: For generating sentence embeddings.\n     - `transformers`: For using Hugging Face models.\n\n---\n\n### 3. **Vector Storage**\n   - **Vector Databases**:\n     - Pinecone: Managed vector database for similarity search.\n     - Weaviate: Open-source vector search engine.\n     - Milvus: Open-source vector database.\n     - FAISS (Facebook AI Similarity Search): Library for efficient similarity search.\n     - Qdrant: Open-source vector search engine.\n     - Redis with RedisAI: For storing and querying vectors.\n   - **Traditional Databases with Vector Support**:\n     - PostgreSQL with pgvector extension.\n     - Elasticsearch with dense vector support.\n\n---\n\n### 4. **Search and Retrieval**\n   - **Similarity Search Algorithms**:\n     - Cosine similarity, Euclidean distance, or dot product for comparing vectors.\n   - **Libraries**:\n     - FAISS: For fast nearest-neighbor search.\n     - Annoy (Approximate Nearest Neighbors Oh Yeah): For approximate nearest neighbor search.\n   - **Vector Databases**: Most vector databases (e.g., Pinecone, Weaviate) come with built-in search capabilities.\n\n---\n\n### 5. **Web Service Framework**\n   - **Backend Frameworks**:\n     - Flask/Django/FastAPI (Python): For building RESTful APIs.\n     - Node.js/Express: If you prefer JavaScript.\n   - **API Documentation**:\n     - Swagger/OpenAPI: For documenting your API.\n   - **Authentication**:\n     - OAuth2, JWT: For securing your API.\n\n---\n\n### 6. **Deployment**\n   - **Containerization**:\n     - Docker: For packaging your application.\n   - **Orchestration**:\n     - Kubernetes: For managing containers at scale.\n   - **Cloud Platforms**:\n     - AWS (EC2, Lambda, S3).\n     - Google Cloud (Compute Engine, Cloud Functions).\n     - Azure (App Service, Functions).\n   - **Serverless**:\n     - AWS Lambda, Google Cloud Functions, or Vercel for serverless deployment.\n\n---\n\n### 7. **Monitoring and Logging**\n   - **Monitoring**:\n     - Prometheus + Grafana: For monitoring performance.\n   - **Logging**:\n     - ELK Stack (Elasticsearch, Logstash, Kibana).\n     - Fluentd.\n   - **Error Tracking**:\n     - Sentry.\n\n---\n\n### 8. **Frontend (Optional)**\n   - **Frontend Frameworks**:\n     - React, Vue.js, or Angular: For building a user interface.\n   - **Libraries**:\n     - Axios: For making API calls from the frontend.\n\n---\n\n### Example Workflow\n1. Preprocess your data (e.g., clean text, tokenize).\n2. Generate embeddings using a pre-trained model (e.g., Hugging Face).\n3. Store embeddings in a vector database (e.g., Pinecone or FAISS).\n4. Build a REST API using FastAPI or Flask to handle search queries.\n5. Deploy the service using Docker and Kubernetes or a serverless platform.\n6. Monitor and scale the service as needed.\n\n---\n\n### Example Tools Stack\n- **Embedding Generation**: Hugging Face `sentence-transformers`.\n- **Vector Storage**: Pinecone or FAISS.\n- **Web Framework**: FastAPI.\n- **Deployment**: Docker + AWS/GCP.\n\nBy combining these tools, you can build a scalable and efficient web service for vector embedding-based search."
```


### Extending the prompt

Even though the original answer sounds credible, it didn't answer our question correctly. Instead, it gave us a generic description of an application stack. To improve the results, enriching the original prompt with the descriptions of the tools available seems like one of the possibilities. Let's use a semantic knowledge base to augment the prompt with the descriptions of different technologies!

```python
results = client.query(
    collection_name="knowledge-base",
    query_text=prompt,
    limit=3,
)
results
```

Here is the response: 

```bash
[QueryResponse(id='116eb694-f127-4b80-9c94-1177ee578bba', embedding=None, sparse_embedding=None, metadata={'document': 'Qdrant is a vector database & vector similarity search engine. It deploys as an API service providing search for the nearest high-dimensional vectors. With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more!'}, document='Qdrant is a vector database & vector similarity search engine. It deploys as an API service providing search for the nearest high-dimensional vectors. With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more!', score=0.82907003),
QueryResponse(id='61d886cf-af3e-4ab0-bdd5-b52770832666', embedding=None, sparse_embedding=None, metadata={'document': 'FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.'}, document='FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.', score=0.81901294),
QueryResponse(id='1d904593-97a2-421b-87f4-12c9eae4c310', embedding=None, sparse_embedding=None, metadata={'document': 'PyTorch is a machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.'}, document='PyTorch is a machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.', score=0.80565226)]
```


We used the original prompt to perform a semantic search over the set of tool descriptions. Now we can use these descriptions to augment the prompt and create more context.


```python
context = "\n".join(r.document for r in results)
context
```

The response is:

```bash
'Qdrant is a vector database & vector similarity search engine. It deploys as an API service providing search for the nearest high-dimensional vectors. With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more!\nFastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.\nPyTorch is a machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.'
```


Finally, let's build a metaprompt, the combination of the assumed role of the LLM, the original question, and the results from our semantic search that will force our LLM to use the provided context. 

By doing this, we effectively convert the knowledge-oriented task into a language task and hopefully reduce the chances of hallucinations. It also should make the response sound more relevant.


```python
metaprompt = f"""
You are a software architect. 
Answer the following question using the provided context. 
If you can't find the answer, do not pretend you know it, but answer "I don't know".

Question: {prompt.strip()}

Context: 
{context.strip()}

Answer:
"""

# Look at the full metaprompt
print(metaprompt)
```

**Response:**

```bash
You are a software architect. 
Answer the following question using the provided context. 
If you can't find the answer, do not pretend you know it, but answer "I don't know".
    
Question: What tools should I need to use to build a web service using vector embeddings for search?
    
Context: 
Qdrant is a vector database & vector similarity search engine. It deploys as an API service providing search for the nearest high-dimensional vectors. With Qdrant, embeddings or neural network encoders can be turned into full-fledged applications for matching, searching, recommending, and much more!
FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.
PyTorch is a machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.
    
Answer:
```   

Our current prompt is much longer, and we also used a couple of strategies to make the responses even better:

1. The LLM has the role of software architect.
2. We provide more context to answer the question.
3. If the context contains no meaningful information, the model shouldn't make up an answer.

Let's find out if that works as expected.

**Question:**

```python
query_deepseek(metaprompt)
```
**Answer:**

```bash
'To build a web service using vector embeddings for search, you can use the following tools:\n\n1. **Qdrant**: As a vector database and similarity search engine, Qdrant will handle the storage and retrieval of high-dimensional vectors. It provides an API service for searching and matching vectors, making it ideal for applications that require vector-based search functionality.\n\n2. **FastAPI**: This web framework is perfect for building the API layer of your web service. It is fast, easy to use, and based on Python type hints, which makes it a great choice for developing the backend of your service. FastAPI will allow you to expose endpoints that interact with Qdrant for vector search operations.\n\n3. **PyTorch**: If you need to generate vector embeddings from your data (e.g., text, images), PyTorch can be used to create and train neural network models that produce these embeddings. PyTorch is a powerful machine learning framework that supports a wide range of applications, including natural language processing and computer vision.\n\n### Summary:\n- **Qdrant** for vector storage and search.\n- **FastAPI** for building the web service API.\n- **PyTorch** for generating vector embeddings (if needed).\n\nThese tools together provide a robust stack for building a web service that leverages vector embeddings for search functionality.'
```

### Testing out the RAG pipeline

By leveraging the semantic context we provided our model is doing a better job answering the question. Let's enclose the RAG as a function, so we can call it more easily for different prompts.


```python
def rag(question: str, n_points: int = 3) -> str:
    results = client.query(
        collection_name="knowledge-base",
        query_text=question,
        limit=n_points,
    )

    context = "\n".join(r.document for r in results)

    metaprompt = f"""
    You are a software architect. 
    Answer the following question using the provided context. 
    If you can't find the answer, do not pretend you know it, but only answer "I don't know".
    
    Question: {question.strip()}
    
    Context: 
    {context.strip()}
    
    Answer:
    """

    return query_deepseek(metaprompt)
```

Now it's easier to ask a broad range of questions.

**Question:**

```python
rag("What can the stack for a web api look like?")
```
**Answer:**

```bash
'The stack for a web API can include the following components based on the provided context:\n\n1. **Web Framework**: FastAPI can be used as the web framework for building the API. It is modern, fast, and leverages Python type hints for better development and performance.\n\n2. **Reverse Proxy/Web Server**: NGINX can be used as a reverse proxy or web server to handle incoming HTTP requests, load balancing, and serving static content. It is known for its high performance and low resource consumption.\n\n3. **Containerization**: Docker can be used to containerize the application, making it easier to build, share, and run the API consistently across different environments without worrying about configuration issues.\n\nThis stack provides a robust, scalable, and efficient setup for building and deploying a web API.'
```

**Question:**

```python
rag("Where is the nearest grocery store?")
```

**Answer:**

```bash
"I don't know. The provided context does not contain any information about the location of the nearest grocery store."
```

Our model can now:

1. Take advantage of the knowledge in our vector datastore.
2. Answer, based on the provided context, that it can not provide an answer.

We have just shown a useful mechanism to mitigate the risks of hallucinations in Large Language Models.
