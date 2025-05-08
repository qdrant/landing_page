---
title: "How to choose an embedding model"
short_description: "There is no one-size-fits-all solution when it comes to embedding models. Learn how to choose the right one for your use case."
description: "Building proper search "
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
be measured, but not only in a running system, but also before you make the most important decision - which embedding
model to use. 

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

TODO: image presenting how tokenization works

One of the effects of such inner workings is that the model can only understand what its tokenizer was trained on (yes, 
tokenizers are also trainable components). As a result, any characters it hasn't seen during the training will be 
replaced with a special `UNK` token. If you analyze social media data, then you might be surprised that two 
contradicting sentences are actually perfect matches in your search.

TODO: image with contradicting sentences (raining vs sunny emoji)

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
tokenizers.

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

The list is not exhaustive, as there might be plenty of other things to consider, but you get the idea.

That's why you need to precisely define the task you really want to solve, get your hands dirty with the data the system
is supposed to process and build a ground truth dataset for it, so you can make an informed decision.

### Building the ground truth dataset

The way your dataset will look like depends on the task you want to evaluate. If we speak about semantic similarity,
then you will need pairs of texts with a score indicating how similar they are. 

TODO: an example of such a dataset

Most typically, Qdrant users build some retrieval systems which they use alone, or combined with Large Language Models
to build Retrieval Augmented Generation. That means we need a slightly different structure of the golden dataset. The
problem of retrieval is to find the most relevant K documents for a given query. Therefore, we need a set of queries
and a set of documents that we would expect to receive for each of them. There are also three different ways of how to
define the relevancy (sorted from the least to the most strict):

1. **Binary relevancy** - a document is either relevant or not.
2. **Ordinal relevancy** - a document can be more or less relevant (ranking).
3. **Relevancy with a score** - a document can have a score indicating how relevant it is.

TODO: an example of such a dataset

Once you have the dataset, you can start evaluating the models using one of the evaluation metrics, such as 
`precision@k`, `MRR`, or `NDCG`. There are existing libraries, such as [ranx](https://amenra.github.io/ranx/) that can 
help you with that. Running the evaluation process on various models is a good way to get a sense of how they perform
on your data. You can test even proprietary models that way. However, it's not the only thing you should consider when 
choosing the best model.

## Compute resource constraints

Even if you found the most precise embedding model for your domain, that doesn't mean you can use it. Software projects 
do not live in isolation, and you have to consider the bigger picture. For example, you might have budget constraints 
that limit your choices. It's also about being pragmatic. If you have a model that is 1% more precise, but it's 10 times 
slower and consumes 10 times more resources, is it really worth it?

TODO: image with inference time vs model size

## Throughput, latency and cost

TODO: write it

## Balancing all aspects

After all these considerations, you should have a table that summarizes each of the models you evaluated under all the 
different conditions. Now things are getting hard and answers are not obvious anymore. 

TODO: write it

## Locally sourced embeddings

Wouldn't it be great to run your selected embedding model as close to your search engine as possible? Network latency 
might be one of the biggest enemies, and transferring millions of vectors over the network may take longer if done from
a distant location. Moreover, some of the cloud providers will charge you for the data transfer, so it's not only about
the latency, but also about the cost.

Qdrant's Cloud Inference solves these problems by allowing you to run the embedding model next to the cluster where your
vector database is running. It's a perfect solution for those who want not to worry about the model inference and just
use search that works on the data they have. Check out the [Cloud Inference 
documentation](/#cloud-inference-documentation) to learn more.

[//]: # (TODO: add a correct link to the documentation above)