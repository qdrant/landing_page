---
title: "How to Choose an Embedding Model: Evaluation & Tradeoffs"
short_description: "There is no one-size-fits-all solution when it comes to embedding models. Learn how to choose the right one for your use case."
description: "Building proper search requires selecting the right embedding model for your specific use case. This guide helps you navigate the selection process based on performance, cost, and other practical considerations."
preview_dir: /articles_data/how-to-choose-an-embedding-model/preview
social_preview_image: /articles_data/how-to-choose-an-embedding-model/preview/social_preview.jpg
author: Kacper Łukawski
author_link: https://www.kacperlukawski.com
date: 2025-07-15T00:00:00.000Z
draft: false
weight: 10
aliases:
  - /articles/how-to-choose-an-embedding-model/
---

# How to Choose an Embedding Model: Evaluation & Tradeoffs

How do you choose the right embedding model to achieve the best search quality? There are some public benchmarks, such as [Massibe Text Embedding Benchmark(MTEB)](https://huggingface.co/spaces/mteb/leaderboard), that can help you narrow down the options, but datasets used in those benchmarks will rarely be representative of your domain-specific data. Moreover, search quality is not the only requirement you could have. Some of the best models might be amazingly accurate for retrieval, but you can't afford to run them, e.g., due to high resource usage or your budget constraints.

<aside role="status">
Although this guide focuses mostly on the dense text embedding models, most of the considerations are also valid for sparse and multivector representations, as well as different modalities.
</aside>

Selecting the best embedding model is a multi-objective optimization problem and there is no one-size-fits-all solution, and there probably never will be. In this guide, we will try to provide some guidance on how to approach this problem in a practical way, and how to move from model selection to running it in production.

## Evaluation: The Holy Grail of Vector Search

You can't improve what you don't measure. It's cliché, but it's true also for retrieval. Search quality might and should
be measured not only in a running system, but also before you make the most important decision - which embedding model 
to use. 

### Know the Language Your Model Speaks

Embedding models are trained with specific languages in mind. When evaluating one, consider whether it supports all the languages you have or predict to have in your data. If your data is not homogeneous, you might require a multilingual model that can properly embed text across different languages. If you use Open Source models, then your model is likely documented on [Hugging Face Hub](https://huggingface.co/docs/hub/en/index). For example, `all-MiniLM-L6-v2`, often used in demos, lists English as its language, so it's not a good choice if you have data in other languages.

[![Model card facts for all-MiniLM-L6-v2, highlighting English as its language](/articles_data/how-to-choose-an-embedding-model/hf-model-card.jpg)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

*Values from the Hugging Face model card, September 2026.*

However, it's not only about the language, but also about how the model treats the input data. Surprisingly, this is 
often overlooked. Text embedding models use a specific tokenizer to chunk the input data into pieces, and then [start 
all the Transformer magic with assigning each token a specific input vector 
representation](/articles/late-interaction-models/#understanding-embedding-models). 

![An example of tokenization with the all-MiniLM-L6-v2 WordPiece tokenizer](/articles_data/how-to-choose-an-embedding-model/tokenization-example.jpg)

One of the effects of such inner workings is that the model can only understand what its tokenizer was trained on ([yes, tokenizers are also trainable components](https://huggingface.co/learn/llm-course/chapter2/4#tokenizers)). WordPiece tokenizers, like the one in `all-MiniLM-L6-v2`, replace any word they can't build from their vocabulary with a single `[UNK]` token, so `hello🌞world` becomes one `[UNK]` and the model loses "hello" and "world" too. If you analyze social media data, you might be surprised that the two weather sentences in this example reach the model as identical tokens. Byte-level tokenizers, like the ones in OpenAI's `text-embedding-3` models and Qwen3-Embedding, never produce an unknown token: they split unfamiliar characters into bytes, so the two sentences stay different.

![Tokenization: The weather today is so 🌧️ vs The weather today is so 🌞](/articles_data/how-to-choose-an-embedding-model/tokenization-contradictions.jpg)

Normalization can also erase differences in your text. The `all-MiniLM-L6-v2` tokenizer lowercases text and strips accents, so "crème brûlée" and "creme brulee" reach the model as identical tokens and get identical vectors. Words that differ only by accents become indistinguishable. Tokenization has a bigger impact on the quality of the embeddings than many people think. If you want to understand what the effects of tokenization are, we recommend you take the course on [Retrieval Optimization: From Tokenization to Vector Quantization](https://www.deeplearning.ai/short-courses/retrieval-optimization-from-tokenization-to-vector-quantization/) we recorded together with DeepLearning.AI. You may find the course especially interesting if you still wonder why your semantic search engine can't handle numerical data, such as prices or dates, and what you can do about it.

How do you know how the tokenizer treats your text? That's pretty easy for the Open Source models, as you can just run the tokenizer without the model and see what the yielded tokens look like. Try your own text and look at normalization, `[UNK]` tokens, and how words split. Commercial models are harder to inspect. Some providers publish their tokenizers: OpenAI's embedding models use the `cl100k_base` encoding from the open-source [tiktoken](https://github.com/openai/tiktoken) library. For the others, modify some of the suspected characters and compare the similarity between the original and modified text.

![all-MiniLM-L6-v2 maps crème brûlée and creme brulee to identical tokens and identical vectors](/articles_data/how-to-choose-an-embedding-model/accented-letters.jpg)

Near-identical vectors for text that differs only in accents suggest that the tokenizer removes those accents. For `all-MiniLM-L6-v2`, both spellings produce `cr | ##eme | br | ##ule | ##e`, as the example shows.

### Checklist of Things to Consider

Nevertheless, the evaluation does not focus on the input tokens only. First and foremost, we should measure how well
a particular model can handle the task we want to use it for. Vector embeddings are multipurpose tools, and some models
might be more suitable for **semantic similarity**, while others for **retrieval** or **question answering**. Nobody, 
except you, can tell what's the nature of the problem you are trying to solve. Type of the task is not the only thing 
to consider when choosing the right embedding model:

- **Sequence length** - embedding models have a limited input size they can process at a time. Check how long your 
  documents are and how many tokens they contain. If you use Open Source models, you can check the maximum sequence 
  length in the model card on Hugging Face Hub. For commercial models, it's better to ask the provider directly.
- **Model size** - larger models have more parameters and require more memory. Inference time also depends on model 
  architecture and your hardware. Some models run effectively only on GPUs, while others can run on CPUs as well.
- **Optimization support** - not all models are compatible with every optimization technique. For example, Binary 
  Quantization and Matryoshka embeddings require specific model characteristics.
- **Data structure and geometry** - hierarchical data, such as a product catalog, may fit better in hyperbolic space. See [Hyperbolic Embeddings in Qdrant](/articles/hyperbolic-embeddings-qdrant/) for an example of matching embedding geometry to your data.

The list is not exhaustive, as there might be plenty of other things to consider, but you get the idea.

That's why you need to precisely define the task you really want to solve, get your hands dirty with the data the system
is supposed to process and build a ground truth dataset for it, so you can make an informed decision.

### Building the Ground Truth Dataset

The way your dataset will look depends on the task you want to evaluate. If we speak about semantic similarity,
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

Most typically, Qdrant users build retrieval systems that they use alone, or combine them with Large Language Models
to build Retrieval Augmented Generation. When we do retrieval, we need a slightly different structure of the golden 
dataset than for semantic similarity. The problem of retrieval is to find the `K` most relevant documents for a given 
query. Therefore, we need a set of queries and a set of documents that we would expect to receive for each of them. 
There are also three different ways of how to define the relevancy at different granularity levels:

1. **Binary relevancy** - a document is either relevant or not.
2. **Ordinal relevancy** - a document can be more or less relevant (ranking).
3. **Relevancy with a score** - a document can have a score indicating how relevant it is.

This retrieval dataset uses a relevance scale from 0 (not relevant) to 3 (highly relevant), with 2 indicating moderate relevance.

```json
[
  {
    "query": "How do vector databases work?",
    "relevant_documents": [
      {
        "id": "doc_123",
        "text": "Vector databases store and index vector embeddings...",
        "relevance": 3
      },
      {
        "id": "doc_456",
        "text": "The architecture of modern vector search engines...",
        "relevance": 2
      }
    ]
  },
  {
    "query": "Python code example for Qdrant",
    "relevant_documents": [
      {
        "id": "doc_789",
        "text": "```python\nfrom qdrant_client import QdrantClient\n...",
        "relevance": 3
      }
    ]
  }
]
```

Once you have the dataset, you can start evaluating the models using one of the evaluation metrics, such as 
`precision@k`, `Mean Reciprocal Rank(MRR)`, or `Normalized Discounted Cumulative Gain(NDCG)`. There are existing libraries, such as [ranx](https://amenra.github.io/ranx/) that can 
help you with that. [Running the evaluation process](/rag/rag-evaluation-guide/) on various models is a good way to get 
a sense of how they perform on your data. You can test even proprietary models that way. However, it's not the only 
thing you should consider when choosing the best model.

Please do not be afraid of building your evaluation dataset. It's not as complicated as it might seem, and it's a 
critical step! You don't need millions of samples to get a good idea of how the model performs. A few hundred 
well-curated examples might be a good starting point. Even dozens are better than nothing!

## Throughput, Latency, and Cost

Even if you found the best performing embedding model for your domain, that doesn't mean you can use it. Software projects do not live in isolation, and you have to consider the bigger picture. For example, you might have budget constraints that limit your choices. It's also about being pragmatic. If you have a model that is 1% more precise, but it's 10 times slower and consumes 10 times more resources, is it really worth it?

When selecting an embedding model for production, you need to consider three critical operational factors:

1. **Throughput**: How many embeddings can you generate per second? This directly impacts your system's ability to 
   handle load. Larger models typically have lower throughput, which might become a bottleneck during data ingestion or 
   high-traffic periods.
2. **Latency**: How quickly can you get a single embedding? For real-time applications like search-as-you-type or 
   interactive chatbots, low latency is crucial. Quantized versions of larger models can offer significant latency 
   improvements.
3. **Cost**: This includes both infrastructure costs (CPU/GPU resources, memory) and, for API-based models, per-token or 
   per-request charges. For example, running your own model might have higher upfront costs but lower per-request costs
   than some SaaS models.

The right balance depends on your specific use case. A news recommendation system might prioritize throughput for 
processing large volumes of articles in real-time, while a website search might prioritize latency for real-time
results. Similarly, a chatbot using a Large Language Model to generate a response might prioritize cost-effectiveness, 
as LLMs are often slower and retrieval isn't the most time-consuming part of the process.

## Balancing All Aspects

After all these considerations, you should have a table that summarizes each of the models you evaluated under all the 
different conditions. Now things are getting hard and answers are not obvious anymore.

Here's an example of how such a comparison table might look:

| Model                            | Precision@10 | MRR  | Inference Time | Memory Usage | Cost           | Multilingual               | Max Sequence Length |
| ----------------------------------| --------------| ------| ----------------| --------------| ----------------| ----------------------------| ---------------------|
| expensive-proprietary-saas-only  | 0.92         | 0.87 | API-dependent  | N/A          | $0.25/M tokens | Probably, yet undocumented | 8192                |
| cheaper-proprietary-multilingual | 0.89         | 0.84 | API-dependent  | N/A          | $0.01/M tokens | Yes (94 languages)         | 4096                |
| open-source-gpu-required         | 0.88         | 0.83 | 120ms          | 15GB         | Self-hosted    | English                    | 1024                |
| open-source-on-cpu               | 0.85         | 0.79 | 30ms           | 120MB        | Self-hosted    | English                    | 512                 |

The decision process should be guided by your specific requirements. Organizations struggling with budget constraints 
might lean towards self-hosted options, while those who prefer to avoid dealing with infrastructure management
might prefer API-based solutions. Who knows? Maybe your project does not require the highest precision possible, and a 
smaller model will do the job just fine.

![Fast, precise, cheap - pick two](/articles_data/how-to-choose-an-embedding-model/pyramid.jpg)

Remember that this doesn't have to be a one-time decision. As your application evolves, you might need to revisit your choice of the embedding model. Qdrant's architecture makes it relatively easy to migrate to a different model if needed. Named vectors help to create a system with multiple models and switch between them based on the query, or build a [hybrid search](/documentation/search-tuning/hybrid-search/) that takes advantage of different models or more complex search pipelines.

Others levers matter as well: memory usage can often be reduced with quantization or Matryoshka embeddings, while retrieval quality may benefit more from hybrid search or reranking than from switching to a larger embedding model.

Another decision to make is where to host the embedding model and how much inference infrastructure you want to manage.

## Hosting Your Embedding Model

Where the model runs affects latency and cost. Sending millions of documents to a model hosted far from your cluster adds network latency, and some cloud providers charge for the data transfer. Running the model yourself avoids both, but it takes expertise and infrastructure.

**Qdrant Cloud Inference** generates dense, sparse, and multimodal embeddings inside Qdrant Cloud, or proxies requests to OpenAI, Cohere, and Jina, without requiring you to manage inference servers.

![Qdrant Cloud Inference: the client sends upserts and queries to Qdrant, which gets embeddings from the inference service](/docs/qdrant-cloud-inference.png)

Check out the [Cloud Inference documentation](/documentation/cloud/inference/) to learn more. For generating embeddings on your own infrastructure, [FastEmbed](/documentation/fastembed/) is Qdrant's lightweight Python library.
