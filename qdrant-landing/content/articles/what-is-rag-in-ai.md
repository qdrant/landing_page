---
title: "What is RAG: Understanding Retrieval-Augmented Generation"
draft: false
slug: what-is-rag-in-ai? 
short_description:  What is RAG? 
description: Explore how RAG enables LLMs to retrieve and utilize relevant external data when generating responses, rather than being limited to their original training data alone.
preview_dir: /articles_data/what-is-rag-in-ai/preview
weight: -150
social_preview_image: /articles_data/what-is-rag-in-ai/preview/social_preview.jpg
small_preview_image: /articles_data/what-is-rag-in-ai/icon.svg
date: 2024-03-19T9:29:33-03:00
author: Sabrina Aquino 
author_link: https://github.com/sabrinaaquino
featured: true 
tags: 
  - retrieval augmented generation
  - what is rag
  - embeddings
  - llm rag
  - rag application


---

> Retrieval-augmented generation (RAG) integrates external information retrieval into the process of generating responses by Large Language Models (LLMs). It searches a database for information beyond its pre-trained knowledge base, significantly improving the accuracy and relevance of the generated responses.

Language models have exploded on the internet ever since ChatGPT came out, and rightfully so. They can write essays, code entire programs, and even make memes (though we’re still deciding on whether that's a good thing).

But as brilliant as these chatbots become, they still have **limitations** in tasks requiring external knowledge and factual information. Yes, it can describe the honeybee's waggle dance in excruciating detail. But they become far more valuable if they can generate insights from **any data** that we provide, rather than just their original training data. Since retraining those large language models from scratch costs millions of dollars and takes months, we need better ways to give our existing LLMs access to our custom data.

While you could be more creative with your prompts, it is only a short-term solution. LLMs can consider only a **limited** amount of text in their responses, known as a [context window](https://www.hopsworks.ai/dictionary/context-window-for-llms). Some models like GPT-3 can see up to around 12 pages of text (that’s 4,096 tokens of context). That’s not good enough for most knowledge bases.

![How a RAG works](/articles_data/what-is-rag-in-ai/how-rag-works.jpg)

The image above shows how a basic RAG system works. Before forwarding the question to the LLM, we have a layer that searches our knowledge base for the "relevant knowledge" to answer the user query. Specifically, in this case, the spending data from the last month. Our LLM can now generate a **relevant non-hallucinated** response about our budget. 

As your data grows, you’ll need efficient ways to identify the most relevant information for your LLM's limited memory. This is where you’ll want a proper way to store and retrieve the specific data you’ll need for your query, without needing the LLM to remember it. 

Vector databases store information as vector embeddings. This format supports efficient similarity searches to retrieve relevant data for your query. For example, Qdrant is specifically designed to perform fast, even in scenarios dealing with billions of vectors.

This article will focus on RAG systems and architecture. If you’re interested in learning more about vector search, we recommend the following articles: [What is a Vector Database?](https://qdrant.tech/articles/what-is-a-vector-database/) and [What are Vector Embeddings?](https://qdrant.tech/articles/what-are-embeddings/).


## RAG architecture

At its core, a RAG architecture includes the **retriever** and the **generator**. Let's start by understanding what each of these components does.


### The Retriever

When you ask a question to the retriever, it uses **similarity search** to scan through a vast knowledge base of vector embeddings. It then pulls out the most **relevant** vectors to help answer that query. There are a few different techniques it can use to know what’s relevant:


#### How indexing works in RAG retrievers

The indexing process organizes the data into your vector database in a way that makes it easily searchable. This allows the RAG to access relevant information when responding to a query.

![How indexing works](/articles_data/what-is-rag-in-ai/how-indexing-works.jpg)

As shown in the image above, here’s the process:



* Start with a _loader_ that gathers _documents_ containing your data. These documents could be anything from articles and books to web pages and social media posts. 
* Next, a _splitter_ divides the documents into smaller chunks, typically sentences or paragraphs. 
* This is because RAG models work better with smaller pieces of text. In the diagram, these are_ document snippets_.
* Each text chunk is then fed into an _embedding machine_. This machine uses complex algorithms to convert the text into [vector embeddings](https://qdrant.tech/articles/what-are-embeddings/).

All the generated vector embeddings are stored in a knowledge base of indexed information. This supports efficient retrieval of similar pieces of information when needed.


#### Query vectorization

Once you have vectorized your knowledge base you can do the same to the user query. When the model sees a new query, it converts this query into a vector using a similar process.

We use the same preprocessing and embedding techniques. This ensures that the query vector is compatible with the document vectors in the index.

![How retrieval works](/articles_data/what-is-rag-in-ai/how-retrieval-works.jpg)

#### Retrieval of relevant documents

Using the query vector, the system then starts the search to find the most relevant document snippets or passages. We can use the following techniques to find relevant information:


##### Sparse vector representations

A sparse vector is characterized by a high dimensionality, with most of its elements being zero.

The classic approach is keyword search, which is scanning documents for the exact words or phrases in the query. The search creates sparse vector representations of documents by counting word occurrences and inversely weighting common words. Queries with rarer words get prioritized.


![Sparse vector representation](/articles_data/what-is-rag-in-ai/sparse-vectors.jpg)


[TF-IDF](https://en.wikipedia.org/wiki/Tf%E2%80%93idf) (Term Frequency-Inverse Document Frequency) and [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) are two classic related algorithms. They're simple and computationally efficient. However, they can struggle with synonyms and don't always capture semantic similarities.

If you’re interested in going deeper, refer to our article on [Sparse Vectors](https://qdrant.tech/articles/sparse-vectors/).


##### Dense vector embeddings

This approach uses large language models like [BERT](https://en.wikipedia.org/wiki/BERT_(language_model)) to encode the query and passages into dense vector embeddings. These models are compact numerical representations that capture semantic meaning. Vector databases like Qdrant store these embeddings, allowing retrieval based on semantic similarity rather than just keywords using distance metrics like cosine similarity.

This allows the retriever to match based on semantic understanding rather than just keywords. So if I ask about "compounds that cause BO," it can retrieve relevant info about "molecules that create body odor" even if those exact words weren't used. We explain more about it in our [What are Vector Embeddings](https://qdrant.tech/articles/what-are-embeddings/) article.


#### Hybrid search 

However, neither keyword search nor this type of semantic vector search is perfect. Keyword search may miss relevant information expressed differently, while vector search can sometimes struggle with specificity or neglect important statistical word patterns. Hybrid methods aim to combine the strengths of different techniques.


![Hybrid search overview](/articles_data/what-is-rag-in-ai/hybrid-search.jpg)


Some common hybrid approaches include:



* Using keyword search to get an initial set of candidate documents. Next, the documents are re-ranked/re-scored using semantic vector representations.
* Starting with semantic vectors to find generally topically relevant documents. Next, the documents are filtered/re-ranked e based on keyword matches or other metadata.
* Considering both semantic vector closeness and statistical keyword patterns/weights in a combined scoring model.
* Having multiple stages were different techniques. One example: start with an initial keyword retrieval, followed by semantic re-ranking, then a final re-ranking using even more complex models.

When you combine the powers of different search methods in a complementary way, you can provide higher quality, more comprehensive results. Check out our article on [Hybrid Search](https://qdrant.tech/articles/hybrid-search/) if you’d like to learn more.


### The Generator

With the top relevant passages retrieved, it's now the generator's job to produce a final answer by synthesizing and expressing that information in natural language. The generator is typically a large pre-trained language model like GPT, BART or T5.

These models have been trained on massive datasets to understand and generate human-like text. However, to answer questions, they need some additional context beyond just the original query to formulate a meaningful response.

So the generator takes not only the query as input but also the relevant documents or passages that the retriever identified as potentially containing the answer.



![How a Generator works](/articles_data/what-is-rag-in-ai/how-generation-works.jpg)


There are two main ways the generator can incorporate this retrieved-context:


#### Sequence-to-sequence (Seq2Seq) approach

Imagine you have the query "What causes body odor?" and the retriever returns a relevant passage about compounds that create smell. In the seq2seq approach, the generator is given the query and the full retrieved passage together as a single long string of text as input.

For example: Input = "What causes body odor? &lt;passage> Certain compounds like isovaleric acid produced by bacteria can lead to body odor. These compounds are ..."

The generator then treats this as a standard seq2seq task - taking the whole input sequence and generating the output answer sequence token-by-token from start to end.


#### Token-by-token approach 

In this method, the query and retrieved passages are kept separate. Every time the model generates an answer, the model can examine different portions of the retrieved passages as relevant context.

For example, when a model generates an answer for "Body odor is caused by...", it may start with the passage mentioning "compounds". For the next word, it may look at the passage portion explaining the "bacteria" aspect.

So rather than considering the full retrieved-context at once, it can flexibly pick and choose different sections of the evidence at each generation step.

The key difference between each approach is:

**Seq2Seq**: The full retrieved evidence is input as one sequence

**Token-by-Token**: The model attends to different retrieved evidence at each generated token

The token-by-token approach allows more flexible referencing of the evidence, but the seq2seq method is often more straightforward to implement.

The retriever and generator don't operate in isolation - they are connected modules where the output of one feeds into the other to produce the final generated response. The image above shows how they’re integrated.


![The entire architecture of a RAG system](/articles_data/what-is-rag-in-ai/rag-system.jpg)


### RAG at scale

While dense vector retrieval provides powerful semantic matching capabilities, it also comes with computational challenges when working with large knowledge bases. This is where specialized vector database engines like Qdrant play a key role in optimizing the retrieval process for RAG architectures.



![Qdrant used for similarity search](/articles_data/what-is-rag-in-ai/rag-at-scale.jpg)



#### Vector Indexing and Compression

Qdrant employs advanced indexing data structures and vector compression algorithms to efficiently store and search through billions of dense embeddings. Methods like Hierarchical Navigable Small World (HNSW) graphs and [quantization techniques](https://qdrant.tech/documentation/guides/quantization/) for rapid nearest neighbor search over the high-dimensional vector space.

[Binary Quantization](https://qdrant.tech/articles/binary-quantization/), for example, saves on memory, and scales up to 30x at the same cost by compressing the raw embeddings into highly compact representations. Combining these indexing and quantization methods allows Qdrant to perform similarity searches over large vector datasets with extremely low latencies even with large-scale datasets. 


#### Filtering and Reranking

Real-world retrieval often requires filtering by structured metadata like sources, timestamps, etc. Qdrant supports filtering searches by arbitrary key-value metadata properties associated with each vector embedding.

You can then exploit approximate nearest neighbor search capabilities to further refine and re-rank the candidates based on precise distance calculations.


#### Distributed Scalability 

As the number of vectors and query volumes scale, Qdrant provides a distributed clustered architecture with automated sharding and replication mechanisms. This enables high availability and horizontal scaling to handle extremely large vector workloads across multiple nodes.

Whether dealing with millions or billions of vectors spanning diverse knowledge sources, such optimized vector similarity engines are critical for RAG models to quickly retrieve the most relevant evidence from their broad knowledge bases in a performant manner.


## Where is RAG being used?

Because of their more knowledgeable and contextual responses, RAG models are finding widespread application across various domains today, especially when factual accuracy and depth of knowledge are required. 


### Real-World Applications:

Question answering: This is perhaps the most prominent use case for RAG models. They power advanced question-answering systems that can retrieve relevant information from large knowledge bases and then generate fluent answers. Example applications include: For example, AI assistants and chatbots for customer support, research, tutoring, and more.

Language generation: RAG allows language models to augment their pre-trained knowledge with relevant information retrieved on the fly. This enables more factual and contextualized text generation for contextualized text summarization from multiple sources

Data-to-text generation: By retrieving relevant structured data, RAG models can generate rich descriptions, reports, and narratives grounded in that data. Generating product/business intelligence reports from databases or describing insights from data visualizations and charts

Multimedia understanding: RAG isn't limited to text - it can retrieve multimodal information like images, video, and audio to enhance understanding. Answering questions about images/videos by retrieving relevant textual context.


## Creating your first RAG chatbot with Langchain, Groq, and OpenAI

Are you ready to create your own RAG chatbot from the ground up? Daniel Romero’s instructional video is the perfect starting point. It guides you through:



* Setting up your chatbot from the beginning.
* Preprocessing and organizing data for your chatbot's use.
* Applying vector similarity search algorithms.
* Enhancing your chatbot's efficiency and response quality.

After building your RAG chatbot, you'll be able to evaluate its performance against that of a chatbot powered solely by a Large Language Model (LLM). This comparison will highlight the improvements and advantages your RAG chatbot offers.

<div style="max-width: 640px; margin: 0 auto;"> <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"> <iframe width="100%" height="100%" src="https://www.youtube.com/embed/O60-KuZZeQA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe> </div> </div>



### What’s next?

Have a RAG project you want to bring to life? Join our [Discord community](discord.gg/qdrant) where we’re always sharing tips and answering questions on vector search and retrieval.

Learn more about how to properly evaluate your RAG responses: [Evaluating Retrieval Augmented Generation - a framework for assessment](https://superlinked.com/vectorhub/evaluating-retrieval-augmented-generation-a-framework-for-assessment).