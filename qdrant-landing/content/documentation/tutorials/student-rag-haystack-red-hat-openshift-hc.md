---
title: Personalizing the learning experience with RAG
weight: 23 
---

# Personalizing the learning experience with RAG

Online courses became the preferred way of learning some new things for many people. The main reason is that they are 
flexible and can be done at your own pace. However, if you finished a couple of them already, and do not remember all
the details, you might want to have a tool that can remind you certain concepts or even suggest the best action to take
in the current situation. Being able to chat with the course becomes easier with Large Language Models (LLMs), but since 
they were not trained on the course material, they will be never able to use the knowledge from it. The power of 
Retrieval Augmented Generation(RAG) is to bring external relevant knowledge to the conversation, so the LLM may use it 
to answer your questions.

[Red Hat Interactive Learning Portal](https://developers.redhat.com/learn) is an excellent resource for boosting your 
software development career. If you, for example, would like to learn about the basics of [Red Hat 
OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift), you can easily find a course that covers
the foundations:

![](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/red-hat-foundations-of-openshift.png)

Online trainings are also quite common in corporate environments. The employees are often required to take a number of
courses to keep their knowledge up to date. The same problem arises here: **the employees might not remember all the
details from the courses they took**. The RAG model can be used to help them find the information they need. Since 
internal company documents, including trainings, are not available to the public, it might be required to be able to 
host everything on the company's infrastructure. Mature companies often use [Red Hat 
OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) for building and deploying their 
applications already. This tutorial will show you how to create a RAG pipeline using permissive open-source tools and 
deploy it on Red Hat OpenShift with Qdrant also running there, thanks to the Hybrid Cloud offering. With that setup, 
**not a single datapoint leaves your infrastructure**!

[//]: # (TODO: add links to Qdrant Hybrid Cloud)

## Target system

We are going to implement a system that will be able to answer questions based on the courses. The system will be hosted
completely on our own infrastructure with all the components securely running even without internet access.

Such a RAG-based application needs a few components:

- Large Language Model, in our case `mistralai/Mistral-7B-Instruct-v0.1`
- An embedding model, such as `BAAI/bge-m3`
- Retrieval mechanism, obviously built with [Qdrant](https://qdrant.tech) running in Hybrid Cloud
- [Haystack 2.x](https://haystack.deepset.ai/) to orchestrate all the components and 
  [Hayhooks](https://docs.haystack.deepset.ai/docs/hayhooks) for serving the application through HTTP endpoints

[//]: # (TODO: link "Hybrid Cloud" to the corresponding docs)

TODO: visualize the flow between the components

### Processes in the system

Building any semantic search system requires at least two processes to be implemented: indexing the data and searching
over it. The indexing process is usually done offline, as a batch job that we run every time we have new data to index,
or if the data changes. [Haystack](https://haystack.deepset.ai/) has a concept of a pipeline, which is a directed graph
of components that process the data in a specific order. Pipelines might be defined as code or as a YAML file. In our
case, we will use the code to define the pipelines, and then export once of them to YAML so 
[Hayhooks](https://docs.haystack.deepset.ai/docs/hayhooks) can run it as a web service.

## Building up a system

There are a few components that we need to bring to life before our application can be launched. 

### Large Language Model

Large Language Models are the core of the RAG pipeline. They are responsible for generating the answers and should not 
be launched within the web service, as they need a lot of resources to run. Instead, we usually prefer to expose them as
a separate service, which can be queried by the main application. The model we are going to use is an open source
`mistralai/Mistral-7B-Instruct-v0.1`, which is a 7B parameter model licensed under the Apache 2.0 license. We can get
it from the [Hugging Face model hub](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1), and deploy it on Red 
Hat OpenShift using a *single model serving platform*, as described in the Red Hat documentation: [Chapter 6. Serving 
large language models](https://access.redhat.com/documentation/en-us/red_hat_openshift_ai_self-managed/2.5/html/working_on_data_science_projects/serving-large-language-models_serving-large-language-models#doc-wrapper).

<aside role="status">Please follow all the steps from the linked documentation before you go further</aside>

The platform is based on [KServe](https://kserve.github.io/website/0.11/), a Kubernetes model inference platform, and 
[Caikit-TGIS](https://github.com/opendatahub-io/caikit-tgis-serving) runtime, which includes a fork of the Hugging Face 
[Text Generation Inference](https://github.com/huggingface/text-generation-inference) server.

![KServe layer](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/kserve-layer.png)

*Source: https://kserve.github.io/website/0.11/*

After the model is deployed, we need to know the URL of the service, so we can use it in our code. The URL might be
stored in an environment variable, so we can use it in the code and change it from the outside. 

```shell
export INFERENCE_ENDPOINT_URL="http://mistral-service.default.svc.cluster.local"
```

```python
import os

os.environ["INFERENCE_ENDPOINT_URL"] = "http://mistral-service.default.svc.cluster.local"
```

### Embedding model

Theoretically, we could also host an embedding model as another web service, similarly to the Large Language Model. 
However, we will deploy it as a part of the Haystack pipeline, as it is not as resource-intensive as the LLM. Let's skip
this part for now, as we will cover it in the next sections.

### Qdrant Hybrid Cloud

We don't want our vectors and learning materials to be stored in a publicly available database, so we will use Qdrant in 
a Hybrid Cloud mode, with all the nodes running on our Red Hat OpenShift infrastructure. The process of setting it up is 
described in the Hybrid Cloud documentation, so please follow it to get your Qdrant up and running.

TODO: add a link to the corresponding documentation page

At the end of the process, you should have a running Qdrant instance available under a specific URL. Make sure to
retrieve the API key, as it will be required to interact with the database. Our configuration might be again stored in 
the environment variables:

```shell
export QDRANT_URL="https://qdrant.example.com"
export QDRANT_API_KEY="your-api-key"
```

```python
os.environ["QDRANT_URL"] = "https://qdrant.example.com"
os.environ["QDRANT_API_KEY"] = "your-api-key"
```

## Implementing the pipelines

Search does not make much sense without a proper set of documents to search over. For that reason, we will start with 
the indexing pipeline first, and then move to the search pipeline. We can implement both of them in Python, either 
script or notebook, as eventually we will export them to YAML files either way.

### Indexing pipeline

[Haystack 2.x](https://haystack.deepset.ai/) comes packed with a lot of useful components, from data fetching, through 
HTML parsing, up to the vector storage. Before we start, there are a few Python packages that we need to install:

```shell
pip install haystack-ai \
  qdrant-haystack \
  transformers \
  torch --index-url https://download.pytorch.org/whl/cpu
```

<aside role="status">
We set the index URL for PyTorch to CPU, as we are going to run the indexing process, including the embedding model, on 
the processor. If you have a compatible GPU, you can install the corresponding version of PyTorch (CUDA or ROCm).
</aside>

Our environment is now ready, so we can jump right into the code. Let's define an empty pipeline and gradually add
components to it:

```python
from haystack import Pipeline

indexing_pipeline = Pipeline()
```

#### Data fetching and conversion

Our goal is to have a tool that will accept a list of URLs, download the content from them and store in Qdrant to enable
searching over it. We also don't want to store the raw HTML, but extract the text content from each webpage. Also, the
documents might be pretty long, so it's better to divide them into digestible chunks. We can achieve all of that with
the components provided by Haystack. First of all, let's focus on the data fetching and conversion to text:

```python
from haystack.components.fetchers import LinkContentFetcher
from haystack.components.converters import HTMLToDocument

fetcher = LinkContentFetcher()
converter = HTMLToDocument()

indexing_pipeline.add_component("fetcher", fetcher)
indexing_pipeline.add_component("converter", converter)
```

Our pipeline knows there are two components, but they are not connected yet. We need to define the flow between them:

```python
indexing_pipeline.connect("fetcher.streams", "converter.sources")
```

Each component has a set of inputs and outputs which might be combined in a directed graph. The definitions of the 
inputs and outputs are usually provided in the documentation of the component. The `LinkContentFetcher` has the 
following parameters:

![Parameters of the `LinkContentFetcher`](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/haystack-link-content-fetcher.png)

*Source: https://docs.haystack.deepset.ai/docs/linkcontentfetcher*

#### Chunking and creating the embeddings

The `HTMLToDocument` component was used to convert the HTML sources into `Document` instances of Haystack, which is a
base class containing some data to be queried. Still, a single document might be too long to be processed by the 
embedding model, and it also carries way too much information to make the search relevant. We need to split the document
into smaller parts and convert them into embeddings. For that purpose, we will use the `DocumentSplitter` and
`HuggingFaceTEIDocumentEmbedder` pointed to our `BAAI/bge-m3` model:

```python
from haystack.components.preprocessors import DocumentSplitter
from haystack.components.embedders import HuggingFaceTEIDocumentEmbedder

splitter = DocumentSplitter(split_by="sentence", split_length=5, split_overlap=2)
embedder = HuggingFaceTEIDocumentEmbedder(model="BAAI/bge-m3")

indexing_pipeline.add_component("splitter", splitter)
indexing_pipeline.add_component("embedder", embedder)

indexing_pipeline.connect("converter.documents", "splitter.documents")
indexing_pipeline.connect("splitter.documents", "embedder.documents")
```

#### Writing data to Qdrant

The splitter will be producing chunks with a maximum length of 5 sentences, with an overlap of 2 sentences. Then, these
smaller portions will be converted into embeddings. The last missing piece is the storage of the embeddings in Qdrant.

```python
from haystack.utils import Secret
from haystack_integrations.document_stores.qdrant import QdrantDocumentStore
from haystack.components.writers import DocumentWriter

document_store = QdrantDocumentStore(
    os.environ["QDRANT_URL"], 
    api_key=Secret.from_env_var("QDRANT_API_KEY"),
    index="red-hat-learning", 
    return_embedding=True, 
    embedding_dim=1024,
)
writer = DocumentWriter(document_store=document_store)

indexing_pipeline.add_component("writer", writer)

indexing_pipeline.connect("embedder.documents", "writer.documents")
```

Our pipeline is now complete. Haystack comes with a handy visualization of the pipeline, so you can see and verify the 
connections between the components. It is displayed in the Jupyter notebook, but you can also export it to a file:

```python
indexing_pipeline.draw("indexing_pipeline.png")
```

![Structure of the indexing pipeline](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/indexing_pipeline.png)

#### Testing the pipeline end-to-end

We can finally run it on a list of URLs to index the content in Qdrant. We have a bunch of URLs to all the Red Hat
OpenShift Foundations course lessons, so let's use them:

```python
course_urls = [
    "https://developers.redhat.com/learn/openshift/foundations-openshift",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:openshift-and-developer-sandbox",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:overview-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:use-terminal-window-within-red-hat-openshift-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-source-code-github-repository-using-openshift-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-linux-container-image-repository-using-openshift-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-linux-container-image-using-oc-cli-tool",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-source-code-using-oc-cli-tool",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:scale-applications-using-openshift-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:scale-applications-using-oc-cli-tool",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:work-databases-openshift-using-oc-cli-tool",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:work-databases-openshift-web-console",
    "https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:view-performance-information-using-openshift-web-console",
]

indexing_pipeline.run(data={
    "fetcher": {
        "urls": course_urls,
    }
})
```

The execution might take a while, as the model needs to process all the documents. After the process is finished, we
should have all the documents stored in Qdrant, ready to be searched over and a short summary should be displayed on
the standard output:

```shell
{'writer': {'documents_written': 381}}
```

### Search pipeline

Our documents are now indexed, and ready for searching over. The next pipeline is a bit simpler, but still requires a
few components to be defined. Let's start again with an empty pipeline:

```python
search_pipeline = Pipeline()
```

Our second process takes user's input, converts it into embeddings, and then searches for the most relevant documents
using the query embedding. Up to this point, it may look similar, but here we don't work with `Document` instances 
anymore, but just raw text sent as a query. Thus, some of the components will be different, especially the embedder,
as it has to accept a single string as an input and produce a single embedding as an output:

```python
from haystack.components.embedders import HuggingFaceTEITextEmbedder
from haystack_integrations.components.retrievers.qdrant import QdrantEmbeddingRetriever

query_embedder = HuggingFaceTEITextEmbedder(model="BAAI/bge-m3")
retriever = QdrantEmbeddingRetriever(
    document_store=document_store,  # The same document store as the one used for indexing
    top_k=3,  # Number of documents to return
)

search_pipeline.add_component("query_embedder", query_embedder)
search_pipeline.add_component("retriever", retriever)

search_pipeline.connect("query_embedder.embedding", "retriever.query_embedding")
```

#### Retrieving search results

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

We set the `top_k` parameter to 3, so the retriever should return the three most relevant documents. The output should
look as follows:

```text
{
  'retriever': {
    'documents': [
      Document(id=d127499a751f01969e76874049de7bea2dae077184eed9129d98fc97844c4bf2, content: '  Enter the application’s name (Figure 8). Figure 8: Deleting an application using the OpenShift web...', meta: {'content_type': 'text/html', 'source_id': '2a0759f3ce4a37d9f5c2af9c0ffcc80879077c102fb8e41e576e04833c9d24ce', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-linux-container-image-repository-using-openshift-web-console'}, score: 0.87855008),
      Document(id=59095a8e45e656ec7ead299907407c9e63819813ec4a044fb33d953f79448437, content: 'For example, OpenShift lets you install a web application directly from source code or from a conta...', meta: {'content_type': 'text/html', 'source_id': '97f3aed6ff6712d980d6a501def31752317134eabc9897f900f9e2190fbbe186', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:openshift-and-developer-sandbox'}, score: 0.8763400299999999),
      Document(id=5204e1b6adf3cbd2a3984db7bc9768ac4f27e2786f1a2682745b33ab8f5f686e, content: ' You declared the URL of the application’s source code in GitHub, then instigated the build process ...', meta: {'content_type': 'text/html', 'source_id': 'a4c4cd62d07c0d9d240e3289d2a1cc0a3d1127ae70704529967f715601559089', 'url': 'https://developers.redhat.com/learning/learn:openshift:foundations-openshift/resource/resources:install-application-source-code-github-repository-using-openshift-web-console'}, score: 0.8730886)
    ]
  }
}
```

#### Generating the answer

We don't want just the documents, but also an exact answer to our question. For that purpose, we need to use the Large
Language Model to generate it. That will be the final component of our second pipeline, but there is also a need to 
create a prompt that will take the documents and put it into the context sent to the LLM. Haystack has all it covered:

```python
from haystack.components.builders.prompt_builder import PromptBuilder
from haystack.components.generators import HuggingFaceTGIGenerator

prompt_builder = PromptBuilder("""
Given the following information, answer the question.

Context: 
{% for document in documents %}
    {{ document.content }}
{% endfor %}

Question: {{ query }}
""")
llm = HuggingFaceTGIGenerator(
    model="mistralai/Mistral-7B-Instruct-v0.1",
    url=os.environ["INFERENCE_ENDPOINT_URL"],
    generation_kwargs={
        "max_new_tokens": 1000,  # Allow longer responses
    },
)

search_pipeline.add_component("prompt_builder", prompt_builder)
search_pipeline.add_component("llm", llm)

search_pipeline.connect("retriever.documents", "prompt_builder.documents")
search_pipeline.connect("prompt_builder.prompt", "llm.prompt")
```

The `PromptBuilder` is a Jinja2 template that will be filled with the documents and the query. The 
`HuggingFaceTGIGenerator` connects to the LLM service and generates the answer. Let's run the pipeline again:

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
    print(reply.strip())
```

In our case there is a single response, which should be the answer to the question:

```text
Answer: To install an application using the OpenShift web console, you need to follow these steps:

1. Enter the application’s name.
2. Access the Deploy Image web page.
3. Declare the URL for a container image hosted on a public container image repository.
4. Click the Create button.
5. OpenShift downloads the container image and creates a Linux container using that container image.
6. View the application by using a URL that OpenShift creates.
```

Our final search pipeline might also be visualized, so we can see how the components are glued together:

```python
search_pipeline.draw("search_pipeline.png")
```

![Structure of the search pipeline](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/search_pipeline.png)

## Deploying the application

The pipelines are now ready, and we can export them to YAML files. These files might be used by Hayhooks to run the
pipelines as HTTP endpoints. Setting up the services is pretty straightforward, as we just need to provide the paths to
the YAML files and the environment variables. Actually, the indexing pipeline might be run inside your ETL tool, but
search should be definitely exposed as an HTTP endpoint. Let's run it on the local machine:

```shell
pip install hayhooks
```

First of all, we need to save the pipelines to the YAML file:

```python
with open("search-pipeline.yaml", "w") as fp:
    search_pipeline.dump(fp)
```

And now we are able to run the Hayhooks service:

```shell
hayhooks run
```

The command should start the service on the default port, so you can access it at `http://localhost:1416`. The pipeline
is not deployed yet, but we can do it with just another command:

```shell
hayhooks deploy search-pipeline.yaml
```

Once it's finished, you should be able to see the OpenAPI documentation at 
[http://localhost:1416/docs](http://localhost:1416/docs), and test the newly created endpoint.

![Search pipeline in the OpenAPI documentation](/documentation/tutorials/student-rag-haystack-red-hat-openshift-hc/hayhooks-openapi.png)

Our search is now accessible through the HTTP endpoint, so we can integrate it with any other service. We can even 
control the other parameters, like the number of documents to return:

```shell
curl -X 'POST' \
  'http://localhost:1416/search-pipeline' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "llm": {
  },
  "prompt_builder": {
    "query": "How can I remove an application?"
  },
  "query_embedder": {
    "text": "How can I remove an application?"
  },
  "retriever": {
    "top_k": 5
  }
}'
```

The response should be similar to the one we got in the Python before:

```json
{
  "llm": {
    "replies": [
      "\n\nAnswer: You can remove an application running in OpenShift by right-clicking on the circular graphic representing the application in Topology view and selecting the Delete Application text from the dialog that appears when you click the graphic’s outer ring. Alternatively, you can use the oc CLI tool to delete an installed application using the oc delete all command."
    ],
    "meta": [
      {
        "model": "mistralai/Mistral-7B-Instruct-v0.1",
        "index": 0,
        "finish_reason": "eos_token",
        "usage": {
          "completion_tokens": 75,
          "prompt_tokens": 642,
          "total_tokens": 717
        }
      }
    ]
  }
}
```

## Next steps

Haystack's documentation describes [how to deploy the Hayhooks service in a Kubernetes 
environment](https://docs.haystack.deepset.ai/docs/kubernetes), so you can easily move it to your own infrastructure
based on Red Hat OpenShift and enjoy all the components running in a secure and private environment.