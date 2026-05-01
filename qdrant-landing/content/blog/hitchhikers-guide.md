---
title: "The Hitchhiker's Guide to Vector Search"
draft: false
slug: hitchhikers-guide
short_description: A Qdrant Star shares her hard-won lessons from her extensive open-source building
description: A Qdrant Star shares her hard-won lessons from her extensive open-source building 
preview_image: /blog/hitchhikers-guide/preview/preview.jpg 
social_preview_image: /blog/hitchhikers-guide/preview/social_preview.jpg # Optional image used for link previews
title_preview_image: /blog/hitchhikers-guide/preview/title.jpg # Optional image used for blog post title

date: 2025-07-09T00:00:00+02:00
author: Clelia Astra Bertelli & Evgeniya Sukhodolskaya
featured: false 
tags:
  - stars
  - community
  - blog
---

> From lecture halls to production pipelines, [Qdrant Stars](https://qdrant.tech/stars/) -- founders, mentors and open-source contributors -- share how they’re building with vectors in the wild.  
> In this post, Clelia distils tips from her talk at the [“Bavaria, Advancements in SEarch Development” meetup](https://lu.ma/based_meetup), where she covered hard-won lessons from her extensive open-source building.

*Hey there, vector space astronauts!*  

*I am Clelia, an Open Source Engineer at [LlamaIndex](https://www.llamaindex.ai/). In the last two years, I've dedicated myself to the AI space, building (and breaking) many things, and sometimes even deploying them to production!*  

*I spent quite a bit of time messing around with LLMs, vector databases and AI agents, and I would really love to share with you some tips and tricks related to vector search. These insights do not only come from my theoretical knowledge but the real-world, hands-on experience I gained while building vector search-powered applications.*  

*Let's dive in!*

---

## A Quick Overview of Textual RAG

The suggestions in this blog post are all related to **textual vector search**, powering many Retrieval Augmented Generation (RAG) applications. Well, how does RAG work?

Very briefly, you can break it down into three steps:

- **Data preparation**: prepare your data by extracting raw text from files and chunking it into smaller, digestible pieces.
- **Embedding**: choose a text embedding model and use it to produce vectorized representations of your text chunks.
- **Upload to DB and serve**: upload embeddings to a vector database (such as Qdrant) and serve the database as a retrieval endpoint in your pipeline.

When the user asks a question, context will be *retrieved* from the database and provided to the LLM, which will then *generate* content *augmented* by the retrieved information.

## Text Extraction: Your Best Friend and Worst Enemy

![text-extraction](/blog/hitchhikers-guide/sep_1.png)

Text extraction is a crucial step: having clean, well-structured raw text can be game-changing for all the downstream steps of your RAG, especially to make the retrieved context easily “understandable” for the LLM.

You can perform text extraction in various ways, for example:  

**Object-based parsing**, such as the one provided by [PyPDF](https://pypi.org/project/pypdf/) or [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/), is fast and cheap for text-only documents but might fail to capture the complexity of tables, images and other visual elements many files can have nowadays.  

**Agentic and OCR-based parsing**, such as the one offered by [LlamaParse](https://www.llamaindex.ai/llamaparse), which is often an excellent choice for handling complex documents, and other methods, including **using Visual Language Retrievers** such as [ColPali&ColQwen](https://qdrant.tech/documentation/advanced-tutorials/pdf-retrieval-at-scale/), which are also very effective, especially with scanned or image-dense files.

#### My Advice

Trust your guts. If a solution seems to give you good-quality raw text, go for it!

If you want a real-world example of how good vs bad text extraction makes the difference, you can check out a project I built, [PapersChat](https://github.com/AstraBert/PapersChat).  
It allows you to use LlamaParse or simple parsing with PyPDF to extract text from your papers and chat with them.

## Chunking Is All You Need

![chunking](/blog/hitchhikers-guide/sep_2.png)

Chunking might really make the difference between a successful and a failing RAG pipeline.

Chunking means breaking large text down into pieces, which will be given to the LLM to perform augmented generation. It is then crucial to break the text down into chunks that are meaningful.

If you want to have the text divided into sentences, it might make sense to use **sentence- or token-based chunkers**, while using **semantic- or embeddings-based (late) chunking** is more suitable for separating paragraphs.  

**Agentic or neural chunking** should be used when you want to isolate higher-order semantic units, such as all the information about crocodiles in a paper dedicated to reptiles.

#### My Advice

Effective chunking boils down to one thing: the complexity of the textual representation you want as an output.

A very easy-to-use library for all the chunking strategies I mentioned is [chonkie](https://chonkie.ai/) -- give it a try, you won't be disappointed!  

You can also check out how **abstract syntax trees can be used to parse and chunk code files** in [Code-RAGent](https://github.com/AstraBert/code-ragent), a RAG agent built on top of my GO codebase, so I could retrieve code concepts and implementation I forgot or have doubts about.

---

## Embeddings: Catch ‘em All!

![embeddings](/blog/hitchhikers-guide/sep_3.png)

Embedding text equals generating a numerical representation of it. For example, as a target representation, you could choose *dense* or *sparse* vectors. The difference is in what they capture: dense embeddings are the best at broadly catching the semantic nuances of the text, while sparse embeddings precisely pick up its keywords.

The good news is you don't have to pick one with a [hybrid search](https://qdrant.tech/articles/hybrid-search/). Hybrid search combines results from both a dense (semantic) search and a sparse (keyword) search.

But how to combine?

- You can do it by **rescoring** the vectors: you re-embed (often with a dense or multivector embedding model) all the texts associated with the retrieved vectors, both dense and sparse, and then find the most similar vector to the query. Alternatively, you could use cross-encoders.
- You can also **fuse** the results, for example, assigning them points based on their position in both rankings (sparse and dense) and then summing these points up. The chunk with the most points is the best match!

#### My Advice

Hybrid search is not the solution for all retrieval problems, yet it can be a valuable choice when you want to retain semantic discrimination while still relying on keyword-based search. An example could be RAG applications in the legal or medical domains.

If you want a quick start on a hybrid search, check out [Pokemon-Bot](https://github.com/AstraBert/Pokemon-Bot), a simple Discord bot built on top of Qdrant and Cohere.

## Search Boosting 101

![search-boosting](/blog/hitchhikers-guide/sep_4.png)

Search boosting is something everybody wants: less compute, reduced latency and, overall, faster and more efficient pipelines that can make the UX way smoother. I’ll mention two of them.

### Semantic caching

Say your Qdrant vector database has lots of information, so searching through it requires time. It is easily imaginable, though, that many users will ask similar questions in our RAG application, and it makes sense to provide them with the same answer.

*Here comes semantic caching:* you should create a second, smaller vector database instance (collection in Qdrant), where you can store the vectorized representation of the questions asked by the users and, in the associated metadata, the answer to that question.  

Then, before running the whole RAG pipeline, you perform a quick search within your semantic cache to see if any question is similar to the one asked before. You simply return the associated answer instead of producing one de-novo, saving you a lot of time and compute!

### Binary quantization

Binary quantization is also something that can help you, especially if you have tons of documents (we’re talking millions). A large dataset is a performance challenge and a memory problem: embeddings from providers like OpenAI can have 1536 dimensions, meaning almost 6 kB per full-precision embedding!

*And here it comes:* taking the vector as a list of floating point numbers, binary quantization converts it to a list of 0s and 1s based on mathematical rounding. Such a representation significantly reduces the memory footprint and makes it easier for your search algorithm to compare vector representations.

Using binary quantization comes with the natural question: *“Are the search results as good as if I were using the non-quantized vectors?”* Generally, they aren’t *as* good, which is why they should be combined with the other techniques discussed above, such as rescoring.

#### My Advice

Do you want to build a production-ready system with semantic caching and quantization? Then, you might want to look at [PhiQwenSTEM](https://github.com/AstraBert/PhiQwenSTEM), a learning assistant with access to 15,000+ documents to reply to your STEM questions!

## Querying Makes the Difference

![querying](/blog/hitchhikers-guide/sep_5.png)

A common error in RAG pipelines is that you curate every detail, but you do not take into account one key aspect: **queries**.

Most of the time, queries are *too generic* or *too specific* to pick up the knowledge embedded in your vector database. There are, nevertheless, some magic tricks you can apply to optimize querying for your use case.

#### My Advice

Here’s my rule of thumb:

| Query Type   | Transformation to Apply |
|--------------|--------------------------|
| **Generic query:** too broad, may confound the search process | **Expansion:** you can transform your query into a hypothetical document (HyDE), using a language model to generate a more detailed query text, which you can embed and use in retrieval. |
| **Specific query:** asks for some specific information that can be easily identified within your documents | **No transformation** in this case, you can retrieve directly! |
| **Complex query:** has many questions that generally cannot be answered by just one of the documents within your database | **Decomposition:** You can divide the query into several sub-queries, each of which is used for a multistep-like retrieval from the database. The results from each step will then form the final answer from the LLM. |

How to assign a query type? 

Well, you can build an agentic system for automated choice of query transformation, like in my [RAGcoon](https://github.com/AstraBert/RAGcoon). There, a query agent tries various retrieval techniques to get the best information for startup founders.

## Don’t Drown in Evals

![evalustion](/blog/hitchhikers-guide/sep_6.png)

Ideas turned into implementations are cool, yet only eval metrics can tell whether your project delivers real value and has a go-to-market potential.

It is very easy, though, to drown in all of the evaluation frameworks, strategies and metrics out there. It is also common to get medium-to-good results on some metrics when evaluating the first implementation of your product and happily stopping the development while actually there is a huge room for improvement.

#### My Advice

Here are my two suggestions for anyone who’s fallen into these traps:

- **Simple is better than complex**: as the Python zen motto states, your implementations must be simple, easy to understand, and read. Using intuitive metrics, such as the *hit rate* or the *mean reciprocal ranking (MRR)* in a retrieval pipeline or the *faithfulness* and *relevancy* of the responses generated by your LLM, is the best way to understand the product you are building. There is always time to test and tweak complex metrics, but later!
- **Iterate, iterate, iterate**: It is easy to get something simple and somewhat good up and running, but the key for real, production-ready software is to iterate on it. Build on the simple things and make them better with every round of tweaking and evaluation. Once you enter the territory where your products start to become good enough, test them again on more complex metrics. There is no fixed limit for iterations, but one is never enough!

If you want to start with something that can give you immediate insights on POCs combining different embedding and language models, you can try [diRAGnosis](https://github.com/AstraBert/diRAGnosis), a lightweight framework that informs you with simple metrics on how well your models are performing.

---

*I am leaving you (hopefully) with some key takeaways.*  
*One last might sound like a given, but I guarantee it is not for everyone: keep exploring, building and breaking things – that’s the only way to learn!*  

*If you would like to, follow my journey in AI space through my [social media](https://link.clelia.dev/), and see you soon, vector space astronauts!*
