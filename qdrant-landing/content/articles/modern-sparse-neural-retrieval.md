---
title: "Modern Sparse Neural Retrieval: From DeepCT to SPLADE++"
short_description: "How sparse neural retrievers evolved from DeepCT to SPLADE++, and when to choose them over BM25."
description: "A comprehensive guide to modern sparse neural retrievers: COIL, TILDEv2, SPLADE, and more. Find out how they work and when to choose them." 
preview_dir: /articles_data/modern-sparse-neural-retrieval/preview
social_preview_image: /articles_data/modern-sparse-neural-retrieval/preview/social_preview.jpg
weight: 20
author: Evgeniya Sukhodolskaya
date: 2024-10-23T00:00:00.000Z
tags: 
  - sparse retriever
  - sparse retrieval
  - splade
  - bm25
category: embedding-research
---

<link rel="stylesheet" href="/articles_data/modern-sparse-neural-retrieval/figures.css">

Finding enough time to study all the modern solutions while keeping your production running is rarely feasible.
Dense retrievers, hybrid retrievers, late interaction… How do they work, and where do they fit best?
If only we could compare retrievers as easily as products on Amazon!

We explored the most popular modern sparse neural retrieval models and broke them down for you.
By the end of this article, you’ll have a clear understanding of the current landscape in sparse neural retrieval and how to navigate through complex, math-heavy research papers with sky-high NDCG scores without getting overwhelmed.

## Sparse Neural Retrieval: As If Keyword-Based Retrievers Understood Meaning

**Keyword-based (lexical) retrievers** like BM25 provide a good explainability. 
If a document matches a query, it’s easy to understand why: query terms are present in the document, 
and if these are rare terms, they are more important for retrieval.

[![Keyword-based (Lexical) Retrieval](/articles_data/modern-sparse-neural-retrieval/LexicalRetrievers.png)](/articles_data/modern-sparse-neural-retrieval/LexicalRetrievers.png)

With their mechanism of exact term matching, they are super fast at retrieval. 
A simple **inverted index**, which maps back from a term to a list of documents where this term occurs, saves time on checking millions of documents. 

[![Inverted Index](/articles_data/modern-sparse-neural-retrieval/InvertedIndex.png)](/articles_data/modern-sparse-neural-retrieval/InvertedIndex.png)

Lexical retrievers are still a strong baseline in retrieval tasks. 
However, by design, they’re unable to bridge **vocabulary** and **semantic mismatch** gaps. 
Imagine searching for a “*tasty cheese*” in an online store and not having a chance to get “*Gouda*” or “*Brie*” in your shopping basket.

**Dense retrievers**, based on machine learning models which encode documents and queries in dense vector representations, 
are capable of breaching this gap and finding you “*a piece of Gouda*”. 

[![Dense Retrieval](/articles_data/modern-sparse-neural-retrieval/DenseRetrievers.png)](/articles_data/modern-sparse-neural-retrieval/DenseRetrievers.png)

However, explainability here suffers: why is this query representation close to this document representation? 
Why, searching for “*cheese*”, we’re also offered “*mouse traps*”? What does each number in this vector representation mean? 
Which one of them is capturing the cheesiness?

Without a solid understanding, balancing result quality and resource consumption becomes challenging.
Since, hypothetically, any document could match a query, relying on an inverted index with exact matching isn’t feasible.
This doesn’t mean dense retrievers are inherently slower. However, lexical retrieval has been around long enough to inspire several effective architectural choices, which are often worth reusing.

Sooner or later, there should have been somebody who would say, 
“*Wait, but what if I want something timeproof like BM25 but with semantic understanding?*”

## Sparse Neural Retrieval Evolution

Imagine searching for a “*flabbergasting murder*” story. 
”*Flabbergasting*” is a rarely used word, so a keyword-based retriever, for example, BM25, will assign huge importance to it. 
Consequently, there is a high chance that a text unrelated to any crimes but mentioning something “*flabbergasting*” will pop up in the top results.

What if we could instead of relying on term frequency in a document as a proxy of term’s importance as it happens in BM25, 
directly predict a term’s importance? The goal is for rare but non-impactful terms to be assigned a much smaller weight than important terms with the same frequency, while both would be equally treated in the BM25 scenario. 

How can we determine if one term is more important than another?
Word impact is related to its meaning, and its meaning can be derived from its context (words which surround this particular word). 
That’s how dense contextual embedding models come into the picture. 

All the sparse retrievers are based on the idea of taking a model which produces contextual dense vector representations for terms 
and teaching it to produce sparse ones. Very often, 
[Bidirectional Encoder Representations from the Transformers (BERT)](https://huggingface.co/docs/transformers/en/model_doc/bert) is used as a 
base model, and a very simple trainable neural network is added on top of it to sparsify the representations out. 
Training this small neural network is usually done by sampling from the [MS MARCO](https://microsoft.github.io/msmarco/) dataset a query, 
relevant and irrelevant to it documents and shifting the parameters of the neural network in the direction of relevancy.


### The Pioneer Of Sparse Neural Retrieval

[![Deep Contextualized Term Weighting (DeepCT)](/articles_data/modern-sparse-neural-retrieval/DeepCT.png)](/articles_data/modern-sparse-neural-retrieval/DeepCT.png)
The authors of one of the first sparse retrievers, the [`Deep Contextualized Term Weighting framework (DeepCT)`](https://arxiv.org/pdf/1910.10687), 
predict an integer word’s impact value separately for each unique word in a document and a query. 
They use a linear regression model on top of the contextual representations produced by the basic BERT model, the model's output is rounded.

When documents are uploaded into a database, the importance of words in a document is predicted by a trained linear regression model 
and stored in the inverted index in the same way as term frequencies in BM25 retrievers. 
Then, the retrieval process is identical to the BM25 one.

***Why is DeepCT not a perfect solution?*** To train linear regression, the authors needed to provide the true value (**ground truth**) 
of each word’s importance so the model could “see” what the right answer should be. 
This score is hard to define in a way that it truly expresses the query-document relevancy.
 Which score should have the most relevant word to a query when this word is taken from a five-page document? The second relevant? The third? 

### Sparse Neural Retrieval on Relevance Objective

[![DeepImpact](/articles_data/modern-sparse-neural-retrieval/DeepImpact.png)](/articles_data/modern-sparse-neural-retrieval/DeepImpact.png)
It’s much easier to define whether a document as a whole is relevant or irrelevant to a query. 
That’s why the [`DeepImpact`](https://arxiv.org/pdf/2104.12016) Sparse Neural Retriever authors directly used the relevancy between a query and a document as a training objective. 
They take BERT’s contextualized embeddings of the document’s words, transform them through a simple 2-layer neural network in a single scalar 
score and sum these scores up for each word overlapping with a query. 
The training objective is to make this score reflect the relevance between the query and the document.

***Why is DeepImpact not a perfect solution?***
When converting texts into dense vector representations, 
the BERT model does not work on a word level. Sometimes, it breaks the words into parts. 
For example, the word “*vector*” will be processed by BERT as one piece, but for some words that, for example, 
BERT hasn’t seen before, it is going to cut the word in pieces 
[as “Qdrant” turns to “Q”, “#dra” and “#nt”](https://huggingface.co/spaces/Xenova/the-tokenizer-playground) 

The DeepImpact model (like the DeepCT model) takes the first piece BERT produces for a word and discards the rest. 
However, what can one find searching for “*Q*” instead of “*Qdrant*”?

### Know Thine Tokenization

[![Term Independent Likelihood MoDEl v2 (TILDE v2)](/articles_data/modern-sparse-neural-retrieval/TILDEv2.png)](/articles_data/modern-sparse-neural-retrieval/TILDEv2.png)
To solve the problems of DeepImpact's architecture, the [`Term Independent Likelihood MoDEl (TILDEv2)`](https://arxiv.org/pdf/2108.08513) model generates
sparse encodings on a level of BERT’s representations, not on words level. Aside from that, its authors use the identical architecture 
to the DeepImpact model.

***Why is TILDEv2 not a perfect solution?***
A single scalar importance score value might not be enough to capture all distinct meanings of a word. 
**Homonyms** (pizza, cocktail, flower, and female name “*Margherita*”) are one of the troublemakers in information retrieval.

### Sparse Neural Retriever Which Understood Homonyms

[![COntextualized Inverted List (COIL)](/articles_data/modern-sparse-neural-retrieval/COIL.png)](/articles_data/modern-sparse-neural-retrieval/COIL.png)

If one value for the term importance score is insufficient, we could describe the term’s importance in a vector form! 
Authors of the [`COntextualized Inverted List (COIL)`](https://arxiv.org/pdf/2104.07186) model based their work on this idea. 
Instead of squeezing 768-dimensional BERT’s contextualised embeddings into one value, 
they down-project them (through the similar “relevance” training objective) to 32 dimensions. 
Moreover, not to miss a detail, they also encode the query terms as vectors. 

For each vector representing a query token, COIL finds the closest match (using the maximum dot product) vector of the same token in a document.
So, for example, if we are searching for “*Revolut bank \<finance institution\>*” and a document in a database has the sentence 
“*Vivid bank \<finance institution\> was moved to the bank of Amstel \<river\>*”, out of two “banks”, 
the first one will have a bigger value of a dot product with a “*bank*” in the query, and it will count towards the final score. 
The final relevancy score of a document is a sum of scores of query terms matched. 

***Why is COIL not a perfect solution?*** This way of defining the importance score captures deeper semantics; 
more meaning comes with more values used to describe it. 
However, storing 32-dimensional vectors for every term is far more expensive, 
and an inverted index does not work as-is with this architecture.

### Back to the Roots

[![Universal COntextualized Inverted List (UniCOIL)](/articles_data/modern-sparse-neural-retrieval/UNICOIL.png)](/articles_data/modern-sparse-neural-retrieval/UNICOIL.png)
[`Universal COntextualized Inverted List (UniCOIL)`](https://arxiv.org/pdf/2106.14807), made by the authors of COIL as a follow-up, goes back to producing a scalar value as the importance score 
rather than a vector, leaving unchanged all other COIL design decisions. \
It optimizes resources consumption but the deep semantics understanding tied to COIL architecture is again lost.

## Did we Solve the Vocabulary Mismatch Yet?

With the retrieval based on the exact matching, 
however sophisticated the methods to predict term importance are, we can’t match relevant documents which have no query terms in them. 
If you’re searching for “*pizza*” in a book of recipes, you won’t find “*Margherita*”.

A way to solve this problem is through the so-called **document expansion**. 
Let’s append words which could be in a potential query searching for this document. 
So, the “*Margherita*” document becomes “*Margherita pizza*”. Now, exact matching on “*pizza*” will work!

[![Document Expansion](/articles_data/modern-sparse-neural-retrieval/DocumentExpansion.png)](/articles_data/modern-sparse-neural-retrieval/DocumentExpansion.png)

There are two types of document expansion that are used in sparse neural retrieval: 
**external** (one model is responsible for expansion, another one for retrieval) and **internal** (all is done by a single model).

### External Document Expansion
External document expansion uses a **generative model** (Mistral 7B, Chat-GPT, and Claude are all generative models, 
generating words based on the input text) to compose additions to documents before converting them to sparse representations 
and applying exact matching methods.

#### External Document Expansion with docT5query

[![External Document Expansion with docT5query](/articles_data/modern-sparse-neural-retrieval/docT5queryDocumentExpansion.png)](/articles_data/modern-sparse-neural-retrieval/docT5queryDocumentExpansion.png)
[`docT5query`](https://github.com/castorini/docTTTTTquery) is the most used document expansion model. 
It is based on the [Text-to-Text Transfer Transformer (T5)](https://huggingface.co/docs/transformers/en/model_doc/t5) model trained to 
generate top-k possible queries for which the given document would be an answer. 
These predicted short queries (up to ~50-60 words) can have repetitions in them, 
so it also contributes to the frequency of the terms if the term frequency is considered by the retriever.

The problem with docT5query expansion is a very long inference time, as with any generative model: 
it can generate only one token per run, and it spends a fair share of resources on it.

#### External Document Expansion with Term Independent Likelihood MODel (TILDE)

[![External Document Expansion with Term Independent Likelihood MODel (TILDE)](/articles_data/modern-sparse-neural-retrieval/TILDEDocumentExpansion.png)](/articles_data/modern-sparse-neural-retrieval/TILDEDocumentExpansion.png)

[`Term Independent Likelihood MODel (TILDE)`](https://github.com/ielab/TILDE) is an external expansion method that reduces the passage expansion time compared to 
docT5query by 98%. It uses the assumption that words in texts are independent of each other 
(as if we were inserting in our speech words without paying attention to their order), which allows for the parallelisation of document expansion.

Instead of predicting queries, TILDE predicts the most likely terms to see next after reading a passage’s text 
(**query likelihood paradigm**). TILDE takes the probability distribution of all tokens in a BERT vocabulary based on the document’s text 
and appends top-k of them to the document without repetitions.

***Problems of external document expansion:*** External document expansion might not be feasible in many production scenarios where there’s not enough time or compute to expand each and every 
document you want to store in a database and then additionally do all the calculations needed for retrievers. 
To solve this problem, a generation of models was developed which do everything in one go, expanding documents “internally”.

### Internal Document Expansion

Let’s assume we don’t care about the context of query terms, so we can treat them as independent words that we combine in random order to get 
the result. Then, for each contextualized term in a document, we are free to pre-compute how this term affects every word in our vocabulary. 

For each document, a vector of the vocabulary length is created. To fill this vector in, for each word in the vocabulary, it is checked if the 
influence of any document term on it is big enough to consider it. Otherwise, the vocabulary word’s score in a document vector will be zero. 
For example, by pre-computing vectors for the document “*pizza Margherita*” on a vocabulary of 50,000 most used English words, 
for this small document of two words, we will get a 50,000-dimensional vector of zeros, where non-zero values will be for a “*pizza*”, “*pizzeria*”, 
“*flower*”, “*woman*”, “*girl*”, "*Margherita*", “*cocktail*” and “*pizzaiolo*”. 

### Sparse Neural Retriever with Internal Document Expansion
[![Sparse Transformer Matching (SPARTA)](/articles_data/modern-sparse-neural-retrieval/SPARTA.png)](/articles_data/modern-sparse-neural-retrieval/SPARTA.png)

The authors of the [`Sparse Transformer Matching (SPARTA)`](https://arxiv.org/pdf/2009.13013) model use BERT’s model and BERT’s vocabulary (around 30,000 tokens). 
For each token in BERT vocabulary, they find the maximum dot product between it and contextualized tokens in a document 
and learn a threshold of a considerable (non-zero) effect.
Then, at the inference time, the only thing to be done is to sum up all scores of query tokens in that document.

***Why is SPARTA not a perfect solution?*** Trained on the MS MARCO dataset, many sparse neural retrievers, including SPARTA, 
show good results on MS MARCO test data, but when it comes to generalisation (working with other data), they 
[could perform worse than BM25](https://arxiv.org/pdf/2307.10488).

### State-of-the-Art of Modern Sparse Neural Retrieval

[![Sparse Lexical and Expansion Model Plus Plus, (SPLADE++)](/articles_data/modern-sparse-neural-retrieval/SPLADE++.png)](/articles_data/modern-sparse-neural-retrieval/SPLADE++.png)
The authors of the [`Sparse Lexical and Expansion Model (SPLADE)`](https://arxiv.org/pdf/2109.10086) family of models added dense model training tricks to the 
internal document expansion idea, which made the retrieval quality noticeably better. 

- The SPARTA model is not sparse enough by construction, so authors of the SPLADE family of models introduced explicit **sparsity regularisation**, 
preventing the model from producing too many non-zero values. 
- The SPARTA model mostly uses the BERT model as-is, without any additional neural network to capture the specificity of Information Retrieval problem, 
so SPLADE models introduce a trainable neural network on top of BERT with a specific architecture choice to make it perfectly fit the task.
- SPLADE family of models, finally, uses **knowledge distillation**, which is learning from a bigger 
(and therefore much slower, not-so-fit for production tasks) model how to predict good representations.

One of the last versions of the SPLADE family of models is [`SPLADE++`](https://arxiv.org/pdf/2205.04733). \
SPLADE++, opposed to SPARTA model, expands not only documents but also queries at inference time.

To try SPLADE++ yourself, follow the [How to Generate Sparse Vectors with SPLADE](/documentation/fastembed/fastembed-splade/) tutorial: it walks through generating SPLADE++ vectors with FastEmbed and inspecting which terms the model expanded the text with.

SPLADE++ is also available as a paid model in [Qdrant Cloud Inference](/documentation/inference/cloud-inference/).

## Key Takeaways: When to Choose Sparse Neural Models for Retrieval
Sparse Neural Retrieval makes sense:

- In areas where keyword matching is crucial but BM25 is insufficient for initial retrieval, semantic matching (e.g., synonyms, homonyms) adds significant value. This is especially true in fields such as medicine, academia, law, and e-commerce, where brand names and serial numbers play a critical role. Dense retrievers tend to return many false positives, while sparse neural retrieval helps narrow down these false positives.

- Sparse neural retrieval can be a valuable option for scaling, especially when working with large datasets. It leverages exact matching using an inverted index, which can be fast depending on the nature of your data.

- If you’re using traditional retrieval systems, sparse neural retrieval is compatible with them and helps bridge the semantic gap.

