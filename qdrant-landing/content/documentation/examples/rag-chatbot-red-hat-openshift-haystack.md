---
title: Private Chatbot for Interactive Learning
short_description: "Build a fully private interactive learning chatbot with Qdrant Hybrid Cloud, Haystack, and an open-source LLM running on Red Hat OpenShift."
description: "Deploy a private RAG chatbot on Red Hat OpenShift with Qdrant Hybrid Cloud and Haystack, keeping training content and queries inside your infrastructure."
weight: 30 
aliases:
  - /documentation/tutorials/rag-chatbot-red-hat-openshift-haystack/
goal: RAG & Agents
stack:
  - Haystack
  - OpenShift
---

# Private Chatbot for Interactive Learning

| Time: 120 min | Level: Advanced |  |
| --- | ----------- | ----------- |----------- |

With chatbots, companies can scale their training programs to accommodate a large workforce, delivering consistent and standardized learning experiences across departments, locations, and time zones. Furthermore, having already completed their online training, corporate employees might want to refer back old course materials. Most of this information is proprietary to the company, and manually searching through an entire library of materials takes time. However, a chatbot built on this knowledge can respond in the blink of an eye. 

With a simple RAG pipeline, you can build a private chatbot. In this tutorial, you will combine open source tools inside of a closed infrastructure and tie them together with a reliable framework. This custom solution lets you run a chatbot without public internet access. You will be able to keep sensitive data secure without compromising privacy.

{{< island
    path="content/documentation/headless/openshift-chatbot/architecture"
    ratio="3 / 2"
    title="**Figure 1:** The LLM and Qdrant Hybrid Cloud are containerized as separate services. Haystack combines them into a RAG pipeline and exposes the API via Hayhooks. Select a step to see which links it uses."
>}}
![Architecture on Red Hat OpenShift: users call Hayhooks, which serves the search pipeline of the Haystack application. The Haystack application talks to Qdrant Hybrid Cloud and to the model server running Mistral-7B-Instruct-v0.1, each in its own container.](/documentation/examples/student-rag-haystack-red-hat-openshift-hc/openshift-diagram.png)
{{< /island >}}

## Components
To maintain complete data isolation, we need to limit ourselves to open-source tools and use them in a private environment, such as [Red Hat OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift). The pipeline will run internally and will be inaccessible from the internet.

- **Dataset:** [Red Hat Interactive Learning Portal](https://developers.redhat.com/learn), an online library of Red Hat course materials.
- **LLM:** `mistralai/Mistral-7B-Instruct-v0.1`, deployed as a standalone service on OpenShift.
- **Embedding Model:** `BAAI/bge-base-en-v1.5`, lightweight embedding model deployed from within the Haystack pipeline
  with [FastEmbed](https://github.com/qdrant/fastembed)
- **Vector DB:** [Qdrant Hybrid Cloud](https://hybrid-cloud.qdrant.tech) running on OpenShift.
- **Framework:** [Haystack](https://haystack.deepset.ai/) to connect all and [Hayhooks](https://docs.haystack.deepset.ai/docs/hayhooks) to serve the app through HTTP endpoints.

### Procedure
The [Haystack](https://haystack.deepset.ai/) framework leverages two pipelines, which combine our components sequentially to process data. 

1. The **Indexing Pipeline** will run offline in batches, when new data is added or updated. Fetching the pages and splitting them into chunks is plain Python that runs before it.
2. The **Search Pipeline** will retrieve information from Qdrant and use an LLM to produce an answer.

> **Note:** We will define the search pipeline in Python and then export it to YAML format, so that [Hayhooks](https://docs.haystack.deepset.ai/docs/hayhooks) can run it as a web service.

<aside role="status">
    The code in this tutorial is written for Haystack 3.3.0 and Hayhooks 2.0.0.
</aside>

## Prerequisites

### Deploy the LLM to OpenShift

Follow the steps in [Chapter 6. Serving large language models](https://access.redhat.com/documentation/en-us/red_hat_openshift_ai_self-managed/2.5/html/working_on_data_science_projects/serving-large-language-models_serving-large-language-models#doc-wrapper). This will download the LLM from the [HuggingFace](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1), and deploy it to OpenShift using a *single model serving platform*. 

Your LLM service will have a URL. The tutorial talks to it through Haystack's chat generator, so the model server needs to expose an OpenAI-compatible chat API, which both vLLM and Text Generation Inference do. Store the URL as an environment variable. The generator also expects an API key; if your model server does not require one, any value works:

```shell
export INFERENCE_ENDPOINT_URL="http://mistral-service.default.svc.cluster.local"
export OPENAI_API_KEY="not-needed"
```

### Launch Qdrant Hybrid Cloud

Complete **How to Set Up Qdrant on Red Hat OpenShift**. When in Hybrid Cloud, your Qdrant instance is private and and its nodes run on the same OpenShift infrastructure as your other components.  

Retrieve your Qdrant URL and API key and store them as environment variables:

```shell
export QDRANT_URL="https://qdrant.example.com"
export QDRANT_API_KEY="your-api-key"
```

Export the variables in the shell where you run the Python code and, later, the Hayhooks server.

## Implementation

We will first create an indexing pipeline to add documents to the system. 
Then, the search pipeline will retrieve relevant data from our documents.
After the pipelines are tested, we will export them to YAML files.

### Indexing pipeline

[Haystack](https://haystack.deepset.ai/) comes packed with a lot of useful components, from data fetching, through 
HTML parsing, up to the vector storage. Before we start, there are a few Python packages that we need to install:

```shell
pip install haystack-ai \
    qdrant-haystack \
    fastembed-haystack \
    trafilatura
```

<aside role="status">
FastEmbed uses ONNX runtime and does not require a GPU for the embedding models while still providing a fast inference speed.
</aside>

Our environment is now ready, so we can jump right into the code.

#### Data fetching and conversion

In this step, we will use Haystack's `LinkContentFetcher` to download course content from a list of URLs.
As we don't want to store raw HTML, `HTMLToDocument` will extract the text content from each webpage. 
Both components can be called directly, so there is no need for a pipeline yet:

```python
from haystack.components.fetchers import LinkContentFetcher
from haystack.components.converters import HTMLToDocument

fetcher = LinkContentFetcher()
converter = HTMLToDocument()
```

We have a bunch of URLs to all the Red Hat OpenShift Foundations course lessons, so let's use them:

```python
lesson_base = (
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/"
    "resource/resources:"
)
lessons = [
    "openshift-and-developer-sandbox",
    "overview-web-console",
    "use-terminal-window-within-red-hat-openshift-web-console",
    "install-application-source-code-github-repository-using-openshift-web-console",
    (
        "install-application-linux-container-image-repository-"
        "using-openshift-web-console"
    ),
    "install-application-linux-container-image-using-oc-cli-tool",
    "install-application-source-code-using-oc-cli-tool",
    "scale-applications-using-openshift-web-console",
    "scale-applications-using-oc-cli-tool",
    "work-databases-openshift-using-oc-cli-tool",
    "work-databases-openshift-web-console",
    "view-performance-information-using-openshift-web-console",
]

course_urls = [
    "https://developers.redhat.com/learn/openshift/foundations-openshift",
    *(lesson_base + lesson for lesson in lessons),
]

streams = fetcher.run(urls=course_urls)["streams"]
documents = converter.run(sources=streams)["documents"]
```

#### Chunking

`HTMLToDocument` returns Haystack `Document` instances, which are the base class containing some data to be queried.
However, a single document might be too long to be processed by the embedding model, and it also carries way too much 
information to make the search relevant. 

Therefore, we need to split every document into smaller parts. A few lines of plain Python are enough: the function
splits the text into sentences and groups them into chunks of 5 sentences, with an overlap of 2 sentences between neighbors.

```python
import re

from haystack import Document


def split_document(
    document: Document, split_length: int = 5, split_overlap: int = 2
) -> list[Document]:
    sentences = re.split(r"(?<=[.!?])\s+", (document.content or "").strip())
    step = split_length - split_overlap
    chunks = []
    for start in range(0, len(sentences), step):
        content = " ".join(sentences[start:start + split_length])
        if content:
            chunks.append(Document(content=content, meta=document.meta))
    return chunks


chunks = [chunk for document in documents for chunk in split_document(document)]
```

#### Creating the embeddings and writing data to Qdrant

The chunks are now ready to be converted into embeddings and stored in Qdrant. This is the part we hand over to a Haystack
pipeline. It uses `FastembedDocumentEmbedder`, pointed to our `BAAI/bge-base-en-v1.5` model, and a `DocumentWriter` connected to a `QdrantDocumentStore`:

```python
import os

from haystack import Pipeline
from haystack.components.writers import DocumentWriter
from haystack.utils import Secret
from haystack_integrations.components.embedders.fastembed import (
    FastembedDocumentEmbedder,
)
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore

document_store = QdrantDocumentStore(
    url=os.environ["QDRANT_URL"],
    api_key=Secret.from_env_var("QDRANT_API_KEY"),
    index="red-hat-learning",
    return_embedding=True,
    embedding_dim=768,
)

indexing_pipeline = Pipeline()
indexing_pipeline.add_component(
    "embedder", FastembedDocumentEmbedder(model="BAAI/bge-base-en-v1.5")
)
indexing_pipeline.add_component(
    "writer", DocumentWriter(document_store=document_store)
)
indexing_pipeline.connect("embedder.documents", "writer.documents")
```

#### Test the entire pipeline 

We can finally run it on the chunks to index the content in Qdrant:

```python
indexing_pipeline.run(data={"embedder": {"documents": chunks}})
```

The execution might take a while, as the model needs to process all the chunks. After the process is finished, we
should have all the chunks stored in Qdrant, ready for search. You should see a short summary with the number of written documents:

```shell
{'writer': {'documents_written': <number of chunks>}}
```

### Search pipeline

Our documents are now indexed and ready for search. The next pipeline is a bit simpler, but we still need to define a
few components. Let's start again with an empty pipeline:

```python
search_pipeline = Pipeline()
```

Our second process takes user input, converts it into embeddings and then searches for the most relevant documents
using the query embedding. This might look familiar, but we aren't working with `Document` instances 
anymore, since the query only accepts raw text. Thus, some of the components will be different, especially the embedder,
as it has to accept a single string as an input and produce a single embedding as an output:

```python
from haystack_integrations.components.embedders.fastembed import (
    FastembedTextEmbedder,
)
from haystack_integrations.components.retrievers.qdrant import (
    QdrantEmbeddingRetriever,
)

query_embedder = FastembedTextEmbedder(model="BAAI/bge-base-en-v1.5")

retriever = QdrantEmbeddingRetriever(
    document_store=document_store,  # The same store as the one used for indexing
    top_k=3,  # Number of documents to return
)

search_pipeline.add_component("query_embedder", query_embedder)
search_pipeline.add_component("retriever", retriever)

search_pipeline.connect("query_embedder.embedding", "retriever.query_embedding")
```

#### Run a test query

If our goal was to just retrieve the relevant documents, we could stop here. Let's try the current pipeline on a simple
query:

```python
query = "How to install an application using the OpenShift web console?"

search_pipeline.run(data={
    "query_embedder": {
        "text": query
    }
})
```

We set the `top_k` parameter to 3, so the retriever should return the three most relevant documents. Your output should look like this:

```text
{
    'retriever': {
        'documents': [
            Document(id=867b4aa4c37a91e72dc7ff452c47972c1a46a279a7531cd6af14169bcef1441b, content: 'Install a Node.js application from GitHub using the web console The following describes the steps r...', meta: {'content_type': 'text/html', 'source_id': 'f56e8f827dda86abe67c0ba3b4b11331d896e2d4f7b2b43c74d3ce973d07be0c', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:work-databases-openshift-web-console'}, score: 0.9209432),
            Document(id=0c74381c178597dd91335ebfde790d13bf5989b682d73bf5573c7734e6765af7, content: 'How to remove an application from OpenShift using the web console. In addition to providing the cap...', meta: {'content_type': 'text/html', 'source_id': '2a0759f3ce4a37d9f5c2af9c0ffcc80879077c102fb8e41e576e04833c9d24ce', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-linux-container-image-repository-using-openshift-web-console'}, score: 0.9132109500000001),
            Document(id=3e5f8923a34ab05611ef20783211e5543e880c709fd6534d9c1f63576edc4061, content: 'Path resource: Install an application from source code in a GitHub repository using the OpenShift w...', meta: {'content_type': 'text/html', 'source_id': 'a4c4cd62d07c0d9d240e3289d2a1cc0a3d1127ae70704529967f715601559089', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-source-code-github-repository-using-openshift-web-console'}, score: 0.912748935)
        ]
    }
}
```

#### Generating the answer

Retrieval should serve more than just documents. Therefore, we will need to use an LLM to generate exact answers to our question. 
This is the final component of our second pipeline. 

Haystack will create a prompt which adds your documents to the model's context. The `ChatPromptBuilder` is filled with
the documents and the query, and the `OpenAIChatGenerator` sends the resulting message to the LLM service running on OpenShift:

```python
from haystack.components.builders import ChatPromptBuilder
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.dataclasses import ChatMessage

prompt_builder = ChatPromptBuilder(
    template=[
        ChatMessage.from_user("""
Given the following information, answer the question.

Context: 
{% for document in documents %}
    {{ document.content }}
{% endfor %}

Question: {{ query }}
""")
    ]
)
llm = OpenAIChatGenerator(
    model="mistralai/Mistral-7B-Instruct-v0.1",
    api_base_url=f"{os.environ['INFERENCE_ENDPOINT_URL']}/v1",
    generation_kwargs={
        "max_tokens": 1000,  # Allow longer responses
    },
)

search_pipeline.add_component("prompt_builder", prompt_builder)
search_pipeline.add_component("llm", llm)

search_pipeline.connect("retriever.documents", "prompt_builder.documents")
search_pipeline.connect("prompt_builder.prompt", "llm.messages")
```

The `OpenAIChatGenerator` reads the API key from the `OPENAI_API_KEY` environment variable. Let's run the pipeline again:

```python
query = "How to install an application using the OpenShift web console?"

response = search_pipeline.run(data={
    "query_embedder": {
        "text": query
    },
    "prompt_builder": {
        "query": query
    },
})
```

The LLM may provide multiple replies, if asked to do so, so let's iterate over and print them out:

```python
for reply in response["llm"]["replies"]:
    print(reply.text.strip())
```

In our case there is a single response, which should be the answer to the question:

```text
Answer: To install an application using the OpenShift web console, follow these steps:

1. Select +Add on the left side of the web console.
2. Identify the container image to install.
3. Using your web browser, navigate to the Developer Sandbox for Red Hat OpenShift and select Start your Sandbox for free.
4. Install an application from source code stored in a GitHub repository using the OpenShift web console.
```

Now both flows are in place. The following figure shows them side by side: select a component to see what it does, and note which steps run inside a Haystack pipeline and which are plain Python.

{{< island
    path="content/documentation/headless/openshift-chatbot/pipelines"
    ratio="3 / 2"
    title="The indexing and search flows. The connections are labeled with the data that flows between the components."
>}}
![The indexing flow: course pages, LinkContentFetcher, HTMLToDocument, split_document, then FastembedDocumentEmbedder and DocumentWriter in a Haystack pipeline, into Qdrant. The search flow: a question goes through FastembedTextEmbedder, QdrantEmbeddingRetriever, ChatPromptBuilder, and OpenAIChatGenerator in a Haystack pipeline, and returns an answer.](/documentation/examples/private-chatbot-openshift/pipelines.svg)
{{< /island >}}

## Deployment

The search pipeline is now ready, and we can export it to YAML. Hayhooks will use this file to run the
pipeline as an HTTP endpoint. 

> Note: The indexing pipeline might be run inside your ETL tool, but search should be definitely exposed as an HTTP endpoint. 

Let's run it on the local machine:

```shell
pip install hayhooks
```

First of all, we need to save the pipeline to a YAML file. Hayhooks also needs to know which inputs the endpoint accepts and
which outputs it returns, so we append an `inputs` and an `outputs` section to the exported pipeline. Each input maps a
name to one or more `component.field` targets, which lets the same `question` feed both the embedder and the prompt builder:

```python
with open("search-pipeline.yaml", "w") as fp:
    search_pipeline.dump(fp)
    fp.write("""
inputs:
  question:
    - query_embedder.text
    - prompt_builder.query
  top_k:
    - retriever.top_k

outputs:
  replies: llm.replies
""")
```

Make sure the environment variables from the prerequisites are exported in the shell that starts Hayhooks, and run the service:

```shell
hayhooks run
```

The command should start the service on the default port, so you can access it at `http://localhost:1416`. The pipeline
is not deployed yet, but we can do it with just another command:

```shell
hayhooks pipeline deploy-yaml search-pipeline.yaml --name search-pipeline
```

Once it's finished, you should be able to see the OpenAPI documentation at 
[http://localhost:1416/docs](http://localhost:1416/docs), and test the newly created endpoint. 
Every declared input is required, so a request always includes the question and the number of documents to retrieve:

```shell
curl -X 'POST' \
  'http://localhost:1416/search-pipeline/run' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "question": "How can I remove an application?",
  "top_k": 5
}'
```

Our search is now accessible through the HTTP endpoint, so we can integrate it with any other service. The response wraps
the declared output in a `result` object, with one entry per component. The generated answer is in the text of the
chat message:

```json
{
  "result": {
    "llm": {
      "replies": [
        {
          "_role": "assistant",
          "_content": [{"text": "..."}],
          "_name": null,
          "_meta": {}
        }
      ]
    }
  }
}
```

## Next steps

- In this example, [Red Hat OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) is the infrastructure of choice for proprietary chatbots. [Read more](https://access.redhat.com/documentation/en-us/red_hat_openshift_ai_self-managed/2.8) about how to host AI projects in their [extensive documentation](https://access.redhat.com/documentation/en-us/red_hat_openshift_ai_self-managed/2.8).

- [Haystack's documentation](https://docs.haystack.deepset.ai/docs/kubernetes) describes [how to deploy the Hayhooks service in a Kubernetes 
environment](https://docs.haystack.deepset.ai/docs/kubernetes), so you can easily move it to your own OpenShift infrastructure.

- If you are just getting started and need more guidance on Qdrant, read the [quickstart](/documentation/quickstart/) or try out our [beginner tutorial](/documentation/tutorials-develop/neural-search/).