---
title: RAG System for Employee Onboarding
short_description: "Build an employee onboarding RAG assistant on Oracle Cloud using Qdrant Hybrid Cloud, Cohere, and LangChain for natural-language access to internal docs."
description: "Build a private onboarding RAG system on Oracle Cloud with Qdrant Hybrid Cloud, Cohere, and LangChain for natural-language search over internal documents."
weight: 55
social_preview_image: /blog/hybrid-cloud-oracle-cloud-infrastructure/hybrid-cloud-oracle-cloud-infrastructure-tutorial.png
aliases:
  - /documentation/tutorials/natural-language-search-oracle-cloud-infrastructure-cohere-langchain/
goal: RAG & Agents
stack:
  - LangChain
  - Cohere
  - Oracle Cloud
---

# RAG System for Employee Onboarding

Public websites are a great way to share information with a wide audience. However, finding the right information can be
challenging, if you are not familiar with the website's structure or the terminology used. That's what the search bar is
for, but it is not always easy to formulate a query that will return the desired results, if you are not yet familiar 
with the content. This is even more important in a corporate environment, and for the new employees, who are just 
starting to learn the ropes, and don't even know how to ask the right questions yet. You may have even the best intranet 
pages, but onboarding is more than just reading the documentation, it is about understanding the processes. Semantic 
search can help with finding right resources easier, but wouldn't it be easier to just chat with the website, like you 
would with a colleague?

Technological advancements have made it possible to interact with websites using natural language. This tutorial will 
guide you through the process of integrating [Cohere](https://cohere.com/)'s language models with Qdrant to enable 
natural language search on your documentation. We are going to use [LangChain](https://langchain.com/) as an 
orchestrator. Everything will be hosted on [Oracle Cloud Infrastructure (OCI)](https://www.oracle.com/cloud/), so you 
can scale your application as needed, and do not send your data to third parties. That is especially important when you 
are working with confidential or sensitive data.

## Building up the application

Our application will consist of two main processes: indexing and searching. LangChain will glue everything together, 
as we will use a few components, including Cohere and Qdrant, as well as some OCI services. Here is a high-level
overview of the architecture:

![Architecture diagram of the target system](/documentation/examples/faq-oci-cohere-langchain/architecture-diagram.png)

### Prerequisites

Before we dive into the implementation, make sure to set up all the necessary accounts and tools.

#### Libraries

We are going to use a few Python libraries. LangChain will be our main framework. The Cohere models on OCI are
accessible through the [`langchain-oci`](https://github.com/oracle/langchain-oracle) integration, which is built on top
of the [OCI SDK](https://docs.oracle.com/en-us/iaas/tools/python/latest/), and Qdrant through `langchain-qdrant`. Let's
install all the necessary libraries:

```shell
pip install langchain-oci langchain-qdrant langchain-community langchain-text-splitters beautifulsoup4
```

#### Oracle Cloud

Our application will be fully running on Oracle Cloud Infrastructure (OCI). It's up to you to choose how you want to
deploy your application. Qdrant Hybrid Cloud will be running in your [Kubernetes cluster running on Oracle Cloud 
(OKE)](https://www.oracle.com/cloud/cloud-native/container-engine-kubernetes/), so all the processes might be also 
deployed there. You can get started with signing up for an account on [Oracle Cloud](https://signup.cloud.oracle.com/).

Cohere models are available on OCI as a part of the [Generative AI 
Service](https://www.oracle.com/artificial-intelligence/generative-ai/generative-ai-service/). We need both the 
[Generation models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/use-playground-generate.htm) and the 
[Embedding models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/use-playground-embed.htm). Please follow the 
linked tutorials to grasp the basics of using Cohere models there.

Accessing the models programmatically requires knowing the compartment OCID. Please refer to the [documentation that
describes how to find it](https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/contactingsupport_topic-Locating_Oracle_Cloud_Infrastructure_IDs.htm#Finding_the_OCID_of_a_Compartment).
The OCI SDK authenticates with the API key stored in `~/.oci/config` by default. If you have not set it up yet, follow
the [SDK configuration guide](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm). For the further
reference, we will assume that the compartment OCID is stored in the environment variable:

```shell
export COMPARTMENT_OCID="<your-compartment-ocid>"
```

```python
import os

os.environ["COMPARTMENT_OCID"] = "<your-compartment-ocid>"
```

#### Qdrant Hybrid Cloud

Qdrant Hybrid Cloud running on Oracle Cloud helps you build a solution without sending your data to external services. Our documentation provides a step-by-step guide on how to [deploy Qdrant Hybrid Cloud on Oracle 
Cloud](/documentation/hybrid-cloud/platform-deployment-options/#oracle-cloud-infrastructure).

Qdrant will be running on a specific URL and access will be restricted by the API key. Make sure to store them both as environment variables as well:

```shell
export QDRANT_URL="https://qdrant.example.com"
export QDRANT_API_KEY="your-api-key"
```

*Optional:* Whenever you use LangChain, you can also [configure LangSmith](https://docs.smith.langchain.com/), which will help us trace, monitor and debug LangChain applications. You can sign up for LangSmith [here](https://smith.langchain.com/).

```shell
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="your-api-key"
export LANGSMITH_PROJECT="your-project"  # if not specified, defaults to "default"
```

Now you can get started:

```python
import os

os.environ["QDRANT_URL"] = "https://qdrant.example.com"
os.environ["QDRANT_API_KEY"] = "your-api-key"
```

Let's create the collection that will store the indexed documents. We will use the `qdrant-client` library, and our
collection will be named `oracle-cloud-website`. Our embedding model, `cohere.embed-v4.0`, produces embeddings of size
1536 by default, and we have to specify that when creating the collection.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=os.environ.get("QDRANT_URL"),
    api_key=os.environ.get("QDRANT_API_KEY"),
)
client.create_collection(
    collection_name="oracle-cloud-website",
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE,
    ),
)
```

### Indexing process

We have all the necessary tools set up, so let's start with the indexing process. We will use the Cohere Embedding 
models to convert the text into vectors, and then store them in Qdrant. LangChain is integrated with OCI Generative AI
Service, so we can easily access the models. 

Our dataset will be fairly simple, as it will consist of the questions and answers from the [Oracle Cloud Free Tier
FAQ page](https://www.oracle.com/cloud/free/faq/). 

![Some examples of the Oracle Cloud FAQ](/documentation/examples/faq-oci-cohere-langchain/oracle-faq.png)

Questions and answers are presented in an HTML format, but we don't want to manually extract the text and adapt it for 
each subpage. Instead, we will use the `WebBaseLoader` that just loads the HTML content from given URL and converts it 
to text. 

```python
from langchain_community.document_loaders import WebBaseLoader

loader = WebBaseLoader("https://www.oracle.com/cloud/free/faq/")
documents = loader.load()
```

Our `documents` is a list with just a single element, which is the text of the whole page. We need to split it into
meaningful parts, so we will use the `RecursiveCharacterTextSplitter` component. It will try to keep all paragraphs (and 
then sentences, and then words) together as long as possible, as those would generically seem to be the strongest 
semantically related pieces of text. The chunk size and overlap are both parameters that can be adjusted to fit the
specific use case.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=100)
split_documents = splitter.split_documents(documents)
```

Our documents might be now indexed, but we need to convert them into vectors. Let's configure the embeddings so the 
`cohere.embed-v4.0` is used. Not all the regions offer every model, so we need to specify the region where the models
are hosted. We will use the `us-chicago-1`, which serves both models used in this tutorial, but please check the
[models by region](https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-endpoint-regions.htm) and the
[model retirement dates](https://docs.oracle.com/en-us/iaas/Content/generative-ai/deprecating-on-demand.htm) for the
most up-to-date information.

```python
from langchain_oci import OCIGenAIEmbeddings

embeddings = OCIGenAIEmbeddings(
    model_id="cohere.embed-v4.0",
    service_endpoint="https://inference.generativeai.us-chicago-1.oci.oraclecloud.com",
    compartment_id=os.environ.get("COMPARTMENT_OCID"),
)
```

Now we can embed the documents and store them in Qdrant. We will create an instance of `QdrantVectorStore` and add the
split documents to the collection.

```python
from langchain_qdrant import QdrantVectorStore

vector_store = QdrantVectorStore(
    client=client,
    collection_name="oracle-cloud-website",
    embedding=embeddings,
)

vector_store.add_documents(split_documents, batch_size=20)
```

Our documents should be now indexed and ready for searching. Let's move to the next step.

### Speaking to the website

The intended method of interaction with the website is through the chatbot. Large Language Model, in our case [Cohere
Command A](https://cohere.com/command), will be answering user's questions based on the relevant documents that Qdrant
will return using the question as a query. Our LLM is also hosted on OCI, so we can access it similarly to the embedding
model:

```python
from langchain_oci import ChatOCIGenAI

llm = ChatOCIGenAI(
    model_id="cohere.command-a-03-2025",
    service_endpoint="https://inference.generativeai.us-chicago-1.oci.oraclecloud.com",
    compartment_id=os.environ.get("COMPARTMENT_OCID"),
    model_kwargs={"temperature": 0, "max_tokens": 500},
)
```

Connection to Qdrant might be established in the same way as we did during the indexing process. We turn the vector
store into a retriever and compose a retrieval chain from it, which implements the question-answering process: the
retriever finds the most relevant chunks for the question, and the LLM answers based on them. The prompt instructs the
model to rely on the provided context only.

```python
from operator import itemgetter

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

retriever = vector_store.as_retriever(search_kwargs={"k": 4})

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the user's question using only the provided context. "
            "If the context does not contain the answer, say that you don't know.\n\n"
            "<context>\n{context}\n</context>",
        ),
        ("human", "{input}"),
    ]
)


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


retrieval_qa_chain = RunnablePassthrough.assign(
    context=itemgetter("input") | retriever,
).assign(
    answer=(
        RunnablePassthrough.assign(context=lambda x: format_docs(x["context"]))
        | prompt
        | llm
        | StrOutputParser()
    ),
)
response = retrieval_qa_chain.invoke({"input": "What is the Oracle Cloud Free Tier?"})
```

The output of the `.invoke` method is a dictionary with the question, the answer, and the source documents used to
generate the response. The source documents might be useful for debugging or for further processing.

```python
print(response["answer"])

for doc in response["context"]:
    print(doc.metadata["source"], doc.page_content)
```

The response has the following structure:

```python
{
    'input': 'What is the Oracle Cloud Free Tier?',
    'context': [
        Document(
            metadata={
                'source': 'https://www.oracle.com/cloud/free/faq/',
                'title': "FAQ on Oracle's Cloud Free Tier",
                'language': 'en-US',
                '_id': 'dc291430-ff7b-4181-944a-39f6e7a0de69',
                '_collection_name': 'oracle-cloud-website'
            },
            page_content='Oracle Cloud Free Tier allows you to sign up for an Oracle Cloud account which provides ...'
        ),
        # ... three more documents
    ],
    'answer': 'Oracle Cloud Free Tier gives you access to Always Free services and a Free Trial ...'
}
```

#### Other experiments

Asking the basic questions is just the beginning. What you want to avoid is a hallucination, where the model generates
an answer that is not based on the actual content. Our prompt tells the model to answer from the retrieved context only
and to admit when the answer is missing, but you might still want to check it. Let's ask a question that is not
directly answered on the FAQ page:

```python
response = retrieval_qa_chain.invoke({
    "input": "Is Oracle Generative AI Service included in the free tier?"
})
print(response["answer"])
```

A well-grounded answer says that the FAQ page does not mention the Generative AI Service explicitly, instead of
inventing a yes or no. If the model makes up details that are not in `response["context"]`, tighten the system prompt
or retrieve more chunks by increasing `k`.

## Wrapping up

This tutorial has shown how to integrate Cohere's language models with Qdrant to enable natural language search on your
website. We have used LangChain as an orchestrator, and everything was hosted on Oracle Cloud Infrastructure (OCI).
Real world would require integrating this mechanism into your organization's systems, but we built a solid foundation
that can be further developed.
