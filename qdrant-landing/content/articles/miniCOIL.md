---
title: "MiniCOIL: on the Road to Ideal Sparse Neural Retrieval"
short_description: "Our attempt to learn from drawbacks of modern sparse neural retrievers"
description: "Introducing miniCOIL-a lightweight sparse neural retriever capable of understanding words’ meaning in the context & performant on out-of-domain datasets."
social_preview_image: /articles_data/minicoil/social-preview.jpg
preview_dir: /articles_data/minicoil/preview
weight: -190
author: Evgeniya Sukhodolskaya
date: 2025-04-13T12:00:00+03:00
draft: false
keywords:
  - hybrid search
  - sparse embeddings
  - miniCOIL
  - bm25
category: machine-learning
---

How would you describe an ideal retriever-an algorithm for finding the most relevant document to a query?
It should provide explainable results, so we understand why we get what we get. It should be precise-the topmost result should be the most relevant. At the same time, a retrieved subset of results should have high recall-we don't want to miss relevant information. The representation we use to store documents in a retrieval system should have a minimal memory footprint. And, of course, the retrieval process should be fast (and furious).

Let's consider text retrieval, the oldest and most researched area in the field of information retrieval. Could you name an ideal retriever?

The ideal retriever is the Roman Empire meme of the IR field-we all think about it daily. It's impossible to make a universal solution-by trying to improve one characteristic, one usually has to compromise on another. A great example of this is the field of sparse neural retrieval-an approach developed out of attempts to combine the strengths of dense and term-based text retrieval while getting rid of their weaknesses. This field has great potential-if we remove from it the burden of being a pitch-perfect for every scenario, and focus on use cases where it shines.

This article describes our step toward sparse neural retrieval as it should be-a field of lightweight term-based retrievers capable of distinguishing word meanings. Learning from the mistakes of previous attempts in the field (including ours), we created **miniCOIL**, a new sparse neural candidate to take BM25’s place in hybrid searches-and we're happy to share it with you, awaiting your feedback.

## The Good, the Bad and the Ugly

Sparse neural retrieval is not so well known, as opposed to methods it's based on-term-based and dense retrieval.

### Term-based Retrieval

Term-based retrieval usually works with a text as a bag-of-words. These words play roles of different importance, contributing to the overall relevance score between a document and a query.

Famous **BM25** estimates words' contribution based on their 
1. Importance in a particular text (term frequency (TF)-based).
2. Significance within the whole corpus (Inverse Document Frequency (IDF)-based).
It's also based on several parameters reflecting typical text length in the corpus, the exact meaning of which you can check in our [detailed breakdown of the BM25 formula](https://qdrant.tech/articles/bm42/).

Precisely defining word importance within a text is untrivial. BM25 is built on the idea that the term importance can be defined statistically. It isn’t far from the truth in long texts, where frequent repetition of a certain word signals that the text is related to this concept.
Yet words have different meanings, which drastically affect the text's relevance. Think of *"fruit bat"* and *"baseball bat"*—same frequency, different meaning.

### Dense Retrieval

How to capture the meaning? Bag-of-words models like BM25 assume that words are placed in a text independently, while linguists say:

> You shall know a word by the company it keeps

This idea, together with a motivation to numerically express word relationships, powered the development of the second branch of retrieval—dense vectors-based. 

Perhaps you remember the famous formula of **word2vec**. *king - man + woman = queen*, quantifiable through vectors encoding these words. The meaning of different words is captured, yet the problem of distinguishing "bats" persists-**word2vec** learns only **static embeddings**. It produces only one vector representation for one single word, no matter in which context it appears. The "bat" vector mixes in itself everything from bloodsucking animals to sports matches. 

A major breakthrough in machine learning—**transformer models with attention mechanisms** (for example, **BERT**)—solved distinguishing a word's meaning within the text’s context, making it a part of relevance matching in retrieval. This cost us the explainability of the results in retrieval. Attention-based encoders combine (by pooling) word vector representations into a representation of a text chunk. This makes the similarity of texts low-interpretable and less precise. What exactly is the average between a "fruit" and a "bat"? 

We could compare texts based on the similarity of each word's dense vector representation, as **late interaction models** do, but then we get as far as possible from fast retrieval at scale. Imagine: each text chunk has at least a few dozen words, each word is encoded as a 128-dimensional vector (as in **ColBERT**), and you have a billion documents in vector storage...

### Sparse Neural Retrieval

So, on one side, we have weak explainability, sometimes leading to frustrating retrieval results, and on the other—lightweight, explainable and fast term-based retrievers like BM25, absolutely incapable of capturing semantics.  

A natural wish would be to take the best of both worlds. A pretty common answer is **[hybrid search](https://qdrant.tech/articles/hybrid-search/)**, which fuses the results of dense and term-based retrievers of choice. It definitely helps to increase the overall quality of results, but when it comes to memory and speed, it pulls the double duty.

Another approach is sparse neural retrieval. 
- Why **sparse**? Term-based retrieval can operate on sparse vectors, where each word in a text is assigned a non-zero value (its importance for a text). 
- Why **neural**? Instead of deriving an importance score for a word based on its statistics in a text, let's use machine learning models capable of encoding words' meaning.

![sparse-neural-retrieval-evolution](/articles_data/minicoil/models_evolution.png)

The [detailed history of sparse neural retrieval](https://qdrant.tech/articles/modern-sparse-neural-retrieval/) makes a whole other article. Summing a big part of it up, there were many attempts to map a word representation produced by a dense encoder to a single-valued importance score, and most of them never saw the real world outside of research papers (**DeepImpact**, **TILDEv2**, **uniCOIL**). 

First, squishing high-dimensional word representations (usually 768-dimensional BERT embeddings) into a single number inevitably leads to a blended word's meaning. On the other hand, stepping in a late-interaction-like direction with vector-per-word representations, as done by the authors of **Contextualized Inverted Lists**, goes against one of the main benefits of using sparse representations—retrieval speed and a small memory footprint. 

Moreover, trained end-to-end on a relevance objective, most of the **sparse encoders** estimated word importance well only for a particular domain. [Their out-of-domain accuracy (on datasets they hadn't "seen" during training) was often worse than BM25.](https://arxiv.org/pdf/2307.10488). 

The SOTA of sparse neural retrieval is (Sparse Lexical and Expansion Model) — **SPLADE**. This one surely made its way into retrieval systems-you could [use SPLADE++ in Qdrant with FastEmbed](https://qdrant.tech/documentation/fastembed/fastembed-splade/). 

Yet there's a catch. The "expansion" part of SPLADE's name refers to a technique against another weakness of term-based retrieval—vocabulary mismatch. Where dense encoders succeed in matching a *"fruit bat"* and *"flying fox"*, term-based retrieval is powerless. SPLADE solves this problem by expanding documents and queries with additional fitting terms. However, it leads to SPLADE representations becoming not-so-sparse (so, consequently, not lightweight) and far less explainable as expansion choices are made by machine learning models.

> Big man in a suit of armor. Take that off, what are you?

Experiments showed that SPLADE without its term expansion tells the same old story of sparse encoders — [it performs worse than BM25](https://arxiv.org/pdf/2307.10488).

![sparse-neural-retrieval-problems](/articles_data/minicoil/models_problems.png)

## Eyes on the Prize

It might seem odd that neural models capable of reflecting words relationships in a much more intricate way than straightforward statistical evaluations stemmingof BM25, are, nevertheless, beaten by it (trained with BM25 as a hard negative btw). More training data would have perhaps solved the generalization problem, as it did wonders for current genAI, but there's not so much relevance-objective-labeled data available.

- Should be with a correct tokenizer
- Should be sparse
- Should be adaptable
- Should be lightweight, to keep the intial perspose
- SHould perfprm out of domain (self-supervised)
- Word meanings
- SHould be better than bm25 lmao. Ideally, replace Bm25 + reranking. Rank Better.
- And then it can be a useful part of a hybrid system. (miniCOIL is combinable through dense embedding inference in a single step)

We're not trying to replace hybrid search - (sparse neural retrieval mistake is trying to do everything) we're trying to enchance it without increeasing it's cost!!! Perfect retriever - brod, etc, etc jsut doesn't exist.

For broder retrieval we have dense models.

## miniCOIL

![sparse-neural-retrieval-problems](/articles_data/minicoil/minicoil.png)

[miniCOIL is not the first of our attempts](https://qdrant.tech/articles/bm42/) to look in the direction of better sparse neural retrieval.
The main idea is to keep BM25 as a fallback, and add to it an ability to understand/distinguish meaning of words. It will help with two BM25 problems: (1) inability to distinguish a *"fruit bat"* and a *"baseball bat"* and (2) mixing all the word forms in case if stemming is used in BM25 (then *"inform"*, *"informant"*, *"informational"*, *"informed"* and *"informally"* are all mixed in a one *"inform"* stem)

To get a model performant on out-of-domain data, we're abandon the end-to-end training objectives. Instead of assigning importance score of words based on their meaning and relevance in texts, we take BM25 scoring formula and add to it a semantic component, which encodes words meaning.

## Overview

One number is not enough to encode the meaning of the word in the context. 128 (as ColBERT does) and 32 (as COIL did) is not combining with a sparsitz paradigm.
What if we keep 4 dimensions? Then vectors would be onlz 4 times less sparse than a classical bag-of-words version, 1 token fitting in 4 bytes if needed.
Let's also avoid spending a lot of trainign resources.

1. Cheap inference for hybrid (we already use dense model embeddings)
2. Takes output of any transformer model as an input (if trained)
3. Only needs 1 linear layer of computation to infer 1 embedding. Learn by word, so one can have a mechanism of training a small down-projection layer per word and combining them in one model
4. New words can be dynamically added and fine-tuned individually
5. If the word is not in vocabulary, falls back to Bm25 formula

### It's Going to Work, I Bat

Initially, let's see if there is any sense in it. Let's downproject a word with several meanings with UMAP.
We coudl try to use UMAP projections of a smart model (in our case mixbread) to 4 dimensional space and use them

![bat-umap](/articles_data/minicoil/bat.png)

### Training Triplets
Trainings:
1. No query-to-response datasets
2. Input is the token vector
3. Output should represent context
4. Train skip gram - predict context by the word, predict sentence embedding by embedding - that's how we're going to engrave contextual representation in our 4 dim.





