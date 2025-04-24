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

It's a field with excellent potential -- who would not want to use an approach combining the strengths of dense and term-based text retrieval? Yet it's not so popular. Is it due to the common curse of  *"What looks good on paper is not guaranteed to work in practice?"*

This article describes our step toward sparse neural retrieval *as it should be in practice* -- a field of lightweight term-based retrievers capable of distinguishing word meanings. 

Learning from the mistakes of previous attempts, we created **miniCOIL**, a new sparse neural candidate to take BM25's place in hybrid searches. We're happy to share it with you and awaiting your feedback.

## The Good, the Bad and the Ugly

Sparse neural retrieval is not so well known, as opposed to methods it's based on -- term-based and dense retrieval. Their weaknesses motivated this field development, guiding it's evolution. Let's follow its path.

![sparse-neural-retrieval-evolution](/articles_data/minicoil/models_evolution.png)

### Term-based Retrieval

Term-based retrieval usually works with a text as a bag-of-words. These words play roles of different importance, contributing to the overall relevance score between a document and a query.

Famous **BM25** estimates words' contribution based on their 
1. Importance in a particular text (term frequency (TF)-based).
2. Significance within the whole corpus (Inverse Document Frequency (IDF)-based).
It also has several parameters reflecting typical text length in the corpus, the exact meaning of which you can check in [our detailed breakdown of the BM25 formula](https://qdrant.tech/articles/bm42/).

Precisely defining word importance within a text is untrivial. 

BM25 is built on the idea that the term importance can be defined statistically. 
It isn't far from the truth in long texts, where frequent repetition of a certain word signals that the text is related to this concept. In very short texts (say, chunks for retrieval augmented generation (RAG)), it's less applicable, with TF of 0 or 1. We approached fixing it in our [BM42 modification of BM25 algorithm](https://qdrant.tech/articles/bm42/)

Yet there is one component of a word's importance for retrieval, which is not considered in BM25 at all -- word meaning. The same words have different meanings in different contexts, and it drastically affects the text's relevance. Think of *"fruit **bat**"* and *"baseball **bat**"*—the same importance in the text, different meanings.

### Dense Retrieval

How to capture the meaning? Bag-of-words models like BM25 assume that words are placed in a text independently, while linguists say:

> You shall know a word by the company it keeps

This idea, together with a motivation to numerically express word relationships, powered the development of the second branch of retrieval -- dense vectors-based. Transformer models with attention mechanisms solved distinguishing a word's meaning within the text's context, making it a part of relevance matching in retrieval. 

Yet dense retrieval didn't (and can't) become a replacement for a term-based one. Dense retrievers are capable of broad semantic similarity searches, yet they lack precision when we need results including a specific keyword. 

It's a fool's errand -- trying to make dense retrievers do exact matching, as they're built in a paradigm that every word matches every other word semantically to some extent, and this semantic similarity depends on a training data of a particular model.

### Sparse Neural Retrieval

So, on one side, we have a weak control over matching, sometimes leading to too broad retrieval results, and on the other—lightweight, explainable and fast term-based retrievers like BM25, absolutely incapable of capturing semantics.  

Of course, we want the best of both worlds. A pretty standard answer here is **[hybrid search](https://qdrant.tech/articles/hybrid-search/)**, which fuses the results of dense and term-based retrievers of choice. Yet it pulls double duty when it comes to memory and speed and requires experimentation with balancing the impact of both retrievers.

Sparse neural retrieval was pushed by the idea that this drawback could also be avoided.

- Why **sparse**? Term-based retrieval can operate on sparse vectors, where each word in a text is assigned a non-zero value (its importance in this text). 
- Why **neural**? Instead of deriving an importance score for a word based on its statistics, let's use machine learning models capable of encoding words' meaning.

#### So Why is it Not Widely Used?
![sparse-neural-retrieval-problems](/articles_data/minicoil/models_problems.png)

[The detailed history of sparse neural retrieval makes a whole other article](https://qdrant.tech/articles/modern-sparse-neural-retrieval/). Summing a big part of it up, there were many attempts to map a word representation produced by a dense encoder to a single-valued importance score, and most of them never saw the real world outside of research papers (**DeepImpact**, **TILDEv2**, **uniCOIL**).

Trained end-to-end on a relevance objective, most of the **sparse encoders** estimated word importance well only for a particular domain. [Their out-of-domain accuracy (on datasets they hadn't "seen" during training) was worse than BM25.](https://arxiv.org/pdf/2307.10488).

The SOTA of sparse neural retrieval is (Sparse Lexical and Expansion Model) -- **SPLADE**. This one surely made its way into retrieval systems -- you could [use SPLADE++ in Qdrant with FastEmbed](https://qdrant.tech/documentation/fastembed/fastembed-splade/). 

Yet there's a catch. The "expansion" part of SPLADE's name refers to a technique against another weakness of term-based retrieval -- **vocabulary mismatch**. Where dense encoders succeed in matching a *"fruit bat"* and *"flying fox"*, term-based retrieval is powerless.  

SPLADE solves this problem by **expanding documents and queries with additional fitting terms**. However, it leads to SPLADE inference becoming heavy, produced representations becoming not-so-sparse (so, consequently, not lightweight) and far less explainable as expansion choices are made by machine learning models.

> Big man in a suit of armor. Take that off, what are you?

Experiments showed that SPLADE without its term expansion tells the same old story of sparse encoders — [it performs worse than BM25](https://arxiv.org/pdf/2307.10488).

#### Eyes on the Prize: Useable Sparse Neural Retrieval

Striving for perfection on specific benchmarks, sparse neural retrieval field either produced models performing out-of-domain worse than BM25 (funnily enough, [trained with BM25-based hard negatives](https://arxiv.org/pdf/2307.10488)) or ones based on heavy document expansion, disrupting sparsity.

To be useable in production, the minimal criteria which a sparse neural retriever should fit are:

- **Producing lightweight sparse representations (it's in the name!).** Inheriting the perks of a term-based retrieval, it should be lightweight and simple. For a broader semantic search, there are dense retrievers, and they work.
- **Being better than BM25 at ranking in different domains.** The goal is a term-based retriever capable of distinguishing word meanings -- what BM25 can't do -- and yet keep BM25 out-of-domain time-proven performance.

## miniCOIL

![minicoil](/articles_data/minicoil/minicoil.png)

### The Idea Behind It

#### Inspired by COIL

One of the attempts in the field of Sparse Neural Retrieval -- [Contextualized Inverted Lists (COIL)]((https://qdrant.tech/articles/modern-sparse-neural-retrieval/#sparse-neural-retriever-which-understood-homonyms)) stood out with its approach to word's importance score encoding.

Instead of squishing high-dimensional word representations (usually 768-dimensional BERT embeddings) into a single number, authors downprojected them to a smaller vectors (32 dimensions). These vectors are supposed to be to stored in inverted index (used in term-based retrieval) as-is, and during matching compared through dot product operation. 

This way of defining the importance score captures deeper semantics -- one single number can't perfectly convey all shades of meaning one word can have. Yet this approach didn't become popular due to following problems:

- Inverted indexes are not designed for storing vectors and performing vector operations.
- When trained end-to-end with a relevance objective on [MS MARCO](https://microsoft.github.io/msmarco/), COIL's performance is heavily bound to one domain.
- Additionally, COIL works with tokens, directly reusing transformers tokenizer. Yet working directly with words is far better for term-based retrieval. Say, we want to search for a specific meaning of a word “retriever” in our documentation. COIL will break it down into `re`, `#trie` and `#ver` 32-dimensional vectors and match all three parts separately. 

The best ideas don't start from zero -- let's build on top of COIL, keeping in mind what needs fixing:

1. To get a model performant on out-of-domain data, we should abandon the end-to-end training on relevance objective -- there is not enough data to train a model able to generalize.
2. We should keep representation sparse and reusable in a classic inverted index.
3. We should fix tokenization. This one is easy, as it was already done in several sparse neural retrievers, and [we also learned to do it in our BM42](https://qdrant.tech/articles/bm42/#wordpiece-retokenization).

#### Standing on the Shoulders of BM25

BM25 is a decent baseline in various domains for many years for a reason, so why to discard the time-proved formula. 

The only thing it lacks is ability to distinguish word meanings.

- It doesn't see a difference between a *"fruit bat"* and a *"baseball bat"*
- When used on with word stemms, it can't distinguish parts of speech. For example, *"inform"*, *"informant"*, *"informational"*, *"informed"* and *"informally"* will be all mixed in a one *"inform"* stem.

So, instead of learning to assign importance score of words based on texts relevance, let's just add a semantic component to BM25, to make it rank better, understanding word meanings. To learn word meanings we don't need labeled retrieval-based datasets, as word meaning can be leanred from its context -- dense encoders are a proof of this.

#### Keeping it Sparse

TBD PICTURE OF MAKING SPARSE VECTOR OUT OF DENSE

The trick is simple - a small enough dense vector can be a part of a big sparse one. Instead of doing dot product separately for each word vector, we can do it once for all of them -- on text sparse representation. 

Yet 32 values per word is a lot -- our vectors will become 32 times less sparse. How many separate meanings one word can have? Can you give many examples of a word with 32 non-intersecting meanings?

Feels like we can use much less numbers, for example, four. Then vectors would be only 4 times less sparse than a classical bag-of-words version, 1 token fitting in 4 bytes if needed. 

### How to Make miniCOIL

Now we're coming to the part where we need to understand how to get this low dimensional encapsulation of a word meaning.

To capture contextual meaning of words in input data, we get a contextuazlied word embedding from a dense encoder. Yet it's high-dimensional, and need we need to perform a meaning preserving dimensionality reduction, so the word's low dimensional representation is comparable within an encoded corpora. 

We don't want to depend on corpora and, moreover, we would want find a way to easily adapt to different dense encoders, as they're suitable for different domains.

What could we possibly choose as a training target?

#### Everything new is well-forgotten old

We need a target which reflects word's context in the best way. We want to be able to re-use this target for different dense encoders and we want to efficiently recycle this target for training different words.

Well, why to reinvent the wheel, when linguistics and based on this concept dense retrieval, teaches us that word's meaning is hidden in its context.
Let's assume that sentences containing the same words with different meanings (defined by sentence context), should cluster in vector space based on these meanings.

If it's true, we could encode humongous amount of various sentences with a sophisticated smart model, perfectly capturing contexts, and reuse this pool for downprojection training.
- It's unlabeled data, so we can get truly huge amounts of it, which will help with generalization. For example, we could use CommonCrawl or OpenWebText.
- It will have to be inferenced with a heavy model once and could be used for training different encoder-based downprojections.

So, will it work?

#### It's Going to Work, I Bat

Let’s take a look at the word “bat”. 
We took several thousands of sentences containing the word “bat”, sampled from OpenWebText.

We encoded these sentences with a smart big transformer, which certainly knows how to capture context (mxbai-embed-large-v1). 

Now let’s downproject them to 2D with UMAP, to see if we can visually distinguish any clusters, containing sentences where “bat” has the same meaning. 

![bat-umap](/articles_data/minicoil/bat.png)

Ok, so we found a working target (sentence embeddings of a powerful transformer), which will help us to guide meaning-in-a-context-preserving downprojection for a transformer-of-choice input.

#### How do you eat an elephant? One Bite at a Time

Let's keep it simple and flexible, from the inference, training and explainability perspective. Let's learn to meaningfully compress one word. Then we can scale to all words in vocabulary that we're interested and simply combine (stack) all word encoders in one miniCOIL.

This will come with:

1. Extremely simple architecture: even one layer can suffice.
2. Super fast and easy training process.
3. Cheap and fast inference due to simple architecture.
4. Flexibility to discover and tune underperforming words.
5. Flexibility to extend and shrink vocabulary depending on desired domain.

#### A simple encoder and no heavy Decoders

Usually dimensionality reduction in this case would ask for autoencoder architecture.

Yet training encoder (for dimensionality reduction) and decoder (to throw away later) from 4 dimensions to 1024 dimensions of mxbai-embed-large-v1 is too expensive -- for each word (say, we want to have 30k words in miniCOIl vocab) for each input transformer of choice.

Then, instead of learning encoder through decoder, let's directly learn to align spatial relations (calculated through Cosine Distance -- as dense encoders, as, for example, mxbai, are taught to operate on it) of compressed representations based on [triplet loss](https://qdrant.tech/articles/triplet-loss/) guided by our target.

We want to train a simple dimensionality reduction model, one per word. For that it's enough to have one layer with Tahn actication (so we can comfortably use COSINE similarity to evaluate and compare spatial relations).

TBD ENCODER PIC 512 x 4 + Tahn

Then, we use the confidence of a big model (margin between positive and negative examples) & it’s knowledge (what’s positive and what’s negative compared to anchor) to tune our downprojection layer.

![minicoil-training](/articles_data/minicoil/minicoil-training.png)

#### Realization Details 

TBD : make it probably into a table with specs

**Input encoder**: jina-small (512x dim)

**miniCOIL vocab**

List of 30k commonly used words (after cleaning it out of stop words and 1-2 letter words + stemming)
Fun Fact: Firstly he tried to generate them with ChatGPT, aka “give me 30000 most frequently used english words”. ChatGPT generated a file with:
“Word_1
Word_2
…
Word_30000”

**Target data**

https://paperswithcode.com/dataset/openwebtext a subset of OpenWebText dataset, split into sentences. In the end we had 40 mln sentences, all uploaded to Qdrant with their mxbai-large embeddings and full text word index on sentences, so it’s easy to sample training data per word.

How many sentences do we sample per training a word stem? 8000, random sampled. We calculate a cosine distance matrix between them, and sample from it triplets for a triplet loss (anchor, positive, negative) with a margin of at least 0.1

Additionally we apply augmentation – we take a sentence and cut a target word + 1-3 (randomly chosen number) words around it, forming a new sentence. We use the same similarity score between original and augmented sentences for simplicity. This augmentation allows us to train miniCOIL to grasp context better (in big sentences it gets blended out).

**Parameters**
Epoches - 60
Trained on 1 CPU (!!! – so super cheap to train!) – takes 50 seconds per word;
Optimizer - Adam (1e-4)
Validation - 20%

### Results

#### Validation Loss

Theoretical difference between the small transformer (jina-small) and the “role model” transformer (mixbread-large) is 83% (in 17% jina will make a mistake in distinguishing positive and negative examples in relation to anchor)

Our validation loss gets very close to this number – cc https://github.com/qdrant/miniCOIL/pull/7#issuecomment-2585474300 

#### Demo
https://minicoil.qdrant.tech/ here is the demo. It uses miniCOIL vectors, projecting onto 2D first 2 [0-1] and second two [2-3] coordinates of them.

#### Benchmarks
We’re running miniCOIL versus BM25 (our implementation) on the BEIR benchmark.
k = 1.2, b = 0.75 (bm25 defaults), avg_len estimated on 50k documents of a dataset.

The main goal was to check on msmarco (it’s the biggest one). It’s important to note that all sparse neural retrieval models are usually trained end-to-end on msmarco, and miniCOIL is not, our goal was to make it as least domain- and dataset-dependent as possible.

BM25 NDCG@10 MsMarco 0.237
MiniCOIL NDCG@10 MsMarco 0.244

miniCOIL performs a little better, which shows that we’re moving in the right direction with our research, dealing successfully with cons of sparse neural retrieval without being domain-dependent

## Conclusion 
### miniCOIL strengths

1. Allow people to use transformers of their choice, which they will (regardless) use for inference in hybrid search, to cover the dense part of it. miniCOIL should be trained per transformer.
2. Simple architecture, where 1 word – 1 uber small trainable model, leads to EXTREMELY fast inference (and also super fast training) & it doesn’t weigh too much. And EXTREMELY fast and cheap training - 1 CPU 50 seconds per word.
3. No dependency on relevance objective (if document is relevant or irrelevant to the query), we don’t need labelled data for training – so (1) we can find a lot of training data (2) avoid risk of overfitting to a domain, as most sparse retrievers do with MsMarco dataset
4. This 1 word = 1 model allows for flexibility: you want to extend vocabulary of words, usable by miniCOIL, for your particular dataset – just train it for unknown words, don’t have to redo all the training.

**A useful part of a hybrid search system.** Instead of trying to replace hybrid search and dense encoders within it, miniCOIL could enhance hybrid retrieval -- and basically without significantly increasing its cost. Re-use and recycle. Dense encoders are capable of generating contextualized token representations. If we're working in a hybrid search scenario, we have to use dense encoder regardless.

![minicoil-inference](/articles_data/minicoil/minicoil-inference-hybrid.png)

### What's next?

link to repo
See it in inference (?)
More transformers
