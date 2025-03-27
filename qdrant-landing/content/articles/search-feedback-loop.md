---
title: "Relevance Feedback in Informational Retrieval"
short_description: "Incorporating relevance feedback into discovery search, an overview of a research field."
description: "(Pseudo) Relevance feedback in neural (semantic) and lexical (exact) search. Absence of relevance feedback mechanisms in industrial semantic (vector) search."
social_preview_image: /articles_data/search-feedback-loop/preview/social_preview.jpg
preview_dir: /articles_data/search-feedback-loop/preview
weight: -170
author: Evgeniya Sukhodolskaya
date: 2025-03-27T00:00:00+03:00
draft: false
keywords:
    - relevance
    - relevant
    - feedback
    - semantic search 
    - lexical search
    - search
    - informational retrieval
category: machine-learning
---

*"A problem well stated is a problem half solved"*. This quote applies as much to life as it does to information retrieval. With a well-formulated query, retrieving a matching document is simply a matter of choosing the right retrieval algorithm and a system that supports it.

In reality, most users struggle to precisely define what they are searching for. Recall searching in our documentation for an "[optimization guide](https://qdrant.tech/articles/vector-search-resource-optimization/)". If we haven't gathered all of the information in one place, you'd have to conduct an extensive, iterative discovery search. Wouldn't it be convenient if dedicated search solutions could account for these challenges without placing the full burden of discovery on users?

While users may struggle to formulate a perfect request — especially in unfamiliar topics — they can easily judge whether a retrieved answer is relevant or irrelevant. **Relevance/irrelevance is a powerful feedback mechanism for a retrieval system** to iteratively refine results in the direction of user interest. However, there's a problem: users usually don't have the patience to provide detailed feedback.

In 2025, with social media flooded with daily AI breakthroughs, it almost seems like we could fully delegate relevance-guided discovery searches to LLMs. Many agentic RAG systems, for instance, are capable of assessing the relevance of retrieved information and even of managing iterative retrieval. Of course, there's a catch: these models still rely on retrieval systems (*RAG isn't dead yet, despite daily predictions of its demise*). They receive only a handful of top-ranked results provided by a far simpler retriever, which is still used for query comparison with billions of documents in the index. As a result, the success of guided retrieval still (at least partially) depends on the retrieval system itself — while the AI assistant takes the blame, receiving endless "NOT THAT" messages in the chat window.

So, we should find a way of effectively and efficiently incorporating relevance feedback directly into a retrieval system. 

In this article, we'll explore the approaches proposed in the research literature and try to answer the following question: If relevance feedback in search is so widely studied and praised as effective, why is it (basically) not used in dedicated vector search solutions?

# Dismantling the Research Field

Both industry and academia tend to reinvent the wheel now and then. So, we first took some time to study and categorize different methods — just in case there was something we could plug directly into Qdrant. The resulting taxonomy isn't set in stone, but we aim to make it useful.

## Relevance Feedback

{{<figure src=/articles_data/search-feedback-loop/relevance-feedback.png caption="Types of Relevance Feedback" width=80% >}}

### Explicit Feedback

Relevance is subjective — what qualifies as a “*good birthday present*” varies from user to user. The most transparent way to gather relevance feedback is to ask users directly.

The main limitation? Users are notoriously reluctant to provide feedback. Did you know that [Google once had](https://en.wikipedia.org/wiki/Google_SearchWiki#:~:text=SearchWiki%20was%20a%20Google%20Search,for%20a%20given%20search%20query) an upvote/downvote mechanism on search results but removed it because almost no one used it?

### Pseudo-Relevance Feedback (PRF)

Another way is to define the relevance of the first-stage retrieval automatically — whether in a rule-based or machine learning-based (including advanced AI agents) way.

In the simplest setting, we assume that the top items retrieved by a system on the first iteration are relevant, and based on them, we can find more relevant items on the second one. However, a common practice is to use a “smarter” algorithm than a basic retriever as a judge of relevance.

The obvious concern here is twofold: 
1. How well can the automated judge determine relevance (or irrelevance)? 
2. How cost-efficient is it? After all, you can’t expect GPT-4o to re-rank thousands of documents for every user query — unless you’re filthy rich.

Nevertheless, pseudo-relevance feedback-based approaches could be a scalable way to improve search when explicit feedback is not accessible.

## Has the Problem Already Been Solved?

Digging through research materials, we expected anything else but a discovery that the first approach to integrate relevance feedback in search dates back [*sixty years*](https://sigir.org/files/museum/pub-08/XXIII-1.pdf). In the midst of the neural search bubble, it's easy to forget that lexical (term-based) retrieval has been around for decades. Naturally, research in that field has had ample time to develop.

**Neural search** — aka [vector search](https://qdrant.tech/articles/neural-search-tutorial/) — gained traction in the industry around 5 years ago, around the rise of Large Language Models (LLMs). Hence, relevance feedback techniques specific to it might still be in their early stages, awaiting production-grade validation and industry adoption. 

As a [dedicated vector search engine](https://qdrant.tech/articles/dedicated-vector-search/), we would like to be these adopters. Our focus is neural search, but approaches in both lexical and neural retrieval seem worth exploring, as cross-field studies are always insightful, with the potential to reuse well-established methods of one field in another. 

We indeed found some interesting methods applicable to neural search solutions and additionally revealed a **gap in the relevance feedback-based approaches suitable for neural search solutions**. Stick around, and we'll share our findings!

## Two Ways to Approach the Problem

Retrieval as a recipe can be broken down into three main ingredients:
1. Query
2. Documents 
3. Similarity scoring between them.

Query formulation is a subjective process – it can be done in infinite configurations, making the relevance of a document unpredictable until the query is formulated and submitted to the system. So, adapting documents (or their index) to relevance feedback should be done dynamically per request, which has no practical sense, considering that modern retrieval systems store billions of documents.

Thus, approaches for incorporating relevance feedback in search fall into two categories: **refining a query** and **refining the similarity scoring function** between the query and documents.

{{<figure src=/articles_data/search-feedback-loop/taxonomy-overview.png caption="Research Field Taxonomy Overview" width=80% >}}

### Query

{{<figure src=/articles_data/search-feedback-loop/query.png caption="Incorporating Relevance Feedback in Query" width=80% >}}

#### Query As Is

In **term-based retrieval**, an intuitive way to improve a query would be to **expand it with relevant terms**. It resembled the "*aha, so that's what it's called*" stage in the discovery search.

Before the deep learning era of this century, expansion terms were mainly selected using statistical or probabilistic models. The idea was to:

1. Either extract the **most frequent** terms from (pseudo-)relevant documents;
2. Or the **most specific** ones (for example, according to IDF);
3. Or the **most probable** ones (most likely to be in query according to a relevance set). 

Well-known methods of those times come from the family of [`Relevance Models`](https://sigir.org/wp-content/uploads/2017/06/p260.pdf), where terms for expansion are chosen based on their probability in pseudo-relevant documents (how often terms appear) and query terms likelihood given those pseudo-relevant documents (how strongly these pseudo-relevant documents match the query. 

The most famous one, `RM3` – interpolation of expansion terms probability with their probability in a query – is still appearing in papers of the last few years as a (noticeably decent) baseline in term-based retrieval, usually as part of [anserini](https://github.com/castorini/anserini).

{{<figure src=/articles_data/search-feedback-loop/relevance-models.png caption="Relevance Models for Query Expansion" width=100% >}}

With the time approaching the modern machine learning era, multiple studies – as [this one](https://dl.acm.org/doi/10.1145/1390334.1390377) – began claiming that these traditional ways of query expansion select not-so-useful terms and proposing instead to use machine learning models. Started with simple classifiers based on hand-crafted features, this trend naturally led to attempts to use the famous [BERT (Bidirectional encoder representations from transformers)](https://huggingface.co/docs/transformers/model_doc/bert). For example, `BERT-QE` (Query Expansion) authors came up with this schema:

1. Get pseudo-relevance feedback from the finetuned BERT reranker (~10 documents);
2. Chunk these pseudo-relevant documents (~100 words) and score query-chunk relevance with the same reranker;
3. Expand the query with the most relevant chunks;
4. Rerank 1000 documents with the reranker using the expanded query.

This approach significantly outperformed BM25 + RM3 baseline in experiments (+11% NDCG@20). However, it required **11.01x** more computation than just using BERT for reranking, and reranking 1000 documents with BERT would take around 9 seconds alone [[1]](https://aclanthology.org/2020.findings-emnlp.424.pdf).

For **neural retrieval**, query term expansion could *hypothetically work* – new terms might shift the query vector closer to that of the desired document. However, [this approach isn’t guaranteed to succeed](https://dl.acm.org/doi/10.1145/3570724). Neural search depends entirely on embeddings, and how those embeddings are generated — consequently, how similar query and document vectors are — depends heavily on the model’s training. 

However, it definitely works if **query refining is done by a model operating in the same vector space**, which typically requires offline training of a retriever. The goal is to adapt the query encoder of a retriever to ingest feedback documents alongside the query as a new input, producing an adjusted query embedding. Examples include [`ANCE-PRF`](https://arxiv.org/pdf/2108.13454) and [`ColBERT-PRF`](https://dl.acm.org/doi/10.1145/3572405) – ANCE and ColBERT fine-tuned extensions.

The reason why you’re most probably not familiar with these models – their absence in the industry – is that their **training** itself is a **high upfront cost**, and even though it was “paid”, these models **struggle with generalization**, performing poorly on out-of-domain tasks (datasets they haven’t seen during training) [[2]](https://arxiv.org/abs/2108.13454). Additionally, feeding an attention-based model a lengthy input (query + documents) is not a good practice in production settings (attention is quadratic in the input length), where time and money are crucial decision factors.

Alternatively, one could skip a step — and work directly with vectors.

#### Query As Vector Representation

Instead of modifying the initial query, a more scalable approach — easily applicable across modalities and suitable for both lexical and neural retrieval — is to directly adjust the query vector.

Although vector search has become a trend in recent years, its core components have existed in the field for decades. For example, the SMART retrieval system used by [`Rocchio`](https://sigir.org/files/museum/pub-08/XXIII-1.pdf]) in 1965 for his relevance feedback in search experiments operated on vector representations of text mapped to a concept space.

{{<figure src=/articles_data/search-feedback-loop/Roccio.png caption="Roccio's Relevance Feedback Method" width=100% >}}

**Rocchio’s idea** — to update the query vector by adding a difference between the centroids of relevant and non-relevant documents — seems to translate well to modern dual encoders-based dense retrieval systems. Researchers seem to agree: a study from 2022 demonstrated that the `parametrized version of Rocchio’s method` in dense retrieval consistently improves Recall@1000 by 1–5%, while keeping query processing time suitable for production — around 170 ms [[3]](https://arxiv.org/pdf/2108.11044). 

However, parameters (centroids and query weights) in the dense retrieval version of Roccio’s method must be tuned for each dataset and, ideally, also for each request. The efficient way of doing so on-the-fly remained an open question until the introduction of a **gradient-descent-based Roccio’s method generalization**: [`Test-Time Optimization of Query Representations (TOUR)`](https://arxiv.org/pdf/2205.12680). TOUR adapts a query vector over multiple iterations of retrieval and reranking (*retrieve → rerank → gradient descent step*), guided by a reranker’s relevance judgments.

{{<figure src=/articles_data/search-feedback-loop/TOUR.png caption="An overview of TOUR iteratively optimizing initial query representation based on pseudo relevance feedback.<br>Figure adapted from Sung et al., 2023, [Optimizing Test-Time Query Representations for Dense Retrieval](https://arxiv.org/pdf/2205.12680)" width=60% >}}

The next iteration of gradient-based methods of query refinement – [`ReFit`](https://arxiv.org/abs/2305.11744) – proposed in 2024 a lighter, production-friendly alternative to TOUR, limiting *retrieve → rerank → gradient descent* sequence to only one iteration. The retriever’s query vector is updated through matching (via [Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence)) retriever and cross-encoder’s similarity scores distribution over feedback documents. ReFit is model- and language-independent and stably improves Recall@100 metric on 2–3%. 

Gradient descent-based methods seem like a production-viable option, an alternative to finetuning the retriever (distilling it from a reranker), which can be done without changing the retriever’s parameters (expensive operation, considering their usual amount). The only drawback we noticed is a lack of explicit instruction in choosing gradient descent hyper-parameters, which is essential for avoiding **query drift** — the query may drift entirely away from the user’s intent – and experiment numbers often tend to be cherry-picked.

### Similarity Scoring 

{{<figure src=/articles_data/search-feedback-loop/similairty-scoring.png caption="Incorporating Relevance Feedback in Similarity Scoring" width=80% >}}

Another family of approaches, appealing for preserving the original query intent, is built around incorporating relevance feedback documents directly into the similarity scoring function.

In **lexical retrieval**, this can be as simple as boosting documents that share more terms with those judged as relevant. Its **neural search counterpart** is a [`k-nearest neighbors-based method`](https://aclanthology.org/2022.emnlp-main.614.pdf) that adjusts the query-document similarity score by adding the sum of similarities between the candidate document and all known relevant examples, which yields a negligible improvement — less than 0.5% NDCG@20 — in experiments with eight relevant documents. Perhaps the effect would be more noticeable if researchers could use an updated similarity scoring function for all the documents in the dataset; however, **without access to the retrieval system component, they have to rerank** with a refined similarity function a retrieved subset from a black box of a retrieval system. 

In all other papers, we found that adjusting similarity scores based on relevance feedback is also centred around [reranking](https://qdrant.tech/documentation/search-precision/reranking-semantic-search/) – **training or finetuning rerankers to become relevance feedback-aware**. Typically, experiments include cross-encoders, though [simple classifiers are also an option](https://arxiv.org/pdf/1904.08861). These methods generally involve rescoring a broader set of documents retrieved during an initial search, guided by feedback from a smaller top-ranked subset. It is not a similarity matching function adjustment per se but rather a similarity scoring model adjustment.

Methods typically fall into two categories: 
1. **Training rerankers offline** to ingest relevance feedback as an additional input at inference time, [as here](https://aclanthology.org/D18-1478.pdf) — again, attention-based models and lengthy inputs: a production-deadly combination.
2. **Finetuning rerankers** on relevance feedback from the first retrieval stage, [as Baumgärtner et al. did](https://aclanthology.org/2022.emnlp-main.614.pdf), finetuning bias parameters of a small cross-encoder per query on 2,000 feedback documents (still a lot, especially considering that their method works with explicit feedback).

The biggest **limitation** here is that these reranker-based methods cannot retrieve relevant documents beyond those returned in the initial search, and using rerankers on thousands of documents in production is a no-go – it’s expensive.
Ideally, to avoid that, a similarity scoring function updated with relevance feedback should be used directly in the second retrieval iteration. However, in every research paper we’ve come across, **retrieval systems are treated as black boxes — ingesting queries, returning results, and offering no built-in mechanism to modify scoring**.

# So, what are the takeaways?

Pseudo Relevance Feedback (PRF) is known to improve the effectiveness of lexical retrievers. Several PRF-based approaches – mainly query terms expansion-based – are successfully integrated into traditional retrieval systems. At the same time, there are **no known industry-adopted analogues in neural (vector) search dedicated solutions**; neural search-compatible methods remain stuck in research papers.

The gap we noticed while studying the field is that researchers have **no direct access to retrieval systems**, forcing them to design wrappers around the black-box-like retrieval oracles. This is sufficient for query-adjusting methods but not for similarity scoring function adjustment.

Perhaps PRF methods haven't made it into the neural search systems for trivial reasons — like no one having the time to find the right balance between effectiveness and efficiency. Getting it to work in a production setting means experimenting, building interfaces, and adapting architectures. Simply put, it needs to look worth it. And unlike 2D vector math, high-dimensional vector spaces are anything but intuitive. The curse of dimensionality is real. So is query drift. Even methods that make perfect sense on paper might not work in practice.

A real-world solution should be simple—maybe just a bit smarter than a rule-based approach, but still practical. It shouldn't require fine-tuning thousands of parameters or feeding paragraphs of text into transformers. **And for it to be effective, it needs to be integrated directly into the retrieval system itself.**
