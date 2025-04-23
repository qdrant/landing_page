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

In general, trained end-to-end on a relevance objective, most of the **sparse encoders** estimated word importance well only for a particular domain. [Their out-of-domain accuracy (on datasets they hadn't "seen" during training) was worse than BM25.](https://arxiv.org/pdf/2307.10488).

The SOTA of sparse neural retrieval is (Sparse Lexical and Expansion Model) -- **SPLADE**. This one surely made its way into retrieval systems -- you could [use SPLADE++ in Qdrant with FastEmbed](https://qdrant.tech/documentation/fastembed/fastembed-splade/). 

Yet there's a catch. The "expansion" part of SPLADE's name refers to a technique against another weakness of term-based retrieval -- **vocabulary mismatch**. Where dense encoders succeed in matching a *"fruit bat"* and *"flying fox"*, term-based retrieval is powerless.  

SPLADE solves this problem by expanding documents and queries with additional fitting terms. However, it leads to SPLADE representations becoming not-so-sparse (so, consequently, not lightweight) and far less explainable as expansion choices are made by machine learning models.

> Big man in a suit of armor. Take that off, what are you?

Experiments showed that SPLADE without its term expansion tells the same old story of sparse encoders — [it performs worse than BM25](https://arxiv.org/pdf/2307.10488).

## Eyes on the Prize: Useable Sparse Neural Retrieval

Striving for absolute perfection, the sparse neural retrieval field either produced models performing worse than BM25 (funnily enough, [trained with BM25-based hard negatives](https://arxiv.org/pdf/2307.10488)) — so not-so-"neural", or representations which are not-so-sparse.

What if instead we lift this burden of being ideal from sparse neural retrievers and select and fulfil the minimal amount of criteria which a usable sparse neural retriever should fit:

- **It should produce sparse representations (it's in the name!).** Inheriting the perks of a term-based retrieval, it should be lightweight and simple. For a broader semantic search, there are dense retrievers, and they work.
- **It should be better than BM25 at ranking.** BM25 is a decent baseline, and the goal is to make a term-based retriever capable of distinguishing word meanings -- what BM25 can't do. Better in not just one domain, the result should be reusable, so able to generalize. 

**Then it could become a useful part of a hybrid search system.** Instead of trying to replace hybrid search and dense encoders within it, sparse neural model could enhance hybrid retrieval -- and ideally, without significantly increasing its cost.

Our "what if" of this kind resulted in a **miniCOIl** sparse neural retriever.

## miniCOIL

![minicoil](/articles_data/minicoil/minicoil.png)

STARTING FROM HERE VERY DRAFT-Y

To get a model performant on out-of-domain data, we should abandon the end-to-end training on relevance objective -- there is not enough data to train a model able to generalize.

### Standing on the Shoulders of BM25

BM25 is a decent baseline in various domains for many years for a reason, so why to discard it, when we can build on top of it, using the proved formula as-is. 

The only thing it lacks is ability to distinguish word meanings.

- It doesn't see a difference between a *"fruit bat"* and a *"baseball bat"*
- When used on with word stemms, it can't distinguish parts of speech. For example, *"inform"*, *"informant"*, *"informational"*, *"informed"* and *"informally"* will be all mixed in a one *"inform"* stem.

So, instead of learning to assign importance score of words based on texts relevance, let's just add a semantic component to BM25, to make it rank better, understanding word meanings.

### Keep it Sparse

How many meanings one word can have?

One number is not enough to express several meanings. Using 128 (as ColBERT) and 32 (as COIL) numbers goes against sparsity criteria.

What if we use four dimensions to describe word's meaning? Then vectors would be only 4 times less sparse than a classical bag-of-words version, 1 token fitting in 4 bytes if needed. 

How many words have much more than 4 meanings? If they do, though, we can choose a bigger number, for example, 8.

### Searching for Meaning

Now we're coming to the part where we need to understand how to get this 4 dimensional encapsulation of a word meaning.

Firstly, we need to somehow get any representation of a word meaning within input, as it will vary each time based on the context Well, re-use and recycle. Dense encoders are capable of generating contextualized token representations. If we're working in a hybrid search scenario, we have to use dense encoder regardless, so why not re-use token high-dimensional representations.

Yet we need a condenced one. Then we can reformulate our task to training a model capable of a meaning preserving dimensionality reduction.

![minicoil-inference](/articles_data/minicoil/minicoil-inference-hybrid.png)

### Words not Tokens!

Transformers provide contextualized token embeddings, not word ones. 

Yet working directly on words is far better for retrieval, say, we want to use a word “retriever” for semantic search in our documentation, since we write about different types of retrievers and this word has several meanings within the documentation.

Transformer tokenizer will break it down into re, #trie and #ver, and we wouldn’t want to work with sparse vectors having separate cells for each of 3 pieces.

Our goal is to work on words, and we will resolve tokens into a word representation in a same way we did for BM42.

### Everything new is well-forgotten old
Our goal is to learn downprojecting contextualized embeddings of one word, so the resulting four dimensional vector reflects word meaning in general, and we could match and compare it with word meanings in our corpora.

We need a target which reflects this context in the best way. We want to re-use this target for different dense encoders used in a hybrid search and we want to re-use this target for training different words.

Well, do you remember word2vec skipgramms? Word's meaning is engraved in its context.

Then let's assume that sentences containing the same words with different meanings (defined by sentence context), should cluster in vector space based on these meanings.

### It's Going to Work, I Bat

Let’s take a look at the word “bat”. 
We took several thousands of sentences containing the word “bat”, sampled from OpenWebText.

Let’s encode these sentences with a smart big transformer, which certainly knows how to capture context (mxbai-embed-large-v1). 
Now let’s downproject them to 2D with UMAP, to see if we can visually distinguish any clusters, containing sentences where “bat” has the same meaning. 

![bat-umap](/articles_data/minicoil/bat.png)

Ok, so we found a working target (sentence embeddings of a powerful transformer), which will help us to guide meaning-in-a-context-preserving downprojection for a transformer-of-choice input.

### How do you eat an elephant? One Bite at a Time

So, we see that for 1 word it seems to work out. Then let's keep it simple and flexible, from the inference, training and explainability perspective. Let's learn to meaningfully compress one word. Then we can scale to all words in vocabulary that we're interested and simply combine (stack) all word encoders in one miniCOIL.

This will come with:

1. Extremely simple architecture: even one layer can suffice.
2. Super fast and easy training process.
3. Cheap and fast inference due to simple architecture.
4. Flexibility to discover and tune underperforming words.
5. Flexibility to extend and shrink vocabulary depending on desired domain.

### A simple encoder and no heavy Decoders

Usually dimensionality reduction in this case would ask for autoencoder architecture.

Yet training encoder + decoder from 4 dimensions to 1024 dimensions of mxbai-embed-large-v1 which was chosen as a target context embedder is too expensive for each word (say, we want to have 30k words in miniCOIl vocab) for each input transformer of choice (we don’t want to stop on jina-small, in an ideal scenario).

So we embed target sentences as-is with mxbai-embed-large-v1 only once (and store them in Qdrant, obviously).

And instead of learning encoder through decoder, we directly learn to align spatial relations (based on a Cosine Distance) of compressed representations based on [triplet loss](https://qdrant.tech/articles/triplet-loss/) guided by our target.

Basically, we use the confidence of a big model (margin between positive and negative examples) & it’s knowledge (what’s positive and what’s negative compared to anchor) to tune our downprojection.

![minicoil-training](/articles_data/minicoil/minicoil-training.png)

### Architecture & Training details

For ones interested, maybe hide

#### Encoder

512 x 4 + Tahn (TBD Picture)

#### miniCOIL vocab
List of 30k commonly used words (after cleaning it out of stop words and 1-2 letter words + stemming)
Fun Fact: Firstly he tried to generate them with ChatGPT, aka “give me 30000 most frequently used english words”. ChatGPT generated a file with:
“Word_1
Word_2
…
Word_30000”
#### Target data
https://paperswithcode.com/dataset/openwebtext a subset of OpenWebText dataset, split into sentences. In the end we had 40 mln sentences, all uploaded to Qdrant with their mxbai-large embeddings and full text word index on sentences, so it’s easy to sample training data per word.

How many sentences do we sample per training a word stem? 8000, random sampled. We calculate a cosine distance matrix between them, and sample from it triplets for a triplet loss (anchor, positive, negative) with a margin of at least 0.1

Additionally we apply augmentation – we take a sentence and cut a target word + 1-3 (randomly chosen number) words around it, forming a new sentence. We use the same similarity score between original and augmented sentences for simplicity. This augmentation allows us to train miniCOIL to grasp context better (in big sentences it gets blended out).

#### Input Data
The same sentences, we filter them based on a word from the train vocabulary and generate this word’s contextualized embedding (in a sentence) as input.

#### Parameters
Epoches - 60
Trained on 1 CPU (!!! – so super cheap to train!) – takes 50 seconds per word;
Optimizer - Adam (1e-4)
Validation - 20%

## Results

#### Validation Loss

Theoretical difference between the small transformer (jina-small) and the “role model” transformer (mixbread-large) is 83% (in 17% jina will make a mistake in distinguishing positive and negative examples in relation to anchor)

Our validation loss gets very close to this number – cc https://github.com/qdrant/miniCOIL/pull/7#issuecomment-2585474300 

### Demo
https://minicoil.qdrant.tech/ here is the demo. It uses miniCOIL vectors, projecting onto 2D first 2 [0-1] and second two [2-3] coordinates of them.

### Benchmarks
We’re running miniCOIL versus BM25 (our implementation) on the BEIR benchmark.
k = 1.2, b = 0.75 (bm25 defaults), avg_len estimated on 50k documents of a dataset.

The main goal was to check on msmarco (it’s the biggest one). It’s important to note that all sparse neural retrieval models are usually trained end-to-end on msmarco, and miniCOIL is not, our goal was to make it as least domain- and dataset-dependent as possible.

BM25 NDCG@10 MsMarco 0.237
MiniCOIL NDCG@10 MsMarco 0.244

miniCOIL performs a little better, which shows that we’re moving in the right direction with our research, dealing successfully with cons of sparse neural retrieval without being domain-dependent

### miniCOIL strengths

1. Allow people to use transformers of their choice, which they will (regardless) use for inference in hybrid search, to cover the dense part of it. miniCOIL should be trained per transformer.
2. Simple architecture, where 1 word – 1 uber small trainable model, leads to EXTREMELY fast inference (and also super fast training) & it doesn’t weigh too much. And EXTREMELY fast and cheap training - 1 CPU 50 seconds per word.
3. No dependency on relevance objective (if document is relevant or irrelevant to the query), we don’t need labelled data for training – so (1) we can find a lot of training data (2) avoid risk of overfitting to a domain, as most sparse retrievers do with MsMarco dataset
4. This 1 word = 1 model allows for flexibility: you want to extend vocabulary of words, usable by miniCOIL, for your particular dataset – just train it for unknown words, don’t have to redo all the training.

### What's next?

link to repo
More transformers
