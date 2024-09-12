---
draft: false
title: The Golden Dataset - Best Practices in Data-Driven RAG Evaluation 
short_description: "Transforming customer service in finance and insurance with vector search-based retrieval.</p>"
description: “Learn how Qdrant and Relari enhance RAG systems with vector search and data-driven evaluation for faster responses and improved operational efficiency.”
preview_image: /blog/qdrant-relari/preview.png
social_preview_image: /blog/qdrant-relari/preview.png
date: 2024-08-28T00:02:00Z
author: Qdrant
featured: false
tags:
  - Qdrant
  - Relari
  - Vector Search
  - Rag Evaluation
  - Top-K Parameter Optimization
  - Auto Prompt Optimization
---

# Evaluating RAG Through Performance Metrics

Evaluating RAG application performance can be challenging for developers. At Qdrant, we’ve addressed this by working with Relari to offer an evaluation process that takes a thorough look at application performance. In this combination, Qdrant manages data storage and retrieval, while Relari lets you run experiments to assess your RAG app’s real-world performance. Together, they enable fast, iterative testing and evaluation to keep pace with your development.

## In this blog

In a recent webinar with [Relari](https://www.relari.ai), we explored the best methods for building and evaluating RAG systems. Relari offers tools to enhance LLM applications through intrinsic and extrinsic evaluations. Combined with Qdrant's efficient data storage, it provides a robust evaluation framework. In this post, I’ll outline two evaluation methods you can use with Qdrant and Relari, and show practical use cases.

In this blog, we will guide you through a sample use case analyzing the GitLab legal policies dataset.
The code for this exercise can be run from a [Google Colab Notebook](https://colab.research.google.com/drive/1p6bF15ZWI7qVEh-b_7YGt1n1UwF3QAqd). 

## Target metrics for RAG evaluation: Top-K and Auto Prompt Optimization

When evaluating a RAG system, optimizing how the model performs in real-world situations is crucial. Traditional metrics like precision, recall, and rank-aware methods are useful, but they can only go so far. Two impactful strategies for holistic evaluation are **Top-K Parameter Optimization** and **Auto Prompt Optimization**. These methods increase the likelihood that your model performs optimally with real users.

### Top-K Parameter Optimization

The **Top-K** parameter determines how many top results are shown to a user. Imagine using a search engine that returns only one result each time. While that result may be good, most users prefer more options. However, too many results can overwhelm the user.

For example, in a product recommendation system, the Top-K setting determines how many items a user sees—whether it's the top 3 best-sellers or 10 options. Adjusting this parameter ensures the user has enough relevant choices without feeling lost.

With Relari and Qdrant, experimenting with different Top-K values is simple. First, we will build a simple RAG app with Qdrant. Then, we will use Relari for evaluation.

### Implementation

Head over to [Qdrant Cloud](https://cloud.qdrant.io) and [Relari](https://www.relari.ai) to sign up for Qdrant and Relari API keys. Once you have your API keys, add them to your secrets in Google Colab.

#### Install dependencies

In this case, we will use Qdrant, FastEmbed, Relari, and LangChain**

```python
!pip install relari langchain_community langchain_qdrant 
!pip install unstructured rank_bm25
!pip install --upgrade nltk
```

#### Setup the environment

```python
from google.colab import userdata
import os

os.environ['RELARI_API_KEY'] = userdata.get('RELARI_API_KEY')
os.environ['OPENAI_API_KEY'] = userdata.get('OPENAI_API_KEY')
```

### Set up Relari

```python
from relari import RelariClient
client = RelariClient()
```

#### Create a new Relari Project

```python
proj = client.projects.create(name="Gitlab Employee Assistant")
```

#### Define the Golden Dataset

For this case study, we'll be using the GitLab legal policies dataset, but feel free to replace this with your own dataset. Datasets are essential to Relari's approach to evaluate and improve LLM applications. The data is used as ground truth (or reference) to test an LLM application pipeline. Learn more about Relari's data-driven approach [here](https://docs.relari.ai/getting-started/datasets/intro).

```python
!wget https://ceevaldata.blob.core.windows.net/examples/gitlab/gitlab_legal_policies.zip
!unzip gitlab_legal_policies.zip -d gitlab_legal_policies
```

Once we have our data downloaded, we can run the command below to create the golden dataset. The golden dataset will act as our test dataset or ground truth for evaluation.

```python
from pathlib import Path

dir = Path("gitlab_legal_policies")
task_id = client.synth.new(
    project_id=proj["id"],
    name="Gitlab Legal Policies",
    samples=30,
    files=list(dir.glob("*.txt")),
)
```
<aside role="status">
You will receive an email from Relari once the golden dataset is ready. You can check the dataset out in the Relari UI.
</aside>

### Build a simple RAG app

Now that we have the project set up, let’s build a RAG application to evaluate. We’ll be using Qdrant, FastEmbed, and LangChain.

#### Import all libraries

```python
from langchain_community.document_loaders.directory import DirectoryLoader
from langchain_qdrant import Qdrant
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from relari.core.types import DatasetDatum
```

### Load and chunk data

We will use LangChain to prepare our data.

```python
# load the document and split it into chunks
loader = DirectoryLoader("gitlab_legal_policies/")
documents = loader.load_and_split()
```

Now we’ll use FastEmbed, Qdrant's built-in embedding provider, to embed our chunks.

```python
# Initialize FastEmbedEmbeddings
embeddings = FastEmbedEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",  # specify the model
)
```

### Store data in Qdrant

Finally, we'll upload the chunks into a Qdrant collection.

```python
# Load chunks into a Qdrant Cloud vectorstore using FastEmbedEmbeddings
db = Qdrant.from_documents(
    documents,
    embedding=embeddings,
    url=os.environ['QDRANT_URL'],  # Qdrant Cloud URL
    api_key=os.environ['QDRANT_API_KEY'],  # Qdrant Cloud API Key
    collection_name="gitlab_legal_policies",
)
print(f"{len(documents)} chunks loaded into Qdrant Cloud vector database.")
```
<aside role="status">
If you're using the GitLab dataset, you should have 66 chunks.
</aside>

### Start logging results

Once we've uploaded our data, we'll build a function to run different RAG pipelines over the dataset and log the results.

```python
# Prepare a function to run different RAG pipelines over the dataset and log the results
def log_retriever_results(retriever, dataset):
  log = list()
  for datum in dataset.data:
      # First compute the result
      retrieved_docs = retriever.invoke(datum["question"])
      # Now log the result in Relari format
      result = DatasetDatum(
          label=datum["uid"],
          data={"retrieved_context": [doc.page_content for doc in retrieved_docs]},
      )
      log.append(result)
  return log
```

This is the power of combining Qdrant and Relari. Instead of having to build multiple applications, slowly upsert, and retrieve data, you can use both to quickly test different parameters and instantly get results. This evaluation system is built for fast, useful iteration.

### Evaluate results

Now that we have our application built, let's explore how to evaluate Top-K.

#### First attempt

Run an experiment with Top-K, meaning results shown to users will vary between 3, 5, 7, and 9.

```python
k_values = [3, 5, 7, 9]  # Define the different values of top k to experiment

semantic_retrievers = {}
semantic_logs = {}

# Run the retrievers on the dataset and log retrieved chunks
for k in k_values:
    retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": k})
    log = log_retriever_results(retriever, dataset)

    semantic_retrievers[f"k_{k}"] = retriever
    semantic_logs[f"k_{k}"] = log
    print(f"Results on {dataset.name} by Semantic Retriever with k={k} saved!")
```

#### Send results to Relari

Submit the results to Relari for evaluation. Relari will run Precision/Recall and Rank-Aware metrics on your results. You can benchmark different results in the UI.

```python
from relari import Metric

for k in k_values:
    eval_name = f"Semantic Retriever Evaluation k={k}"
    eval_data = semantic_logs[f"k_{k}"]

    eval_info = client.evaluations.submit(
        project_id=proj["id"],
        dataset=dataset_info["id"],
        name=eval_name,
        pipeline=[Metric.PrecisionRecallF1, Metric.RankedRetrievalMetrics],
        data=eval_data,
    )
    print(f"{eval_name} submitted!")
```

In this example, we can see that with our dataset, if we want the recall to be greater than 85%, we should pick a K value of at least 7.

![Top K](/blog/qdrant-relari/topk.png)

We can even look at individual cases in the UI to get more insight into why our retriever failed.

![Top K UI](/blog/qdrant-relari/topk2.png)

Relari and Qdrant can also be combined to evaluate your hybrid search. With this information, you can further tweak the parameter or try a different RAG architecture to select the best-performing strategies for your dataset.

## Auto Prompt Optimization

In conversational applications like chatbots, **Auto Prompt Optimization (APO)** improves the app’s ability to communicate. This technique adapts the chatbot's responses over time, learning from past interactions to adjust phrasing for better results.

For example, in a customer service chatbot, the phrasing of questions can significantly affect user satisfaction. Consider ordering in French versus English in a Parisian cafe—the same information may be transmitted, but it will be received differently.

![French Cafe](/blog/qdrant-relari/cafe.jpg)

Auto Prompt Optimization continuously refines the chatbot’s responses to improve user interactions. Here's how you can implement APO with Relari:

### Set up base prompt

With Auto Prompt Optimization, you can define a system prompt and inspect the results at every iteration of the interaction.

```python
from relari.core.types import Prompt, UserPrompt

base_prompt = Prompt(
    system="You are a GitLab legal policy Q&A bot. Answer the following question given the context.",
    user=UserPrompt(
        prompt="Question: $question\n\nContext:\n$ground_truth_context",
        description="Question and context to answer the question.",
    ),
)
```

#### Set up task id

```python
task_id = client.prompts.optimize(
    name="GitLab Legal Policy RAG Prompt",
    project_id=proj["id"],
    dataset_id=dataset_info["id"],
    prompt=base_prompt,
    llm="gpt-4o-mini",
    task_description="Answer the question using the provided context.",
    metric=client.prompts.Metrics.CORRECTNESS,
)
print(f"Optimization task submitted with ID: {task_id}")
```

#### Analyze prompts

Now you can explore prompts at each iteration in the UI.

![Prompt Iterations](/blog/qdrant-relari/apo1.png)

The optimal **System Prompt** and **Few-Shot Examples** can then be used in your RAG system to improve its performance.

## Conclusion

Combining **Relari** and **Qdrant** allows you to create an iterative, data-driven evaluation framework, improving your RAG system for optimal real-world performance. These methods help ensure that your application is both responsive and effective, especially when dealing with user queries or recommendations.

If you’d like to get started, sign up for **free** at [Qdrant Cloud](https://cloud.qdrant.io) and [Relari](https://www.relari.ai).

You can also substitute this dataset with your own by signing up for [Qdrant Cloud](https://cloud.qdrant.io) and [Relari](https://www.relari.ai).