---
title: "How to choose an embedding model"
short_description: "There is no one-size-fits-all solution when it comes to embedding models. Learn how to choose the right one for your use case."
description: "Building proper search requires selecting the right embedding model for your specific use case. This guide helps you navigate the selection process based on performance, cost, and other practical considerations."
preview_dir: /articles_data/how-to-choose-an-embedding-model/preview
social_preview_image: /articles_data/how-to-choose-an-embedding-model/social-preview.png
author: Kacper Łukawski
author_link: https://www.kacperlukawski.com
date: 2025-05-07T00:00:00.000Z
category: vector-search-manuals
---

No matter if you are just beginning your journey in the world of vector search, or you are a seasoned practitioner, you 
have probably wondered how to choose the right embedding model to achieve the best search precision. There are some
public benchmarks, such as [MTEB](https://huggingface.co/spaces/mteb/leaderboard), than can help you narrow down the 
options, but datasets used in those benchmarks will rarely be representative of your domain specific data. Moreover, 
search precision is not the only requirement you could have. For example, some of the best models might have amazing 
quality for retrieval, but you can't afford to run them, e.g., due to high resource usage and/or your budget 
constraints.

<aside role="status">
Although this article focuses mostly on the dense text embedding models, most of the considerations are also valid for 
sparse and multivector representations, but also different modalities.
</aside>

Selecting the best embedding model is a multi-objective optimization problem and there is no one-size-fits-all solution
and there probably never will be. In this article, we will try to provide some guidance on how to approach this problem
in a practical way, and how to move from model selection to running it in production.

## Evaluation: the holy grail of vector search

You can't improve what you don't measure. It's cliché, but it's true also for retrieval. Search quality might and should
be measured not only in a running system, but also before you make the most important decision - which embedding model 
to use. 

### Know the language your model speaks

Embedding models are trained with specific languages in mind. When evaluating one, consider whether it supports all the 
languages you have or predict to have in your data. If your data is not homogenous, you might require a multilingual 
model that can properly embed text across different languages. If you use Open Source models, then your model is likely
documented on Hugging Face Hub. For example, the popular in demos `all-MiniLM-L6-v2` was trained on English data only, 
so it's not a good choice if you have data in other languages.

[![all-MiniLM-L6-v2 on Hugging Face Hub](/articles_data/how-to-choose-an-embedding-model/hf-model-card.png)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

However, it's not only about the language, but also about how the model treats the input data. Surprisingly, this is 
often overlooked. Text embedding models use a specific tokenizer to chunk the input data into pieces, and then starts 
all the Transformer magic with assigning each token a specific input vector representation. 

![An example of tokenization with WordPiece tokenizer](/articles_data/how-to-choose-an-embedding-model/tokenization-example.png)

One of the effects of such inner workings is that the model can only understand what its tokenizer was trained on (yes, 
tokenizers are also trainable components). As a result, any characters it hasn't seen during the training will be 
replaced with a special `UNK` token. If you analyze social media data, then you might be surprised that two 
contradicting sentences are actually perfect matches in your search.

![Tokenization: The weather today is so 🌧️ vs The weather today is so 🌞](/articles_data/how-to-choose-an-embedding-model/tokenization-contradictions.png)

The same may go for accented letters, different alphabets, etc. However, in that case you shouldn't be using such 
a model in the first place, as it does not support the target language either way. Tokenization has a bigger impact on
the quality of the embeddings, than many people think. If you want to understand what are the effects of tokenization,
we recommend you to take the course on [Retrieval Optimization: From Tokenization to Vector 
Quantization](https://www.deeplearning.ai/short-courses/retrieval-optimization-from-tokenization-to-vector-quantization/)
we recorded together with DeepLearning.AI.

<div style="text-align: center;">
<iframe width="560" height="315" src="https://www.youtube.com/embed/AE8i69Kcodc?si=IdTEKlUHVbGzgJD-" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>
<br>

How do you know if the tokenizer supports the target language? That's pretty easy for the Open Source models, as you 
can just run the tokenizer without the model and see how the yielded tokens look like. For the commercial models that 
might be slightly harder, but companies like OpenAI and Cohere are transparent about it and open source their 
tokenizers. In the worst case, you can just modify some of the suspected tokens and see how the model reacts in terms
of the similarity between the original and modified text.

### Checklist of things to consider

Nevertheless, the evaluation does not focus on the input tokens only. First and foremost, we should measure how well
a particular model can handle the task we want to use it for. Vector embeddings are multipurpose tools, and some of the
models might be more suitable for **semantic similarity**, while others might be better for **retrieval** or **question 
answering**. Nobody, except you, can tell what's the nature of the problem you are trying to solve. Type of the task is 
not the only thing you should consider when choosing the right embedding model, but there is more to it, e.g.:

- **Sequence length** - embedding models are Transformer-based, and they also have a limited size of input they can 
  process at a time. You don’t expect the meaning of a whole book to be compressed to a single vector with even 8192
  dimensions, do you? You’d better check how long the documents you want to embed are and how many tokens they contain. 
  You see? That’s another time when the tokenizer can mess things up.
- **Model size** - the bigger the model, the more parameters it has, and the more memory it requires to store them. 
  However, the model's size is not the only thing that matters. The inference time also depends on the model 
  architecture and your hardware. Many models are more suitable for running on GPUs, while others are better for CPUs. 
  The more complex the model, the higher the inference cost. Maybe your infrastructure won’t allow you to run a specific 
  model efficiently, and it’s better to choose a smaller one, even if it’s not the best one?
- **Optimization support** - there are plenty of optimization in vector search, but not all the models are compatible.
  For example, if you want to use Binary Quantization, then you need to make sure that the model you are using is 
  compatible with it with minimal loss in accuracy. Matryoshka embeddings are another example of a technique that 
  requires specific model training procedure to be effective.

The list is not exhaustive, as there might be plenty of other things to consider, but you get the idea.

That's why you need to precisely define the task you really want to solve, get your hands dirty with the data the system
is supposed to process and build a ground truth dataset for it, so you can make an informed decision.

### Building the ground truth dataset

The way your dataset will look like depends on the task you want to evaluate. If we speak about semantic similarity,
then you will need pairs of texts with a score indicating how similar they are. 

For semantic similarity tasks, your dataset might look like this:

```json
[
  {
    "text1": "I love this movie, it's fantastic",
    "text2": "This film is amazing, I really enjoyed it",
    "similarity_score": 0.92
  },
  {
    "text1": "The weather is nice today",
    "text2": "I need to buy groceries",
    "similarity_score": 0.12
  }
]
```

Most typically, Qdrant users build some retrieval systems which they use alone, or combined with Large Language Models
to build Retrieval Augmented Generation. That means we need a slightly different structure of the golden dataset. The
problem of retrieval is to find the `K` most relevant documents for a given query. Therefore, we need a set of queries
and a set of documents that we would expect to receive for each of them. There are also three different ways of how to
define the relevancy (sorted from the least to the most strict):

1. **Binary relevancy** - a document is either relevant or not.
2. **Ordinal relevancy** - a document can be more or less relevant (ranking).
3. **Relevancy with a score** - a document can have a score indicating how relevant it is.

```json
[
  {
    "query": "How do vector databases work?",
    "relevant_documents": [
      {
        "id": "doc_123",
        "text": "Vector databases store and index vector embeddings...",
        "relevance": 3  // Highly relevant (scale 0-3)
      },
      {
        "id": "doc_456",
        "text": "The architecture of modern vector search engines...",
        "relevance": 2  // Moderately relevant
      }
    ]
  },
  {
    "query": "Python code example for Qdrant",
    "relevant_documents": [
      {
        "id": "doc_789",
        "text": "```python\nfrom qdrant_client import QdrantClient\n...",
        "relevance": 3  // Highly relevant
      }
    ]
  }
]
```

Once you have the dataset, you can start evaluating the models using one of the evaluation metrics, such as 
`precision@k`, `MRR`, or `NDCG`. There are existing libraries, such as [ranx](https://amenra.github.io/ranx/) that can 
help you with that. Running the evaluation process on various models is a good way to get a sense of how they perform
on your data. You can test even proprietary models that way. However, it's not the only thing you should consider when 
choosing the best model.

Please do not be afraid of building your evaluation dataset. It’s not as complicated as it might seem, and it's a 
critical step! You don’t need millions of samples to get a good idea of how the model performs. A few hundred 
well-curated samples are usually enough. Even dozens of samples are better than nothing!

## Compute resource constraints

Even if you found the most precise embedding model for your domain, that doesn't mean you can use it. Software projects 
do not live in isolation, and you have to consider the bigger picture. For example, you might have budget constraints 
that limit your choices. It's also about being pragmatic. If you have a model that is 1% more precise, but it's 10 times 
slower and consumes 10 times more resources, is it really worth it?

Eventually, enjoying the journey is more important than reaching the destination in some cases, but that doesn't hold 
true for search. The simpler and faster the means that took you there, the better.

## Throughput, latency and cost

When selecting an embedding model for production, you need to consider three critical operational factors:

1. **Throughput**: How many embeddings can you generate per second? This directly impacts your system's ability to 
   handle load. Larger models typically have lower throughput, which might become a bottleneck during data ingestion or 
   high-traffic periods.
2. **Latency**: How quickly can you get a single embedding? For real-time applications like search-as-you-type or 
   interactive chatbots, low latency is crucial. Quantized versions of larger models can offer significant latency 
   improvements.
3. **Cost**: This includes both infrastructure costs (CPU/GPU resources, memory) and, for API-based models, per-token or 
   per-request charges. For example, running your own model might have higher upfront costs but lower per-request costs,
   than some SaaS models.

The right balance depends on your specific use case. A news recommendation system might prioritize throughput for 
processing large volumes of articles in real-time, while a website search might prioritize latency for real-time
results. Similarly, a chatbot using a Large Language Model to generate a response might prioritize cost-effectiveness, 
as LLMs are often slower and retrieval isn't the most time-consuming part of the process.

## Balancing all aspects

After all these considerations, you should have a table that summarizes each of the models you evaluated under all the 
different conditions. Now things are getting hard and answers are not obvious anymore.

Here's an example of how such a comparison table might look:

| Model                            | Precision@10 | MRR  | Inference Time | Memory Usage | Cost           | Multilingual               | Max Sequence Length |
|----------------------------------|--------------|------|----------------|--------------|----------------|----------------------------|---------------------|
| expensive-proprietary-saas-only  | 0.92         | 0.87 | API-dependent  | N/A          | $0.25/M tokens | Probably, yet undocumented | 8192                |
| cheaper-proprietary-multilingual | 0.89         | 0.84 | API-dependent  | N/A          | $0.01/M tokens | Yes (94 languages)         | 4096                |
| open-source-gpu-required         | 0.88         | 0.83 | 120ms          | 15GB         | Self-hosted    | English                    | 1024                |
| open-source-on-cpu               | 0.85         | 0.79 | 30ms           | 120MB        | Self-hosted    | English                    | 512                 |

The decision process should be guided by your specific requirements. Organization struggling with budget constraints 
might lean towards self-hosted options, while the ones who prefer to avoid dealing with infrastructure management
might prefer API-based solutions. Who knows? Maybe your project does not require the highest precision possible, and a 
smaller model will do the job just fine.

![Fast, precise, cheap - pick two](/articles_data/how-to-choose-an-embedding-model/pyramid.png)

Remember that this doesn't have to be a one-time decision. As your application evolves, you might need to revisit your 
choice of embedding model. Qdrant's architecture makes it relatively easy to migrate to a different model if needed, or
to extend the system with multiple models and switch between them based on the query, or build a hybrid search that
takes advantage of different models or more complex search pipelines.

An important decision to make is also where to host the embedding model. Maybe you prefer not to deal with the 
infrastructure management and send the data you process in its original form? Qdrant now has something for you!

## Locally sourced embeddings

Wouldn't it be great to run your selected embedding model as close to your search engine as possible? Network latency 
might be one of the biggest enemies, and transferring millions of vectors over the network may take longer if done from
a distant location. Moreover, some of the cloud providers will charge you for the data transfer, so it's not only about
the latency, but also about the cost.

**Qdrant's Cloud Inference** solves these problems by allowing you to run the embedding model next to the cluster where 
your vector database is running. It's a perfect solution for those who want not to worry about the model inference and 
just use search that works on the data they have. Check out the [Cloud Inference 
documentation](/#cloud-inference-documentation) to learn more.

[//]: # (TODO: add a correct link to the documentation above)