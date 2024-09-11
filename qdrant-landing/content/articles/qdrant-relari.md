---
title: "Qdrant<>Relari: Best Practices for a Data-driven Approach to Building RAG systems"
short_description: "Improve RAG systems by combining Qdrant's storage with Relari's evaluation tools for better performance and user experience."
description: How does Top-K and Auto Prompt Optimization improve RAG systems?
preview_dir: /articles_data/qdrant-relari/preview

social_preview_image: /articles_data/quantum-quantization/social_preview.png
small_preview_image: /articles_data/quantum-quantization/icon.svg
weight:
author: Thierry Damiba
author_link: https://x.com/thierrypdamiba
date: 2024-09-09T10:00:00+01:00
draft: false
keywords: evaluation, top k, prompt
---

# Qdrant<>Relari: Best Practices for a Data-driven Approach to Building RAG Systems

---

>Good RAG application evaluation is what separates successful AI companies from companies burning through market capital and not finding Product/Market fit. Finding a framework for evaluation is challenging for builders due to the nature of LLMs.
At Qdrant we recognized this issue so we partnered with Relari to demonstrate an evaluation process to help your app succeed. Qdrant handles the storage and retrieval of data and with Relari you can run experiments on your RAG App to find out how your app performs in the real world. When you combine the two you can test and evaluate your model as fast as you can build.

This blog is a companion to the Relari<>Qdrant Notebook below. I will walk you through a case study using the Gitlab legal policies dataset. 
https://colab.research.google.com/drive/1p6bF15ZWI7qVEh-b_7YGt1n1UwF3QAqd


You can substitute this with your own dataset and follow along by signing up for an account at https://cloud.qdrant.io/ and https://www.relari.ai/ 

---

When you think of the typical RAG (Retrieval-Augmented Generation) application, it is usually difficult to pinpoint a metric for measurement. Consider an app like ChatGPT: How does OpenAI know if their app is functioning properly? More importantly, how can they measure its performance?


![How a RAG works](/articles_data/what-is-rag-in-ai/how-rag-works.jpg)

At first, you might think accuracy is the right metric. We could measure how often ChatGPT is accurate compared to other models or previous versions, and if it is more accurate, it must be performing better. This seems logical at first, but deeper examination reveals issues with this approach. 

What if someone asks ChatGPT a subjective question, like "What’s the best movie ever made?" You could use IMDB ratings as a guide, but what if your target audience is horror enthusiasts? They wouldn't care that _Forrest Gump_ is highly rated.

![Forrest Gump](/articles_data/qdrant-relari/gump.webp)

You might instead approach the problem with a product mindset, focusing on how responses affect user churn. However, in some applications, such as medical assistants, you wouldn’t want an inaccurate app that simply doesn’t churn users.

The reality is that no single evaluation method can fully capture how to build and monitor a production-grade application. With LLMs (Large Language Models), there is often confusion around evaluation methods and tracking performance. Many applications face the challenge of determining how to measure performance.

We recently partnered with **Relari** for a webinar discussing the best methods for building and evaluating RAG systems. Relari is a toolkit designed for improving LLM applications using both intrinsic and extrinsic evaluation methods. Paired with **Qdrant**, which efficiently stores large amounts of data, Relari provides a comprehensive evaluation framework.

In this blog post, I’ll cover two evaluation methods you can use with Qdrant and Relari and highlight some use cases for each.

## Evaluation Metrics: Top-K and Auto Prompt Optimization

When evaluating a RAG system, optimizing how the model performs in real-world situations is crucial. Traditional metrics like precision, recall, and rank-aware methods are useful but can only go so far. Two impactful strategies for holistic evaluation are **Top-K Parameter Optimization** and **Auto Prompt Optimization**. These methods enhance the likelihood that your model performs optimally with real users.

### Top-K Parameter Optimization

![Forrest Gump](/articles_data/qdrant-relari/homer.webp)


The **Top-K** parameter determines how many top results are shown to a user. Imagine using a search engine that returns only one result each time. While that result may be good, most users prefer more options. However, too many results can overwhelm the user.

For example, in a product recommendation system, the Top-K setting will determine how many items a user sees—whether it's the top 3 best-sellers or 10 options. Adjusting this parameter ensures the user has enough relevant choices without feeling lost.

With Relari and Qdrant, experimenting with different Top-K values is simple. First, we will set up our environment, then we'll build a simple RAG app. Finally, I'll show you have to use Relari for evaluation.


**1. Get API key for Qdrant and Relari and add it to the notebook as secrets**

Head over to https://cloud.qdrant.io/ and https://www.relari.ai/ to sign up for a Qdrant and Relari API key.

Once you have your API key, add it to your secrets on Google Colab.

**2. Run these commands in your notebook to install the neccesary libraries for the notebook: Qdrant, FastEmbed, Relari, and Langchain**

```python
!pip install relari langchain_community  langchain_qdrant 
!pip install unstructured rank_bm25
!pip install --upgrade nltk
```
**3. Configure your environment variables in Colab**
```python
from google.colab import userdata
import os

os.environ['RELARI_API_KEY'] = userdata.get('RELARI_API_KEY')
os.environ['OPENAI_API_KEY'] = userdata.get('OPENAI_API_KEY')
```

**4. Instantiate the Relari Client**

```python
from relari import RelariClient
client = RelariClient()
```

**5. Create a new Relari Project**
```python
= client.projects.create(name="Gitlab Employee Assistant")
```

**6. Define golden dataset**
![French Cafe](/articles_data/qdrant-relari/cafe.jpg)

For this case study we'll be using the Gitlab legal policies dataset, but feel free to replace this with your own dataset. 
Datasets are essential in Relari's approach to evaluate and improve LLM applications. The data is used as ground-truth (or in other words as reference) to test an LLM application pipeline. Learn more about Relari's data-driven approach [here](https://docs.relari.ai/getting-started/datasets/intro).

```python
!wget https://ceevaldata.blob.core.windows.net/examples/gitlab/gitlab_legal_policies.zip
!unzip gitlab_legal_policies.zip -d gitlab_legal_policies
```

Once we have our data downloaded we can run the command below to create the golden dataset. The golden dataset will act as our test dataset or ground truth for evaluation.

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

You will receive an email from Relari once the Golden dataset is ready. You can check the dataset out in the Relari UI. Here is what it will look like. 

![GoldenUI](/articles_data/qdrant-relari/golden.png)

You can also upload your dataset and generate the dataset directly on the Relari UI.
![Upload UI](/articles_data/qdrant-relari/uploadui.png)

![Golden on UI](/articles_data/qdrant-relari/goldenui.png)


**7. Build a simple rag app**

Now that we have our data, evaluation dataset, and relari project setup-let's build a RAG application to evaluate. We'll be using Qdrant, FastEmbed, and Langchain.

First we need to import all the libraries we will need

```python
from langchain_community.document_loaders.directory import DirectoryLoader
from langchain_qdrant import Qdrant
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from relari.core.types import DatasetDatum
```

Then we will use langchain to load and chunk our data.
```python
# load the document and split it into chunks
loader = DirectoryLoader("gitlab_legal_policies/")
documents = loader.load_and_split()
```
Next we'll use FastEmbed, Qdrant's built in Embedding provider to embed our chunks.
```python
# Initialize FastEmbedEmbeddings
embeddings = FastEmbedEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",  # specify the model
)
```
Finally we'll upload the chunks into a Qdrant collection.
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
If you're using the Gitlab dataset-you should have 66 chunks.

Once we've uploaded our data we'll build a function to run different RAG pipelines over the dataset and log the results. 
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
This is the power of combining Qdrant and Relari. Instead of having to build multiple applications, slowly upsert and retrieve data you can use Qdrant and Relari to quickly test different parameters and instantly get results. We present an evaluation system that is built for fast, useful iteration and desinged to help you find product market fit.

---

Now that we have our application built, let's explore how to evaluate Top K.

**1. Run an experiment with Top K, meaning results shown to user will vary between 3, 5, 7, and 9.**
```python
k_values = [3, 5, 7, 9] # Define the different values of top k to experiment

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

**2. Submit the results to Relari for evaluation. Realri will run Precision/Recall and Rank Aware metrics on your results. You can benchmark different results in the UI.**
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
Here we can see that with our dataset-if we want the recall to be greater than 85%, we should pick a K of atleast 7.

![French Cafe](/articles_data/qdrant-relari/topk.png)

We can even look at individual cases in the UI to get more insigh into why our retriever failed.

![French Cafe](/articles_data/qdrant-relari/topk2.png)

Relari and Qdrant can combine to evaluate your Hybrid search too. With this information you can do further tweaks to the parameter or try a different RAG architecture to select the best performaning strategies on your dataset.


### Auto Prompt Optimization

![French Cafe](/articles_data/qdrant-relari/apo.png)


In conversational applications like chatbots, **Auto Prompt Optimization** improves the app’s ability to communicate. This technique adapts the chatbot's responses over time, learning from past interactions to adjust phrasing for better results.

For example, in a customer service chatbot, the phrasing of questions can significantly affect user satisfaction. Consider ordering in French vs. English in a Parisian cafe—the same information may be transmitted, but it will be received differently. 

![French Cafe](/articles_data/qdrant-relari/cafe.jpg)

Auto Prompt Optimization continuously refines the chatbot’s responses to improve user interactions. Here's how you can implement it with Relari:

Now let's walk through APO


**1. Set up your base prompt.**
With Auto Prompt Optimization you can define a system prompt and inspect the results at every iteration of the interaction.

```python
from relari.core.types import Prompt, UserPrompt

base_prompt = Prompt(
    system="You are a gitlab legal policy Q&A bot. Answer the following question given the context.",
    user=UserPrompt(
        prompt="Question: $question\n\nContext:\n$ground_truth_context",
        description="Question and context to answer the question.",
    ),
)
```
**2. Set up your task ID.**
```python
ask_id = client.prompts.optimize(
    name="Gitlab Legal Policy RAG Prompt",
    project_id=proj["id"],
    dataset_id=dataset_info["id"],
    prompt=base_prompt,
    llm="gpt-4o-mini",
    task_description="Answer the question using the provided context.",
    metric=client.prompts.Metrics.CORRECTNESS,
)
print(f"Optimization task submitted with ID: {task_id}")

```
**3. Explore prompt at each iteration in the UI.**

![French Cafe](/articles_data/qdrant-relari/apo1.png)


The Optimal **System Prompt** and **Few Shot Examples** could then be taken to insert into your RAG system.

---

Combining **Relari** and **Qdrant** allows you to create an iterative, data-driven evaluation framework, improving your RAG system for optimal real-world performance. 

Get started today for **free** by signing up for an account at https://cloud.qdrant.io/ and https://www.relari.ai/ 
