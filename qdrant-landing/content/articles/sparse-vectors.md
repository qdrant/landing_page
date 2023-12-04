---
title: "Sparse Vectors: Interpretable and Scalable Document Ranking"
short_description: "Sparse vectors are several times more efficient than dense vectors, making them a great choice for large-scale systems. They're also interpretable, which is a huge advantage over dense vectors."
description: "Sparse vectors are a representation where each dimension corresponds to a word or subword, greatly aiding in interpreting document rankings. This clarity is why sparse vectors are essential in modern search and recommendation systems, offering an advantage over embedding or dense vectors."
social_preview_image: /articles_data/sparse-vectors/social_preview.png
small_preview_image: /articles_data/sparse-vectors/binary-quantization-icon.svg
preview_dir: /articles_data/sparse-vectors/preview
weight: -40
author: Nirant Kasliwal
author_link: 
date: 2023-12-06T13:00:00+03:00
draft: false
keywords:
  - vector search
  - SPLADE
  - sparse vectors
  - efficient neural search
---

# TK means to be filled in

# Sparse Vectors for Scalable Document Ranking
Imagine a search engine where only the most relevant chapters across books for your search are displayed. This is what sparse vectors enable for text. 

## What is a Sparse Vector?

Consider a simplified example of 2 documents, each with 200 words. A dense vector would have several hundred non-zero values, whereas a sparse vector would have only 20 non-zero values.

```python
dense = [0.2, 0.3, 0.5, 0.7.....] # several hundred floats
sparse = [331, 14136] 
```

The numbers 331 and 14136 map to specific tokens in the vocabulary e.g. `['chocolate', 'icecream']`. The rest of the values are zero. This is why it's called a sparse vector.

The tokens aren't always words though, sometimes they can be sub-words: `['ch', 'ocolate]` too.

They're pivotal in information retrieval, especially in ranking and search systems. BM25, a standard ranking function used by search engines like [Elasticsearch](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables), exemplifies this. BM25 calculates the relevance of documents to a given search query. 

BM25's capabibilities are well proven, but it has its limitations. For example, it often needs building complex dictionary of synonyms, which is where sparse vectors come in. Sparse vectors excel in handling large text data, making them crucial in modern data processing and an improvement over more well known methods like BM25.

# Understanding Sparse Vectors
Sparse vectors are like the Marie Kondo of data—keeping only what sparks joy (or relevance, in this case). 

Sparse Vectors are a representation where each dimension corresponds to a word or subword, greatly aiding in interpreting document rankings. This clarity is why sparse vectors are essential in modern search and recommendation systems, offering an advantage over embedding or dense vectors. 

Dense vectors from models like OpenAI Ada-002 or Sentence Transformers contain non-zero values for every element, whereas sparse vectors focus on relative word frequencies per document, with most values being zero. This results in a more efficient and interpretable system, especially in text-heavy applications like search.

# SPLADE

Let's checkout [SPLADE](https://europe.naverlabs.com/research/computer-science/splade-a-sparse-bi-encoder-bert-based-model-achieves-effective-and-efficient-full-text-document-ranking/), an excellent way to make sparse vectors. Let's look at some numbers first. Higher is better:

| Model              | MRR@10 (MS MARCO Dev) | Type           |
|--------------------|---------|----------------|
| BM25               | 0.184   | Sparse |
| TCT-ColBERT        | 0.359   | Dense  | 
| doc2query-T5 [link](https://github.com/castorini/docTTTTTquery)  | 0.277   | Sparse |
| SPLADE             | 0.322   | Sparse |
| SPLADE-max         | 0.340   | Sparse |
| SPLADE-doc         | 0.322   | Sparse |
| DistilSPLADE-max   | 0.368   | Sparse |

All numbers are from [SPLADEv2](https://arxiv.org/abs/2109.10086). MRR is [Mean Reciprocal Rank](https://www.wikiwand.com/en/Mean_reciprocal_rank#References), a standard metric for ranking. [MS MARCO](https://microsoft.github.io/MSMARCO-Passage-Ranking/) is a dataset for evaluating ranking and retrieval for passages.  

SPLADE is quite flexible as a method, with regularization knobs that can be tuned to obtain [different models](https://github.com/naver/splade) as well: 

> SPLADE is more a class of models rather than a model per se: depending on the regularization magnitude, we can obtain different models (from very sparse to models doing intense query/doc expansion) with different properties and performance. 

First, let's look at how to create a sparse vector. Then, we'll look at the concepts behind SPLADE.

# Creating a Sparse Vector

We'll explore two different ways to create a sparse vector. The first is a simple way to create a sparse vector from the same model for both document and query. The second is higher performance way to create a sparse vector from dedicated document and query encoders:

## TK 1. Same Document and Query Encoder

```python
from transformers import AutoTokenizer, AutoModel
import torch

```

## TK 2. Different Document and Query Encoder


naver/efficient-splade-VI-BT-large-doc
naver/efficient-splade-VI-BT-large-query

## Why SPLADE works? Term Expansion

Consider a query "solar energy advantages". SPLADE might expand this to include terms like "renewable," "sustainable," and "photovoltaic," which are contextually relevant but not explicitly mentioned. This process is called term expansion, and it's a key component of SPLADE. 

SPLADE learns the query/document expansion to include other relevant terms. This is a crucial advantage over other sparse methods which include the exact word, but completely miss the contextually relevant ones.

This expansion has a direct relationship with what we can control when making a SPLADE model: Sparsity via Regularisation. The number of tokens (BERT wordpieces) we use to represent each document. If we use more tokens, we can represent more terms, but the vectors become denser. This number is typically between 20 to 200 per document. As a reference point, the dense BERT vector is 768 dimensions, OpenAI Embedding is 1536 dimensions, and the sparse vector is 30 dimensions. 

For example, assume a 1M document corpus. Say, we use 100 sparse token ids per document. Correspondingly, dense BERT vector would be 768M floats, the OpenAI Embedding would be 1.536B floats, and the sparse vector would be 30M integers. This could mean a **100x reduction in memory usage**, which is a huge win for large-scale systems:

| Vector Type       | Memory (GB) |
|-------------------|-------------------------|
| Dense BERT Vector | 6.144                   |
| OpenAI Embedding  | 12.288                  |
| Sparse Vector     | 0.12                    |

## How SPLADE works? Leveraging BERT

SPLADE leverages a transformer architecture to generate sparse representations of documents and queries, enabling efficient retrieval. Let's dive into the process. 

The output logits from the transformer backbone are inputs upon which SPLADE builds. The transformer architecture can be something familiar like BERT. Rather than producing dense probability distributions, SPLADE utilizes these logits to construct sparse vectors—think of them as a distilled essence of tokens, where each dimension corresponds to a term from the vocabulary and its associated weight in the context of the given document or query. 

This sparsity is critical; it mirrors the probability distributions from a typical [Masked Language Modeling](http://jalammar.github.io/illustrated-bert/) task but is tuned for retrieval effectiveness, emphasizing terms that are both:

1. Contextually relevant: Terms which represent a document well should be given more weight.
2. Discriminative across documents: Terms which a document has, and other documents don't, should be given more weight.

The token-level distributions that you'd expect in a standard transformer model are now transformed into token-level importance scores in SPLADE. These scores reflect the significance of each term in the context of the document or query, guiding the model to allocate more weight to terms that are likely to be more meaningful for retrieval purposes. 

The resulting sparse vectors are not only memory-efficient but also tailored for precise matching in the high-dimensional space of a search engine like Qdrant.

## Interpreting SPLADE

A downside of dense vectors is that they are not interpretable, making it difficult to understand why a document is relevant to a query.

SPLADE importance estimation can provide insights into the 'why' behind a document's relevance to a query. By shedding light on which tokens contribute most to the retrieval score, SPLADE offers some degree of interpretability alongside performance, a rare feat in the realm of neural IR systems. For engineers working on search, this transparency is invaluable.

## Known Limitations of SPLADE

### Pooling Strategy
The switch to max pooling in SPLADE improved its performance on the MS MARCO and TREC datasets. However, this indicates a potential limitation of the baseline SPLADE pooling method, suggesting that SPLADE's performance is sensitive to the choice of pooling strategy​​.

### Document and Query Encoder 
The SPLADE model variant that uses a document encoder with max pooling but no query encoder reaches the same performance level as the prior SPLADE model. This suggests a limitation in the necessity of a query encoder, potentially affecting the efficiency of the model​​. 


## Combining the Best of Both Worlds: Sparse and Dense Vectors in Qdrant
What if we told you there's a magical formula that combines sparse and dense vectors for damn good ranking? Yep, Qdrant lets you mix and match to create your own perfect blend. 


## Additional Resources
For those who want to dive deeper, here are the top papers on the topic most of which have code available:

1. Problem Motivation: [Sparse Overcomplete Word Vector Representations](https://ar5iv.org/abs/1506.02004)
1. [SPLADE v2: Sparse Lexical and Expansion Model for Information Retrieval](https://ar5iv.org/abs/2109.10086)
1. [SPLADE: Sparse Lexical and Expansion Model for First Stage Ranking](https://ar5iv.org/abs/2107.05720)
1. Late Interaction - [ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://ar5iv.org/abs/2112.01488)
1. [SparseEmbed: Learning Sparse Lexical Representations with Contextual Embeddings for Retrieval](https://research.google/pubs/pub52289/)

## Conclusion

Alright, folks, let's wrap it up. Better ranking isn't a 'nice-to-have,' it's a game-changer, and Qdrant can get you there.

Got questions? Our [Discord community](https://qdrant.to/discord?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) is teeming with answers. 

If you enjoyed reading this, why not sign up for our [newsletter](https://qdrant.tech/subscribe/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) to stay ahead of the curve. 

And, of course, a big thanks to you, our readers, for pushing us to make ranking better for everyone.

## Appendix: Your Ready-to-Go Code Kit
Why just read when you try it out? We've packed an easy-to-use code kit for you.
Download it, tinker with it, and start seeing the magic unfold in your own projects.
It's like a DIY kit for improving your ranking game, and we can't wait to hear how you use it.
