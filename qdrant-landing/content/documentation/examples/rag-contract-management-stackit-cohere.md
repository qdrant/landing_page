---
title: Region-Specific Contract Management System
short_description: "Build a region-specific contract management RAG system on STACKIT with Qdrant Hybrid Cloud and Cohere, with role-based access to documents."
description: "Deploy a contract management RAG application on STACKIT with Qdrant Hybrid Cloud, Cohere embeddings and LLM, and payload filters that restrict each user to their documents."
weight: 50
social_preview_image: /documentation/tutorials/rag-contract-management-stackit-cohere/social-preview.png
aliases:
  - /documentation/tutorials/rag-contract-management-stackit-aleph-alpha/
  - /documentation/examples/rag-contract-management-stackit-aleph-alpha/
goal: RAG & Agents
stack:
  - Python
  - Cohere
  - STACKIT
---

# Region-Specific Contract Management System

| Time: 90 min | Level: Advanced |  |
| --- | ----------- | ----------- |----------- |

Contract management benefits greatly from Retrieval Augmented Generation (RAG), streamlining the handling of lengthy business contract texts. With AI assistance, complex questions can be asked and well-informed answers generated, facilitating efficient document management. This proves invaluable for businesses with extensive relationships, like shipping companies, construction firms, and consulting practices. Access to such contracts is often restricted to authorized team members due to security and regulatory requirements, such as GDPR in Europe, necessitating secure storage practices.

Companies want their data to be kept and processed within specific geographical boundaries. For that reason, this RAG-centric tutorial focuses on dealing with a region-specific cloud provider. You will set up a contract management system using [Cohere's](https://cohere.com/) embeddings and LLM. You will host everything else on [STACKIT](https://www.stackit.de/), a German business cloud provider. On this platform, you will run Qdrant Hybrid Cloud as well as the rest of your RAG application. This setup will ensure that your documents, vectors, and access rules are stored in Germany.

<aside role="status">
    Cohere is an external API. The text you embed and the chunks you pass to the LLM are sent to it, so they are processed outside STACKIT. If your requirements cover processing as well as storage, check Cohere's data handling terms and its regional and private deployment options before you index sensitive contracts. Command A+ is also available as open weights under the Apache 2.0 license, so the answer step can run on your own infrastructure, for example next to Qdrant on STACKIT. This tutorial uses the Cohere API for both steps to keep the code short.
</aside>

## Components

A contract management platform is not a simple CLI tool, but an application that should be available to all team
members. It needs an interface to upload, search, and manage the documents. Ideally, the system should be 
integrated with org's existing stack, and the permissions/access controls inherited from LDAP or Active 
Directory. 

> **Note:** In this tutorial, we are going to build a solid foundation for such a system. However, it is up to your organization's setup to implement the entire solution.

- **Dataset** - a collection of PDF documents scraped from internet
- **Embedding model** - [Cohere Embed](https://docs.cohere.com/docs/cohere-embed) (`embed-v5.0-pro`) to
  convert the queries and the documents into vectors
- **Large Language Model** - Cohere's [Command A+](https://cohere.com/blog/command-a-plus) (`command-a-plus-05-2026`), but you can use a different Command model
- **Qdrant Hybrid Cloud** - a knowledge base to store the vectors and search over the documents
- **STACKIT** - a [German business cloud](https://www.stackit.de) to run the Qdrant Hybrid Cloud and the application 
  processes

We will implement the process of uploading the documents, converting them into vectors, and storing them in Qdrant. 
Then, we will build a search interface to query the documents and get the answers. All that, assuming the user
interacts with the system with some set of permissions, and can only access the documents they are allowed to.

## Prerequisites

### Cohere account

Since you will be using Cohere's models, sign up on the [Cohere dashboard](https://dashboard.cohere.com/api-keys) and create an API key. Once you have it ready, store it as an environment variable:

```shell
export COHERE_API_KEY="<your-token>"
```

```python
import os

os.environ["COHERE_API_KEY"] = "<your-token>"
```

### Qdrant Hybrid Cloud on STACKIT

Please refer to our documentation to see [how to deploy Qdrant Hybrid Cloud on 
STACKIT](/documentation/hybrid-cloud/platform-deployment-options/#stackit). Once you finish the deployment, you will 
have the API endpoint to interact with the Qdrant server. Let's store it in the environment variable as well:

```shell
export QDRANT_URL="https://qdrant.example.com"
export QDRANT_API_KEY="your-api-key"
```

```python
os.environ["QDRANT_URL"] = "https://qdrant.example.com"
os.environ["QDRANT_API_KEY"] = "your-api-key"
```

Qdrant will be running on a specific URL and access will be restricted by the API key.

### Packages

The application only needs the Qdrant and Cohere clients, and a document parser.

```shell
pip install qdrant-client cohere liteparse
```

[LiteParse](https://github.com/run-llama/liteparse) extracts the text from your documents, page by page.

## Implementation

To build the application, we are going to use the official SDKs of Cohere and Qdrant, and a few lines of plain Python
for the glue. There is no framework in between, so every step of the process is visible in the code.

### Qdrant collection

Cohere Embed 5 lets you choose the size of the vectors with the `output_dimension` parameter (`256`, `512`, `768`, `1024`,
`1536`, or `2048`). This tutorial asks for `1024` dimensions, which keeps the vectors compact. Qdrant can store larger
vectors as well, and this sounds like a good idea to enable [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization) to save space and 
make the retrieval faster. Let's create a collection with such settings:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    location=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
)
client.create_collection(
    collection_name="contracts",
    vectors_config=models.VectorParams(
        size=1024,
        distance=models.Distance.COSINE,
        quantization_config=models.BinaryQuantization(
            binary=models.BinaryQuantizationConfig(
                always_ram=True,
            )
        )
    ),
)
```

We are going to use the `contracts` collection to store the vectors of the documents. The `always_ram` flag is set to
`True` to keep the quantized vectors in RAM, which will speed up the search process. We also wanted to restrict access 
to the individual documents, so only users with the proper permissions can see them. In Qdrant that should be solved by
adding a payload field that defines who can access the document. We'll call this field `roles` and set it to an array
of strings with the roles that can access the document. Because every search filters on it, create a payload index for it:

```python
client.create_payload_index(
    collection_name="contracts",
    field_name="roles",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

The schema says that the field is a keyword, which means it is a string or an array of strings. We are
going to use the name of the customers as the roles, so the access control will be based on the customer name.

### Ingestion pipeline

Semantic search systems rely on high-quality data as their foundation. It's crucial to split the text intelligently to avoid converting entire documents into vectors; instead, they should be divided into meaningful chunks. Each chunk is converted into a vector using Cohere embeddings and stored in the Qdrant collection, together with its text, source, page, and roles.

Let's start by creating the Cohere client and two helpers that embed text. Cohere embeddings are asymmetric: documents and queries are embedded with different input types, so that short questions can be compared against longer passages.

```python
import cohere

co = cohere.ClientV2(api_key=os.environ["COHERE_API_KEY"])
EMBEDDING_MODEL = "embed-v5.0-pro"
EMBEDDING_SIZE = 1024


def embed(texts: list[str], input_type: str) -> list[list[float]]:
    response = co.embed(
        model=EMBEDDING_MODEL,
        input_type=input_type,
        texts=texts,
        output_dimension=EMBEDDING_SIZE,
        embedding_types=["float"],
    )
    return response.embeddings.float_


def embed_documents(texts: list[str]) -> list[list[float]]:
    return embed(texts, "search_document")


def embed_query(text: str) -> list[float]:
    return embed([text], "search_query")[0]
```

Now it's high time to index our documents. Each of the documents is a separate file, and we also have to know the 
customer name to set the access control properly. There might be several roles for a single document, so let's keep them 
in a list.

```python
documents = {
    "data/Data-Processing-Agreement_STACKIT_Cloud_version-1.2.pdf": ["stackit"],
    "data/langchain-terms-of-service.pdf": ["langchain"],
}
```

This is how the documents might look like:

![Example of the indexed document](/documentation/tutorials/rag-contract-management-stackit-cohere/indexed-document.png)

Each has to be split into chunks first; there is no silver bullet. Our chunking algorithm will be simple: it slides a
window over the text of each page, with the maximum chunk size of 500 characters and the overlap of 100 characters.

```python
def split_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    chunks = []
    step = chunk_size - overlap
    for start in range(0, len(text), step):
        chunk = text[start:start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks
```

Now we can iterate over the documents, extract their text with LiteParse, split it into chunks, convert the chunks into
vectors with the Cohere embedding model, and store them in Qdrant.

```python
import uuid

from liteparse import LiteParse

parser = LiteParse()

for document_path, roles in documents.items():
    # Collect a point ID and a payload for every chunk of the document
    chunks = []
    for page in parser.parse(document_path).pages:
        for index, chunk in enumerate(split_text(page.text)):
            # A deterministic ID makes re-ingesting the same file idempotent
            name = f"{document_path}:{page.page_num}:{index}"
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, name))
            payload = {
                "text": chunk,
                "source": document_path,
                "page": page.page_num,
                "roles": roles,
            }
            chunks.append((point_id, payload))

    # Embed and upload the chunks in batches
    for start in range(0, len(chunks), 20):
        batch = chunks[start:start + 20]
        vectors = embed_documents([payload["text"] for _, payload in batch])
        client.upsert(
            collection_name="contracts",
            points=[
                models.PointStruct(id=point_id, vector=vector, payload=payload)
                for (point_id, payload), vector in zip(batch, vectors)
            ],
        )
```

Our collection is filled with data, and we can start searching over it. In a real-world scenario, the ingestion process
should be automated and triggered by the new documents uploaded to the system. Since we already use Qdrant Hybrid Cloud
running on Kubernetes, we can easily deploy the ingestion pipeline as a job to the same environment. On STACKIT, you
probably use the [STACKIT Kubernetes Engine (SKE)](https://www.stackit.de/en/product/kubernetes/) and launch it in a 
container. The [Compute Engine](https://www.stackit.de/en/product/stackit-compute-engine/) is also an option, but 
everything depends on the specifics of your organization.

### Search application

Specialized Document Management Systems have a lot of features, but semantic search is not yet a standard. We are going
to build a simple search mechanism which could be possibly integrated with the existing system. The search process is
quite simple: we convert the query into a vector using the same Cohere model, and then search for the most similar
documents in the Qdrant collection. The access control is also applied, so the user can only see the documents they are
allowed to.

The access control is a filter created as [in a regular Qdrant query](/documentation/search/filtering/), with the `roles`
field set to the user's roles. Qdrant applies it while searching, not afterwards, so the user always gets the requested
number of results from the documents they may read.

```python
def search(question: str, user_roles: list[str], limit: int = 5):
    return client.query_points(
        collection_name="contracts",
        query=embed_query(question),
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="roles",
                    match=models.MatchAny(any=user_roles),
                )
            ]
        ),
        limit=limit,
        with_payload=True,
    ).points
```

#### Check the access restrictions

Before adding the LLM, make sure the filter does its job. The question is the same in all three calls, only the roles of the user change:

```python
question = "What are the rules of performing the audit?"

for user_roles in (["stackit"], ["langchain"], ["unknown"]):
    points = search(question, user_roles)
    print(user_roles, {point.payload["source"] for point in points})
```

Each user only gets chunks from documents that carry one of their roles. A user without a matching role gets nothing at all:

```text
['stackit'] {'data/Data-Processing-Agreement_STACKIT_Cloud_version-1.2.pdf'}
['langchain'] {'data/langchain-terms-of-service.pdf'}
['unknown'] set()
```

#### Generate the answer

Now we create the final step: the LLM of our choice generates the answer from the retrieved chunks. The prompt asks the
model to answer from the source only:

```python
prompt_template = """
Question: {question}
Answer the question using the Source. If there's no answer, say "NO ANSWER IN TEXT".

Source: {context}
"""


def answer(question: str, user_roles: list[str]) -> str:
    points = search(question, user_roles)
    context = "\n\n".join(point.payload["text"] for point in points)
    response = co.chat(
        model="command-a-plus-05-2026",
        messages=[
            {
                "role": "user",
                "content": prompt_template.format(question=question, context=context),
            }
        ],
    )
    return response.message.content[0].text


user_roles = ["stackit", "cohere"]
print(answer("What are the rules of performing the audit?", user_roles))
```

We set the user roles to `stackit` and `cohere`, so the user can see the documents that are accessible to these
customers, but not to the others. The answer is generated only from the chunks the user is allowed to see: with the
roles above, the model answers from the STACKIT data processing agreement. Ask the same question with `["langchain"]`
as the roles, and it answers from the LangChain terms of service instead, or says `NO ANSWER IN TEXT` when they do not
cover the topic.

There are some other parameters that might be tuned to optimize the search process. The `limit` parameter defines how many
chunks are passed to the LLM. Qdrant can also diversify the results with
[Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr), so the user gets the most
relevant chunks, but also the most diverse ones. It is slower than plain similarity search, but might be more user-friendly.

Our search application is ready, and we can deploy it to the same environment as the ingestion pipeline on STACKIT. The
same rules apply here, so you can use the SKE or the Compute Engine, depending on the specifics of your organization.

## Next steps

We built a solid foundation for the contract management system, but there is still a lot to do. If you want to make the
system production-ready, you should consider implementing the mechanism into your existing stack. If you have any 
questions, feel free to ask on our [Discord community](https://qdrant.to/discord).