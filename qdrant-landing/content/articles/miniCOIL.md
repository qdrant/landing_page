---
title: "MiniCOIL: on the Road to Useable Sparse Neural Retrieval"
short_description: "Our attempt to learn from drawbacks of modern sparse neural retrievers"
description: "Introducing miniCOIL -- a lightweight sparse neural retriever capable of understanding words’ meaning in the context & performant on out-of-domain datasets."
social_preview_image: /articles_data/minicoil/social-preview.jpg
preview_dir: /articles_data/minicoil/preview
weight: -190
author: Evgeniya Sukhodolskaya
date: 2025-04-23T12:00:00+03:00
draft: false
keywords:
  - hybrid search
  - sparse embeddings
  - miniCOIL
  - bm25
category: machine-learning
---

Have you ever heard of sparse neural retrieval? If so, have you used it in production? 

It's a field with excellent potential -- who would not want to use an approach combining the strengths of dense and term-based text retrieval? Yet it's not so popular. Is it due to the common curse of  *"What looks good on paper is not going work in practice"*?

This article describes our step towards sparse neural retrieval *as it should be* -- lightweight term-based retrievers capable of distinguishing word meanings. 

Learning from the mistakes of previous attempts, we created **miniCOIL**, a new sparse neural candidate to take BM25's place in hybrid searches. We're happy to share it with you and awaiting your feedback.

## The Good, the Bad and the Ugly

Sparse neural retrieval is not so well known, as opposed to methods it's based on -- term-based and dense retrieval. Their weaknesses motivated this field development, guiding it's evolution. Let's follow its path.

![sparse-neural-retrieval-evolution](/articles_data/minicoil/models_evolution.png)

### Term-based Retrieval

Term-based retrieval usually works with a text as a bag-of-words. These words play roles of different importance, contributing to the overall relevance score between a document and a query.

Famous **BM25** estimates words' contribution based on their 
1. Importance in a particular text -- Term Frequency (TF) based.
2. Significance within the whole corpus -- Inverse Document Frequency (IDF) based.

It also has several parameters reflecting typical text length in the corpus, the exact meaning of which you can check in [our detailed breakdown of the BM25 formula](https://qdrant.tech/articles/bm42/).

Precisely defining word importance within a text is untrivial. 

BM25 is built on the idea that the term importance can be defined statistically. 
It isn't far from the truth in long texts, where frequent repetition of a certain word signals that the text is related to this concept. In very short texts -- say, chunks for Retrieval Augmented Generation (RAG) -- it's less applicable, with TF of 0 or 1. We approached fixing it in our [BM42 modification of BM25 algorithm](https://qdrant.tech/articles/bm42/).

Yet there is one component of a word's importance for retrieval, which is not considered in BM25 at all -- word meaning. The same words have different meanings in different contexts, and it affects the text's relevance. Think of *"fruit **bat**"* and *"baseball **bat**"*—the same importance in the text, different meanings.

### Dense Retrieval

How to capture the meaning? Bag-of-words models like BM25 assume that words are placed in a text independently, while linguists say:

> You shall know a word by the company it keeps (с) smbd smart

This idea, together with a motivation to numerically express word relationships, powered the development of the second branch of retrieval -- dense vectors-based. Transformer models with attention mechanisms solved distinguishing a word's meaning within the text's context, making it a part of relevance matching in retrieval. 

Yet dense retrieval didn't (and can't) become a complete replacement for a term-based one. Dense retrievers are capable of broad semantic similarity searches, yet they lack precision when we need results including a specific keyword. 

It's a fool's errand -- trying to make dense retrievers do exact matching, as they're built in a paradigm that every word matches every other word semantically to some extent, and this semantic similarity depends on a training data of a particular model.

### Sparse Neural Retrieval

So, on one side, we have a weak control over matching, sometimes leading to too broad retrieval results, and on the other—lightweight, explainable and fast term-based retrievers like BM25, incapable of capturing semantics.  

Of course, we want the best of both worlds. 

[ REMOVE -- NICE TO GET THIS IDEAL MODEL WHICH CAN DO BOTH
  
  A pretty standard answer here is **[hybrid search](https://qdrant.tech/articles/hybrid-search/)**, which fuses the results of dense and term-based retrievers of choice. Yet it pulls double duty when it comes to memory and speed and requires experimentation with balancing the impact of both retrievers.

Sparse neural retrieval was pushed by the idea that this drawback could also be avoided.

]

- Why **sparse**? Term-based retrieval can operate on sparse vectors, where each word in a text is assigned a non-zero value (its importance in this text). 
- Why **neural**? Instead of deriving an importance score for a word based on its statistics, let's use machine learning models capable of encoding words' meaning.

**So Why is it Not Widely Used?**
![sparse-neural-retrieval-problems](/articles_data/minicoil/models_problems.png)

The detailed history of sparse neural retrieval makes [a whole other article](https://qdrant.tech/articles/modern-sparse-neural-retrieval/). Summing a big part of it up, there were many attempts to map a word representation produced by a dense encoder to a single-valued importance score, and most of them never saw the real world outside of research papers (**DeepImpact**, **TILDEv2**, **uniCOIL**).

Trained end-to-end on a relevance objective, most of the **sparse encoders** estimated word importance well only for a particular domain. Their out-of-domain accuracy, on datasets they hadn't "seen" during training, [was worse than BM25.](https://arxiv.org/pdf/2307.10488).

The SOTA of sparse neural retrieval is (Sparse Lexical and Expansion Model) -- **SPLADE**. This one surely made its way into retrieval systems -- you could [use SPLADE++ in Qdrant with FastEmbed](https://qdrant.tech/documentation/fastembed/fastembed-splade/). 

Yet there's a catch. The "expansion" part of SPLADE's name refers to a technique against another weakness of term-based retrieval -- **vocabulary mismatch**. Where dense encoders succeed in matching a *"fruit bat"* and *"flying fox"*, term-based retrieval is powerless.  

SPLADE solves this problem by **expanding documents and queries with additional fitting terms**. However, it leads to SPLADE inference becoming heavy, TWO SENTENCES produced representations becoming not-so-sparse (so, consequently, not lightweight) and far less explainable as expansion choices are made by machine learning models.

> Big man in a suit of armor. Take that off, what are you?

Experiments showed that SPLADE without its term expansion tells the same old story of sparse encoders — [it performs worse than BM25](https://arxiv.org/pdf/2307.10488).

## Eyes on the Prize: Useable Sparse Neural Retrieval

Striving for perfection on specific benchmarks, the sparse neural retrieval field either produced models performing out-of-domain worse than BM25 (ironically, [trained with BM25-based hard negatives](https://arxiv.org/pdf/2307.10488)) or ones based on heavy document expansion, lowering sparsity.

So, to be usable in production, the minimal criteria a sparse neural retriever should meet are:

- **Producing lightweight sparse representations (it's in the name!).** Inheriting the perks of term-based retrieval, it should be lightweight and simple. For broader semantic search, there are dense retrievers, and they work.
- **Being better than BM25 at ranking in different domains.** The goal is a term-based retriever capable of distinguishing word meanings — what BM25 can't do — preserving BM25's out-of-domain, time-proven performance.

![minicoil](/articles_data/minicoil/minicoil.png)

### Inspired by COIL

One of the attempts in the field of Sparse Neural Retrieval — [Contextualized Inverted Lists (COIL)](https://qdrant.tech/articles/modern-sparse-neural-retrieval/#sparse-neural-retriever-which-understood-homonyms) — stands out with its approach to term weights encoding.

Instead of squishing high-dimensional token representations (usually 768-dimensional BERT embeddings) into a single number, COIL authors project them to smaller vectors of 32 dimensions. They propose storing these vectors in **inverted lists** of an **inverted index** (used in term-based retrieval) as is and comparing vector representations through dot product.

This approach captures deeper semantics — one number can't perfectly convey all shades of meaning that one word can have. Yet it didn't catch on, and COIL didn't become popular, presumably due to the following reasons:

- Inverted indexes are usually not designed to store vectors and perform vector operations.
- Trained end-to-end with a relevance objective on [MS MARCO dataset](https://microsoft.github.io/msmarco/), COIL's performance is heavily domain-bound.
- Additionally, COIL operates on tokens, reusing BERT's tokenizer. Yet, working at a word level is far better for term-based retrieval. Say we want to search for a *"retriever"* in our documentation. COIL will break it down into `re`, `#trie`, and `#ver` 32-dimensional vectors and match all three parts separately -- not so convenient.

However, COIL representations allow distinguishing homographs, a skill BM25 lacks. The best ideas don't start from zero. We could try to **build on top of COIL, keeping in mind what needs fixing**:

1. To get a model performant on out-of-domain data, we should abandon end-to-end training on a relevance objective — there is not enough data to train a model able to generalize.
2. We should keep representations sparse and reusable in a classic inverted index.
3. We should fix tokenization. This problem is the easiest one to solve, as it was already done in several sparse neural retrievers, and [we also learned to do it in our BM42](https://qdrant.tech/articles/bm42/#wordpiece-retokenization).

### Standing on the Shoulders of BM25

BM25 has been a decent baseline across various domains for many years -- and for a good reason. So why discard a time-proven formula?

Instead of learning to assign words' importance scores based on query-document relevance, let's add a semantic COIL-inspired component to BM25 scoring. Then, if we manage to capture a word's meaning, our solution alone could work like BM25 combined with a semantically aware reranker -- or, in other words:

- It could see the difference between a *"fruit **bat**"* and a *"baseball **bat**"*
- When used with word stems, it could distinguish parts of speech. For example, *"inform"*, *"informant"*, *"informational"*, *"informed"*, and *"informally"* won't get lost in one *"**inform**"* stem.

$$
\text{score}(D,Q) = \sum_{i=1}^{N} \text{IDF}(q_i) \cdot \text{Importance}^{q_i}_{D} \cdot \text{Meaning}^{q_i \times D}_{\text{semantic match}}
$$

We won't need labelled retrieval-related datasets to acquire this semantic component as word meaning is hidden in the surrounding context, aka in any texts including this word. 
And if our model stumbles upon a word it hasn't "seen" during training, we can just fall back to the original BM25 formula!

### Bag-of-words in 4D

COIL uses 32 values to describe a term. Do we need this many? How many words with 32 separate meanings could you name without additional research? Eight or even four seem already sufficient.

Yet, even if we use fewer values in COIL representations, the initial problem of dense vectors not fitting into a classical inverted index persists.  
Unless... We do a simple trick!

TBD IMAGE 1D -> 4D BAG-OF-WORD

Imagine a bag-of-words sparse vector. Every word from the vocabulary takes up one cell. If the word is present in the encoded text — we assign some weight; if it isn't — it equals zero.

If we have a mini dense vector describing a word's meaning, for example, in 4D semantic space, we could just dedicate 4 consecutive cells for this word in the sparse vector, one cell per "meaning" dimension. If we don't, we could fall back to a classic one-cell description with a pure BM25 score.

**Such representation of mini COIL vectors can be used in any standard inverted index.**

## Training miniCOIL

Now we're coming to the part where we need to somehow get this low dimensional encapsulation of a word meaning in context.

We want to work smarter, not harder, and rely as much as possible on time proven solutions. Dense encoders are good at encoding word's meaning in its context, it would be convenient to reuse their output. Moreover, we could kill two birds with one stone, if we wanted to add miniCOIL to hybrid search -- where dense encoders inference is done regardless. 

Yet dense encoders outputs are high-dimensional, so need we need to perform **meaning-in-context preserving dimensionality reduction**. The goal is to:

- Avoid relevance objective and dependance on labelled datasets;
- Find reflecting words' meanings spatial relations target, reusable for different dense encoders;
- Use the simplest architecture possible.

### Spatial Relations of Meaning

What does it mean, meaning-in-context preserving dimensionality reduction? We want miniCOIL vectors to be comparable in their low dimensional vector space, *fruit **bat*** and *vampire **bat*** closer to each other than to *baseball **bat***, while correctly preserving input's meaning.

We need something to calibrate words meaning-dependent spatial relations on, when reducing the dimensionality of input context vectors. This target should reflect spatial relations though similar metric as input dense encoder (usually, COSINE similarity), be precise in capturing word meanings and reusable.

Well, why to reinvent the wheel, when linguistics taught us that word's meaning is in its context, and there are dense encoders (usually, on the bigger side), which are able to reflect these context relationships pretty well.

Let's assume that sentences sharing one word should cluster in vector space in a way, that each cluster contains sentences with this word in one specific meaning. If it's true, we could encode a humongous amount of various sentences with a sophisticated dense encoder, and form a reusable spatial target:

- This approach doesn't require labelled data, so we can get truly huge amounts of it, which will help with generalization. For example, we could use data from web, as [OpenWebText dataset](https://paperswithcode.com/dataset/openwebtext)
- We could use a sophisticated model once, embedding all of these sentences. Once inferenced, these embeddings can guide dimensionality reduction for various input dense encoders.
- Using sentences allows to reuse a spatial relations target for different words within one sentence. We could use word contextualized embeddings directly, however, then data preparation should have been much more complicated and required far bigger storage.

### It's Going to Work, I Bat

Let’s test our assumption and take a look at the word “bat”. 
We took several thousands of sentences containing the word “bat”, which we sampled from OpenWebText and encoded with a `mxbai-embed-large-v1` encoder, selected by its decent performace on MTEB benhcmark among English language models.

Let's project the result to 2D, to see if we can visually distinguish any clusters, containing sentences where “bat” has the same meaning.

![bat-umap](/articles_data/minicoil/bat.png)
CAPTION: Looks like a bat

The result has to two big clusters related to *"bat"* as an animal and *"bat"* as a sports equipment, and two smaller ones at their intersection, related to fluttering motion and *"bat"* as verb in sports. As a bonus, 2D projection also resembles a bat.

Or course, meanings blend into each other, yet points close describe the same "type" of bats. Then it seems like we found a working target, which will help us to guide meaning-in-a-context-preserving projection for a dense encoder input of our choice.

#### Training Objective

Let's continue dealing with *"bats"*. We have pool of sentences containing word *"bat"* in different meanings, from which we get an input -- *"bat"* contextualized embeddings from a dense encoder of choice -- and spatial relations target -- embedded with `mxbai-embed-large-v1` sentences.

We want to align spatial relations of compressed from input representations based on our target. For that, as a training objective, we can select minimization of the [triplet loss](https://qdrant.tech/articles/triplet-loss/). We rely on the confidence (size of margin) of a `mxbai-embed-large-v1` to guide our projection model.

![minicoil-training](/articles_data/minicoil/minicoil-training.png)

Since we're dealing with one word, it's enough to train one projection layer (Input Transformer DIM x miniCOIL vector DIM) with Tahn activation on top -- this choice of activation function is due to using COSINE similarity as measure of spatial relations.

<aside role="status">
Since miniCOIL vectors are trained to reflect spatial relationships based on a COSINE metric, they should be normalized before inserting them in bag-og-words sparse vectors, which are compared thought dot product.
</aside>

### Eating Elephant One Bite at a Time

We have an idea how to train a dimensionality reduction layer for one word. Let's keep it simple and flexible, from the inference, training and explainability perspective -- keep models on per-word level.

This will come with:

1. Extremely simple architecture: even one layer can suffice.
2. Super fast and easy training process.
3. Cheap and fast inference due to simple architecture.
4. Flexibility to discover and tune underperforming words.
5. Flexibility to extend and shrink vocabulary depending on desired domain.

Then we can scale to all words in vocabulary that we're interested in and simply combine (stack) all word models in one miniCOIL model.

### Realization Details 

The code of the training approach sketched above is open sourced [in this repository](https://github.com/qdrant/miniCOIL)

Specific characteristics of the existing model are the following:

| Component | Description |
|:---|:---|
| **Input Dense Encoder** | `jina-embeddings-v2-small-en` (512 dim) |
| **miniCOIL Vectors Size** | 4 dimensions. |
| **Dimensionality Reduction Layer** | 512x4 + Tanh() |
| **miniCOIL Vocabulary** | List of 30,000 most common English words, cleaned out of stop words and words of size smaller than 3 letters and stemmed, [taken from here](https://github.com/arstgit/high-frequency-vocabulary/tree/master). |
| **Target Data** | 40 million sentences encoded with `mxbai-embed-large-v1` -- a random subset of [OpenWebText dataset](https://paperswithcode.com/dataset/openwebtext). To sample training data, we uploaded sentences and their embeddings to Qdrant, and built a [full text index](https://qdrant.tech/documentation/concepts/indexing/#full-text-index) on sentences with a tokenizer `word`. |
| **Data per Word** | We sample 8000 sentences per word, calculate a cosine distance matrix between them, and use it to get triplets with a margin of at least 0.1.<br>Additionally we apply augmentation – we take a sentence and cut a target word + 1-3 (randomly chosen number) words around it, forming a new sentence. We use the same similarity score between original and augmented sentences for simplicity. This augmentation allows us to train miniCOIL to grasp context better (in big sentences it gets blended out). |
| **Training Parameters** | - Epochs: 60<br>- Optimizer: Adam with a learning rate of 1e-4<br>- Validation: 20% |

**Each word was trained on 1 CPU, and it took approximately fifty seconds per word to train.**

## Results

### Validation Loss

Direct difference between the input transformer `jina-embeddings-v2-small-en` and the “role model” transformer `mxbai-embed-large-v1` is 83% (in 17% `jina-embeddings-v2-small-en` will make a mistake in distinguishing positive and negative examples in relation to anchor if compared to `mxbai-embed-large-v1`)

Our validation loss gets very close to this theoretical limit. Depending on output size (???? WHICH) we get from 60(76%) to 38(85%) failed triplets per batch (256).

![validation-loss](/articles_data/minicoil/validation_loss.png)

### Benchmarking
We’re running miniCOIL versus BM25 (our implementation, suitable for vector storage) on the BEIR benchmark.
Code of benhmark can be seen here [FOR THAT WE NEED A PR APPROVED AND MERGED].

k = 1.2, b = 0.75 (bm25 defaults), avg_len estimated on 50k documents of a dataset.
As a metric we use NDCG@10, as we're interested in ranking performance of miniCOIL compared to BM25.

It’s important to note that all sparse neural retrieval models are usually trained end-to-end on msmarco, and miniCOIL is not, as our goal was to make it as least domain- and dataset-dependent as possible, so measuring on msmarco in this case means checking out-of-domain performance

| Dataset    | BM25 (NDCG@10) | MiniCOIL (NDCG@10) |
|:-----------|:--------------|:------------------|
| MS MARCO   | 0.237          | 0.244              |
| NQ         | -              | -                  |
| Quora      | -              | -                  |
| FiQA-2018  | -              | -                  |

miniCOIL performs better than BM25 in different domains, without being trained specifically on them. It shows that we’re moving in the right direction of making sparse neural retrieval usable.

ANYTHING ELSE TO SAY?
SMTH ABOUT TIME OF INFERENCE?
WE ARE GOING TO EXTEND IT? WE ARE HAPPY TO MEASURE ON ANYTHING ELSE, AREN'T WE?

### Demo
https://minicoil.qdrant.tech/ here is the demo. It uses miniCOIL vectors, projecting onto 2D first 2 [0-1] and second two [2-3] coordinates of them.

DO WE NEED IT HERE? DO WE NEED TO WRITE MORE? PROVIDE EXAMPLES? TELL WHICH MODEL IT USES?

## Key Takeaways

This article portays miniCOIL as an attempt to make sparse neural retrieval useable. 
So, when it's the right tool for the right job?

If you're in a need of precise exact matching, and BM25 is not satisfying you -- you know that you corpora contains right answers and yet BM25 ranking is off, returning top results of a wrong meaning, then miniCOIL is a way to go. It works as BM25 with word meaning understanding. If you struggle to match results exactly, as they're expressed in different words, add dense encoders to retrieval.

miniCOIL is beneficial to use as a part of a hybrid search system, as it enhances it without any noticeable increase in cost of usage, reusing output of a dense encoder.

### Why We Can Call it Useable

This approach to training sparse neural encoder:

1. Allows fully reusing dense encoder output, and, therefore, easily adaptable to different dense encoders. This also makes it's a free enchancement of a hybrid search solution.
2. Has a simple architecture, 1 word – 1-layer model, which leads to extremely fast inference and traing and low memory footprint.
3. Is not dependent on relevance objective, and doesn't require labelled data for training. Since it can be trained in a self-supervised manner, it's scalable and genelizeable.
4. Is fleaxible due to training on a word-level. If you want to extend miniCOIL's vocabulary for your particular use case, you could simply extend training to unknown words.

### What's next?

See it in FastEmbed, Inference (?)

DO WE PROMISE ANYTHING?

And most importantly, you using it in practice, as we created it useable.
