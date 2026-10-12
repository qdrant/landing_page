---
title: Chat With Product PDF Manuals Using Hybrid Search
short_description: "Build a PDF-manual chatbot with Qdrant Hybrid Cloud, LlamaIndex, and Jina embeddings, using hybrid search to answer product-support questions."
description: "Create a RAG chatbot for PDF manuals using Qdrant Hybrid Cloud, LlamaIndex, and Jina embeddings, with hybrid search for precise customer-support answers."
weight: 45
social_preview_image: /blog/hybrid-cloud-llamaindex/hybrid-cloud-llamaindex-tutorial.png
aliases:
  - /documentation/tutorials/hybrid-search-llamaindex-jinaai/
goal: RAG & Agents
stack:
  - Python
  - LlamaIndex
  - Jina
example_resources:
  - label: Open Notebook
    url: https://githubtocolab.com/infoslack/qdrant-example/blob/main/HC-demo/HC-DO-LlamaIndex-Jina-v2.ipynb
keywords:
  - PDF
  - documents
  - manuals
  - LlamaIndex
  - Jina
  - RAG
---

# Chat With Product PDF Manuals Using Hybrid Search

| Time: 60 min | Level: Advanced | Stack: Python, LlamaIndex, Jina | Output: [GitHub](https://github.com/infoslack/qdrant-example/blob/main/HC-demo/HC-DO-LlamaIndex-Jina-v2.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/infoslack/qdrant-example/blob/main/HC-demo/HC-DO-LlamaIndex-Jina-v2.ipynb) |
| --- | --- | --- | --- | --- |

Product manuals usually ship as long PDFs full of tables and figures, which makes them hard to search when a customer needs a quick answer.

In this tutorial, you build a retrieval-augmented generation (RAG) chatbot that answers questions about household appliances from their PDF manuals. You set up data ingestion, hybrid retrieval, and response generation for a customer support use case.

## Components

- **Embeddings:** Jina Embeddings, served through the [Jina Embeddings API](https://jina.ai/embeddings/#apiform)
- **Vector search engine:** [Qdrant Hybrid Cloud](/documentation/hybrid-cloud/), deployed in a managed Kubernetes cluster on [DigitalOcean (DOKS)](https://www.digitalocean.com/products/kubernetes)
- **LLM:** [Mixtral-8x7B-Instruct-v0.1](https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1) on Hugging Face
- **Framework:** [LlamaIndex](https://www.llamaindex.ai/) for RAG and [hybrid search support](https://docs.llamaindex.ai/en/stable/examples/vector_stores/qdrant_hybrid/)
- **Parser:** [LlamaParse](https://github.com/run-llama/llama_parse) to parse complex documents with embedded tables and figures

![Architecture diagram of the PDF manual chatbot](/documentation/examples/hybrid-search-llamaindex-jinaai/architecture-diagram.png)

## How RAG Works

RAG combines search with text generation. A retrieval system finds the documents most likely to be relevant to the user's question. The question and those documents then go to a language model, which writes the answer.

This lets the model answer from a much larger set of documents than it could read at once. Because the model only reads a few relevant sections, it's also less likely to produce unsupported answers.

## Prerequisites

### Deploying Qdrant Hybrid Cloud on DigitalOcean

[DigitalOcean Kubernetes (DOKS)](https://www.digitalocean.com/products/kubernetes) is a managed Kubernetes service. It runs the control plane for you, works with standard Kubernetes tools, and integrates with DigitalOcean Load Balancers and volumes.

1. To set up managed Kubernetes on DigitalOcean, follow the [platform-specific documentation](/documentation/hybrid-cloud/platform-deployment-options/#digital-ocean).
2. Once your Kubernetes cluster is up, [deploy Qdrant Hybrid Cloud](/documentation/hybrid-cloud/).
3. When the deployment finishes, you have a running Qdrant cluster and an API key.

### Development Environment

Install the dependencies. In a notebook, prefix the command with `!`.

```bash
pip install -U \
    llama-index \
    "llama-cloud>=2.18" \
    python-dotenv \
    llama-index-embeddings-jinaai \
    llama-index-llms-huggingface-api \
    llama-index-vector-stores-qdrant
```

Add your keys to a `.env` file:

```bash
JINAAI_API_KEY=your-jina-api-key
HF_INFERENCE_API_KEY=your-hugging-face-token
LLAMA_CLOUD_API_KEY=your-llama-cloud-api-key
QDRANT_HOST=your-qdrant-cluster-url
QDRANT_API_KEY=your-qdrant-api-key
```

Load the environment variables:

```python
import os
from dotenv import load_dotenv

load_dotenv("./.env")
```

## Implementation

### Connect Jina Embeddings and Mixtral LLM

LlamaIndex has built-in support for the [Jina Embeddings API](https://jina.ai/embeddings/#apiform). To use it, initialize `JinaEmbedding` with your API key and the model name.

For the LLM, use LlamaIndex's `HuggingFaceInferenceAPI` wrapper with your Hugging Face token.

```python
# Connect the embedding model
from llama_index.embeddings.jinaai import JinaEmbedding

jina_embedding_model = JinaEmbedding(
    model="jina-embeddings-v2-base-en",
    api_key=os.getenv("JINAAI_API_KEY"),
)

# Connect the LLM
from llama_index.llms.huggingface_api import HuggingFaceInferenceAPI

mixtral_llm = HuggingFaceInferenceAPI(
    model_name="mistralai/Mixtral-8x7B-Instruct-v0.1",
    token=os.getenv("HF_INFERENCE_API_KEY"),
)
```

### Prepare Data for RAG

This example uses three household appliance manuals, which manufacturers usually publish as PDFs. LlamaParse turns each manual into Markdown, keeping tables and layout readable, and that text becomes the chatbot's knowledge base.

Before you run the code:

1. Create a LlamaCloud account and generate an API key. The free plan's credits are enough for three manuals.
2. Add the key to your `.env` file as `LLAMA_CLOUD_API_KEY`.
3. Download the three manuals and save them in a `data` folder next to your notebook, with these file names:
    - `DJ68-00682F_0.0.pdf`
    - `F500E_WF80F5E_03445F_EN.pdf`
    - `O_ME4000R_ME19R7041FS_AA_EN.pdf`

The following code uploads each file, parses it, and wraps the result in a LlamaIndex `Document`:

```python
from llama_cloud import LlamaCloud
from llama_index.core import Document

llama_cloud = LlamaCloud(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))

pdf_paths = [
    "data/DJ68-00682F_0.0.pdf",
    "data/F500E_WF80F5E_03445F_EN.pdf",
    "data/O_ME4000R_ME19R7041FS_AA_EN.pdf",
]

documents = []
for path in pdf_paths:
    uploaded = llama_cloud.files.create(file=path, purpose="parse")
    result = llama_cloud.parsing.parse(
        file_id=uploaded.id,
        tier="cost_effective",
        version="latest",
        expand=["markdown"],
    )
    pages = [page.markdown for page in result.markdown.pages if page.success]
    documents.append(Document(text="\n\n".join(pages), metadata={"file_name": path}))

print(f"Parsed {len(documents)} manuals")
```

Check that the output reports three manuals before you continue, so you don't index an incomplete knowledge base.

### Store Data in Qdrant

The following code:

- Creates a vector store with the Qdrant client
- Gets an embedding for each chunk from the Jina Embeddings API
- Combines sparse and dense vectors for hybrid search
- Stores all the data in Qdrant

You need to enable hybrid search when you create the vector store, by setting `enable_hybrid=True`.

```python
from llama_index.core import Settings, StorageContext, VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore
import qdrant_client

# LlamaIndex uses OpenAI models by default.
# Set Jina as the embedding model and Mixtral as the LLM.
Settings.embed_model = jina_embedding_model
Settings.llm = mixtral_llm
Settings.chunk_size = 512

client = qdrant_client.QdrantClient(
    url=os.getenv("QDRANT_HOST"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

vector_store = QdrantVectorStore(
    client=client,
    collection_name="demo",
    enable_hybrid=True,
    batch_size=20,
)

storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_documents(
    documents=documents,
    storage_context=storage_context,
)
```

### Prepare a Prompt

Create a custom prompt template that tells the LLM to answer only from the context retrieved from Qdrant.

In hybrid mode, the retriever runs a dense search and a sparse search, then fuses the results. Three settings control how many nodes each step keeps:

- `similarity_top_k` sets how many nodes the dense search retrieves.
- `sparse_top_k` sets how many nodes the sparse search retrieves.
- `hybrid_top_k` sets how many nodes the retriever returns after fusion. If you leave it out, the retriever falls back to `similarity_top_k`.

With the following settings, each search retrieves 12 candidates and the retriever passes the best 2 to the LLM. Then you assemble the query engine with the prompt.

```python
from llama_index.core import PromptTemplate, get_response_synthesizer
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever

qa_prompt_tmpl = (
    "Context information is below.\n"
    "-------------------------------\n"
    "{context_str}\n"
    "-------------------------------\n"
    "Given the context information and not prior knowledge, "
    "answer the query. Be concise and complete.\n"
    "If the context does not contain an answer to the query, "
    "respond with \"I don't know!\".\n"
    "Query: {query_str}\n"
    "Answer: "
)
qa_prompt = PromptTemplate(qa_prompt_tmpl)

# Retriever
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=12,
    sparse_top_k=12,
    hybrid_top_k=2,
    vector_store_query_mode="hybrid",
)

# Response synthesizer
response_synthesizer = get_response_synthesizer(
    llm=mixtral_llm,
    text_qa_template=qa_prompt,
    response_mode="compact",
)

# Query engine
query_engine = RetrieverQueryEngine(
    retriever=retriever,
    response_synthesizer=response_synthesizer,
)
```

## Run a Test Query

Ask a question, and the chatbot answers from the manuals:

**Question**

```python
result = query_engine.query("What temperature should I use for my laundry?")
print(result.response)
```

**Answer**

```text
The water temperature is set to 70 ˚C during the Eco Drum Clean cycle. You cannot change the water temperature. However, the temperature for other cycles is not specified in the context.
```

You can scale this pipeline to more documents and more complex PDFs.
