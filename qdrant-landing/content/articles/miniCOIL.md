---
title: "MiniCOIL: on the Road to Useable Sparse Neural Retrieval"
short_description: "Our attempt to learn from drawbacks of modern sparse neural retrievers"
description: "Introducing miniCOIL -- a lightweight sparse neural retriever capable of understanding words’ meaning in the context & performant on out-of-domain datasets."
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

How would you describe an ideal retriever?

It provides explainable results so we understand why we get what we get. 
It is precise -- the topmost results are the most relevant. 
Simultaneously, we want high recall so as not to miss relevant information. 
The representation of documents in a retrieval system has a minimal memory footprint. 
And, of course, the retrieval process is fast (and furious).

An ideal retriever is the Roman Empire meme of the information retrieval field -- we all think about it daily. 
Let's consider text retrieval, the oldest and the most researched area in the field. Could you name an ideal text retriever?

It seems impossible to make a universal solution even just for text -- by trying to improve one characteristic, one usually has to compromise on another. This is greatly illustrated by sparse neural retrieval -- an approach developed out of attempts to combine the strengths of dense and term-based text retrieval while getting rid of their weaknesses. 

Sparse neural retrieval has great potential -- if we remove from it the burden of being a pitch-perfect for every scenario.

This article describes our step toward sparse neural retrieval *as it should be* -- a field of lightweight term-based retrievers capable of distinguishing word meanings. Learning from the mistakes of previous attempts, we created **miniCOIL**, a new sparse neural candidate to take BM25’s place in hybrid searches. We're happy to share it with you and awaiting your feedback.

## The Good, the Bad and the Ugly

Sparse neural retrieval is not so well known, as opposed to methods it's based on -- term-based and dense retrieval. Their weaknesses motivated this field development, guiding it's evolution. Let's follow its path.

![sparse-neural-retrieval-evolution](/articles_data/minicoil/models_evolution.png)

### Term-based Retrieval

Term-based retrieval usually works with a text as a bag-of-words. These words play roles of different importance, contributing to the overall relevance score between a document and a query.

Famous **BM25** estimates words' contribution based on their 
1. Importance in a particular text (term frequency (TF)-based).
2. Significance within the whole corpus (Inverse Document Frequency (IDF)-based).
It's also based on several parameters reflecting typical text length in the corpus, the exact meaning of which you can check in our [detailed breakdown of the BM25 formula](https://qdrant.tech/articles/bm42/).

Precisely defining word importance within a text is untrivial. 

BM25 is built on the idea that the term importance can be defined statistically. 
It isn’t far from the truth in long texts, where frequent repetition of a certain word signals that the text is related to this concept.
Yet words have different meanings, which drastically affect the text's relevance. Think of *"fruit bat"* and *"baseball bat"*—same frequency, different meaning.

### Dense Retrieval

How to capture the meaning? Bag-of-words models like BM25 assume that words are placed in a text independently, while linguists say:

> You shall know a word by the company it keeps

This idea, together with a motivation to numerically express word relationships, powered the development of the second branch of retrieval -- dense vectors-based. 

Perhaps you remember the famous formula of **word2vec**. *king - man + woman = queen*, quantifiable through vectors encoding these words. The meaning of different words is captured, yet the problem of distinguishing "bats" persists-**word2vec** learns only **static embeddings**. The "bat" vector representation mixes in itself everything from bloodsucking animals to sports matches. 

A major breakthrough in machine learning—**transformer models with attention mechanisms** (for example, **BERT**)—solved distinguishing a word's meaning within the text’s context, making it a part of relevance matching in retrieval. 

What's not ideal here? Attention-based encoders combine (by pooling) word vector representations into a representation of a text chunk. This makes the similarity of texts low-interpretable and less precise. What exactly is the average between a "fruit" and a "bat"? 

We could compare texts based on the similarity of each word's dense vector representation, as **late interaction models** do, but then we get as far as possible from fast retrieval at scale. 
Imagine: each text chunk has at least a few dozen words, each word is encoded as a 128-dimensional vector (as in **ColBERT**), and you have a billion documents in vector storage...

### Sparse Neural Retrieval

So, on one side, we have weak explainability, sometimes leading to frustrating retrieval results, and on the other—lightweight, explainable and fast term-based retrievers like BM25, absolutely incapable of capturing semantics.  

Of course, we want the best of both worlds. A pretty standard answer here is **[hybrid search](https://qdrant.tech/articles/hybrid-search/)**, which fuses the results of dense and term-based retrievers of choice. What could even possibly be not ideal here? Well, it pulls the double duty when it comes to memory and speed.

Sparse neural retrieval was pushed by the idea that this drawback could also be avoided (as all others).

- Why **sparse**? Term-based retrieval can operate on sparse vectors, where each word in a text is assigned a non-zero value (its importance for a text). 
- Why **neural**? Instead of deriving an importance score for a word based on its statistics in a text, let's use machine learning models capable of encoding words' meaning.

Well, most oftenly perfect is the enemy of the good:)

![sparse-neural-retrieval-problems](/articles_data/minicoil/models_problems.png)

[The detailed history of sparse neural retrieval makes a whole other article](https://qdrant.tech/articles/modern-sparse-neural-retrieval/). Summing a big part of it up, there were many attempts to map a word representation produced by a dense encoder to a single-valued importance score, and most of them never saw the real world outside of research papers (**DeepImpact**, **TILDEv2**, **uniCOIL**).

Squishing high-dimensional word representations (usually 768-dimensional BERT embeddings) into a single number inevitably leads to a blended word's meaning. On the other hand, stepping in a late-interaction-like direction with vector-per-word representations, as done by the authors of **Contextualized Inverted Lists**, goes against one of the main benefits of using sparse representations -- retrieval speed and a small memory footprint. 

In general, trained end-to-end on a relevance objective, most of the **sparse encoders** estimated word importance well only for a particular domain. [Their out-of-domain accuracy (on datasets they hadn't "seen" during training) was worse than BM25.](https://arxiv.org/pdf/2307.10488). > 

The SOTA of sparse neural retrieval is (Sparse Lexical and Expansion Model) -- **SPLADE**. This one surely made its way into retrieval systems -- you could [use SPLADE++ in Qdrant with FastEmbed](https://qdrant.tech/documentation/fastembed/fastembed-splade/). 

Yet there's a catch. The "expansion" part of SPLADE's name refers to a technique against another weakness of term-based retrieval -- **vocabulary mismatch**. Where dense encoders succeed in matching a *"fruit bat"* and *"flying fox"*, term-based retrieval is powerless.  

SPLADE solves this problem by expanding documents and queries with additional fitting terms. However, it leads to SPLADE representations becoming not-so-sparse (so, consequently, not lightweight) and far less explainable as expansion choices are made by machine learning models.

> Big man in a suit of armor. Take that off, what are you?

Experiments showed that SPLADE without its term expansion tells the same old story of sparse encoders — [it performs worse than BM25](https://arxiv.org/pdf/2307.10488).

## Eyes on the Prize: Useable Sparse Neural Retrieval

Striving for absolute perfection, the sparse neural retrieval field either produced models performing worse than BM25 (funnily enough, [trained with BM25-based hard negatives](https://arxiv.org/pdf/2307.10488)) — so not-so-"neural", or representations which are not-so-sparse.

What if instead we lift this burden of perfection, but select and fulfill the minimal amount of criteria which a usable sparse neural retriever should fit:

- **It should produce sparse representations (it's in the name!).** It should be lightweight, using perks of a term-based retrieval — for broader semantic search, there are dense retrievers, and they work.
- **It should be better than BM25 at ranking.** BM25 is a decent baseline, but the goal is to make a term-based retriever which is capable of distinguishing word meanings. And it should be better than BM25 in not just one domain -- it should be generalisable. 
- **It should become a useful part of a hybrid search system.** Instead of trying to replace hybrid search, sparse neural retrieval could enhance it further (preferably, without increasing its cost).


## miniCOIL

![sparse-neural-retrieval-problems](/articles_data/minicoil/minicoil.png)

[Haystack doc](https://docs.google.com/document/d/1s-fvhWyMPZxhBtPRngWQ_8LwC1jOQkhkyIToRuGXus8/edit?tab=t.0)

[miniCOIL is not the first of our attempts](https://qdrant.tech/articles/bm42/) to look in the direction of better sparse neural retrieval.
The main idea is to keep BM25 as a fallback, and add to it an ability to understand/distinguish meaning of words. It will help with two BM25 problems: (1) inability to distinguish a *"fruit bat"* and a *"baseball bat"* and (2) mixing all the word forms in case if stemming is used in BM25 (then *"inform"*, *"informant"*, *"informational"*, *"informed"* and *"informally"* are all mixed in a one *"inform"* stem)

To get a model performant on out-of-domain data, we're abandon the end-to-end training objectives. Instead of assigning importance score of words based on their meaning and relevance in texts, we take BM25 scoring formula and add to it a semantic component, which encodes words meaning.

## Overview

One number is not enough to encode the meaning of the word in the context. 128 (as ColBERT does) and 32 (as COIL did) is not combining with a sparsity paradigm.
What if we keep 4 dimensions? Then vectors would be only 4 times less sparse than a classical bag-of-words version, 1 token fitting in 4 bytes if needed.
Let's also avoid spending a lot of training resources.

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





