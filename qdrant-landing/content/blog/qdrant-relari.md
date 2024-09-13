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

Evaluating RAG application performance can be frustrating for developers. A properly evaluated application retrieves and generates relevant information while minimizing irrelevant content. The goal is to balance signal and noise but finding that balance is challenging and time consuming. 

At Qdrant, we've addressed this challenge by working with Relari to offer some practical examples to tune your application in order to reach the right signal to noise ratio for your use case. Data driven application development leads to users who have a better experience, get better information, and are more likely to use your application in the future.

Qdrant manages data storage and retrieval, while Relari lets you run experiments to assess your RAG app’s real-world performance. Together, they enable fast, iterative testing and evaluation to keep pace with your development.

## In this blog

In a recent webinar with Relari, we explored the best methods for building and evaluating RAG systems. Relari offers tools to enhance LLM applications by combining a synthetic, Golden Dataset, and traditional Information Retrieval Metrics. With Qdrant, you can upload your data once and use the same code and collection from development to deployment for data management. Qdrant also offers Keyword, Semantic, and Hyrbid search, allowing you to evaluate different retrieval methods without additional libraries. 

In this blog, we will guide you through a sample use case analyzing the GitLab legal policies dataset. The code for this exercise can be run from a [Google Colab Notebook](https://colab.research.google.com/drive/1p6bF15ZWI7qVEh-b_7YGt1n1UwF3QAqd). 

## Target Metrics for RAG Evaluation: Retrieval and Generation

When evaluating a RAG system, focus on both retrieval and generation components for optimal real-world performance. Below, I’ll walk you through two methods for evaluating retrieval: Top-K Optimization and Retrieval Method Optimization. I’ll end by discussing one key evaluation method for generation: Auto Prompt Optimization (APO).

As I mentioned earlier, in RAG apps a key trade-off to consider is between noise and signal. Successful apps excel at balancing the amount of relevant information (signal) against irrelevant or distracting content (noise). In retrieval, this means maximizing relevant documents while minimizing irrelevant ones to avoid confusing the LLM. In generation, it's about ensuring that responses are clear and accurate without hallucinations, unnecessary information, or misleading content. 

The goal of data driven RAG evaluation is to continuously measure and improve both retrieval and generation by adjusting parameters like Top-K, retrieval methods, or prompt architecture.

As you make changes, your system's performance will evolve. Building a RAG system requires countless decisions, and while intuition plays a role, an automated evaluation system helps you iterate faster and make data-driven choices. By understanding the impact of each change in isolation, you gain full clarity over your model’s performance, allowing you to fail fast, refine quickly, and achieve better results.

## Retrieval: Top K and Retreival Method Optimization

For evaluating retrieval, there’s no need to reinvent the wheel. First, we can use well established metrics like precision and recall that already exist to measure information retreival systems. Second, we'll use a Golden Dataset, a synthetic dataset containing questions and answers from your dataset as the ground truth. When paired, we have a reliable system to evaluate how well your app is retrieving relevant information.


### 1. Optimizing Retrieval with Top-K

The Top-K parameter decides how many top results your retrieval system should return, impacting both recall and precision.

- **Recall** measures how well your system retrieves relevant documents.
**Focus on this first as poor recall will cause you application to miss important information.**

- **Precision** looks at how relevant the retrieved documents actually are. **Too many irrelevant documents can lead to a poor user experience.**

By fine-tuning Top K, you can strike a balance where the LLM has access to all relevant information without getting bogged down by irrelevant content. 

### 2. Experimenting with Retreival Methods

Testing different retrieval methods helps balance accuracy and relevance. Hybrid search combines semantic retrieval, which captures query meaning, with keyword-based search, which matches exact terms. This dual approach often improves performance by leveraging the strengths of semantic and keyword search.

Combining a keyword-based retriever with a semantic retriever can improve model performance as each method catches what the other might miss. With Qdrant you can iinterchange keyword, semantic, or hybrid retreivers seamlessly by changing a line of code.


## Generation: The Other Half of RAG

When you're satisfied with your retrieval, you can optimize your generation. Unlike retrieval, where you measure how many relevant documents are returned, generation focuses on the quality of responses, which is shaped by prompt phrasing. We can evaluate the performance of our application on the Golden dataset depending on the language of the prompt.

### 3. Enhancing Generation with Auto Prompt Optimization

Auto Prompt Optimization (APO) automatically fine-tunes prompts to improve the clarity and accuracy of the LLM's generated responses. By optimizing factors like phrasing and structure, APO eliminates the need for manual adjustments, making it easier to achieve better output quality. This streamlined approach makes your RAG system’s generation  precise and reliable, enhancing the overall performance and user experience without the time-consuming trial-and-error process.

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

![Top K](/articles_data/qdrant-relari/topk.png)

We can even look at individual cases in the UI to get more insight into why our retriever failed.

![Top K UI](/articles_data/qdrant-relari/topk2.png)

### Experiment with Hybrid Search

Combine keyword-based BM25 retrieval with semantic retrieval to create a hybrid search system:

**First build a keyword based retriever:**
```python
from langchain_community.retrievers import BM25Retriever

keyword_retriever = BM25Retriever.from_documents(documents)
keyword_log = log_retriever_results(keyword_retriever, dataset)
print(f"Results on {dataset.name} by Keyword Retriever saved!")

keyword_eval_info = client.evaluations.submit(
        project_id=proj["id"],
        dataset=dataset_info["id"],
        name="Keyword Retriever Evaluation",
        pipeline=[Metric.PrecisionRecallF1, Metric.RankedRetrievalMetrics],
        data=keyword_log,
    )
print(f"Keyword Retriever Evaluation submitted!")
```
**Then build a hybrid retriever:**
```python
from langchain.retrievers import EnsembleRetriever

# Build a hybrid retriever with equal weighting for
hybrid_retriever = EnsembleRetriever(
    retrievers=[keyword_retriever, semantic_retrievers["k_7"]], weights=[0.5, 0.5]
)

hybrid_log = log_retriever_results(hybrid_retriever, dataset)
print(f"Results on {dataset.name} by Hybrid Retriever saved!")


hybrid_eval_info = client.evaluations.submit(
        project_id=proj["id"],
        dataset=dataset_info["id"],
        name="Hybrid Retriever Evaluation",
        pipeline=[Metric.PrecisionRecallF1, Metric.RankedRetrievalMetrics],
        data=hybrid_log,
    )
print(f"Hybrid Retriever Evaluation submitted!")
```

Explore on results on the Relari UI:
![Relari UI Retreiver Comparison](/articles_data/qdrant-relari/hyrbid.png)

We can see that Keyword-based search  performs very well in a different way, and it is capturing cases where the semantic retriever is not.

The Hybrid retriever as a result has the highest Recall.

We can do further tweaks to the parameter or try a different RAG architectures to select the best performaning strategies on this dataset.

## Auto Prompt Optimization

In conversational applications like chatbots, **Auto Prompt Optimization (APO)** improves the app’s ability to communicate. This technique adapts the chatbot's responses over time, learning from past interactions to adjust phrasing for better results.

For example, in a customer service chatbot, the phrasing of questions can significantly affect user satisfaction. Consider ordering in French versus English in a Parisian cafe—the same information may be transmitted, but it will be received differently.

![French Cafe](/articles_data/qdrant-relari/cafe.jpg)

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

![Prompt Iterations](/articles_data/qdrant-relari/apo1.png)


The optimal **System Prompt** and **Few-Shot Examples** can then be used in your RAG system to improve its performance.

## Conclusion

Combining **Relari** and **Qdrant** allows you to create an iterative, data-driven evaluation framework, improving your RAG system for optimal real-world performance. With Qdrant you can use the same code and collection through the development process, and with Relari you can evaluate your application in real world scenarios.These methods help ensure that your application is both accurate and effective, especially when dealing with user queries or recommendations.

If you’d like to get started, sign up for **free** at [Qdrant Cloud](https://cloud.qdrant.io) and [Relari](https://www.relari.ai).

You can also substitute this dataset with your own by signing up for [Qdrant Cloud](https://cloud.qdrant.io) and [Relari](https://www.relari.ai).
