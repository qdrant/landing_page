---
title: "Sparse Vectors: Interpretable and Scalable Document Ranking"
short_description: "Sparse vectors are several times more efficient than dense vectors, making them a great choice for large-scale systems. They're also interpretable, which is a huge advantage over dense vectors."
description: "Sparse vectors are a representation where each dimension corresponds to a word or subword, greatly aiding in interpreting document rankings. This clarity is why sparse vectors are essential in modern search and recommendation systems, offering an advantage over embedding or dense vectors."
social_preview_image: /articles_data/sparse-vectors/social_preview.png
small_preview_image: /articles_data/sparse-vectors/sparse-vectors-icon.svg
preview_dir: /articles_data/sparse-vectors/preview
weight: -40
author: Nirant Kasliwal
author_link: 
date: 2023-12-03T13:00:00+03:00
draft: false
keywords:
  - vector search
  - SPLADE
  - sparse vectors
  - efficient neural search
---

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

They're pivotal in information retrieval, especially in ranking and search systems. BM25, a standard ranking function used by search engines like [Elasticsearch](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors), exemplifies this. BM25 calculates the relevance of documents to a given search query. 

BM25's capabilities are well proven, but it has its limitations. For example, it often needs building complex dictionary of synonyms, that is where sparse vectors come in. Sparse vectors excel in handling large text data, making them crucial in modern data processing and an improvement over more well-known methods like BM25.

# Understanding Sparse Vectors
Sparse vectors are like the Marie Kondo of data—keeping only what sparks joy (or relevance, in this case). 

Sparse Vectors are a representation where each dimension corresponds to a word or subword, greatly aiding in interpreting document rankings. This clarity is why sparse vectors are essential in modern search and recommendation systems, offering an advantage over embedding or dense vectors. 

Dense vectors from models like OpenAI Ada-002 or Sentence Transformers contain non-zero values for every element, whereas sparse vectors focus on relative word frequencies per document, with most values being zero. This results in a more efficient and interpretable system, especially in text-heavy applications like search.

# SPLADE

Let's check out [SPLADE](https://europe.naverlabs.com/research/computer-science/splade-a-sparse-bi-encoder-bert-based-model-achieves-effective-and-efficient-full-text-document-ranking/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors), an excellent way to make sparse vectors. Let's look at some numbers first. Higher is better:

| Model              | MRR@10 (MS MARCO Dev) | Type           |
|--------------------|---------|----------------|
| BM25               | 0.184   | Sparse |
| TCT-ColBERT        | 0.359   | Dense  | 
| doc2query-T5 [link](https://github.com/castorini/docTTTTTquery)  | 0.277   | Sparse |
| SPLADE             | 0.322   | Sparse |
| SPLADE-max         | 0.340   | Sparse |
| SPLADE-doc         | 0.322   | Sparse |
| DistilSPLADE-max   | 0.368   | Sparse |

All numbers are from [SPLADEv2](https://arxiv.org/abs/2109.10086). MRR is [Mean Reciprocal Rank](https://www.wikiwand.com/en/Mean_reciprocal_rank#References), a standard metric for ranking. [MS MARCO](https://microsoft.github.io/MSMARCO-Passage-Ranking/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) is a dataset for evaluating ranking and retrieval for passages.  

SPLADE is quite flexible as a method, with regularization knobs that can be tuned to obtain [different models](https://github.com/naver/splade) as well: 

> SPLADE is more a class of models rather than a model per se: depending on the regularization magnitude, we can obtain different models (from very sparse to models doing intense query/doc expansion) with different properties and performance. 

First, let's look at how to create a sparse vector. Then, we'll look at the concepts behind SPLADE.

# Creating a Sparse Vector

We'll explore two different ways to create a sparse vector. The higher performance way to create a sparse vector from dedicated document and query encoders. We'll look at a simpler approach -- here we will use the same model for both document and query. We will get a dictionary of token ids and their corresponding weights for a sample text - representing a document.

If you'd like to follow along, here's a [Colab Notebook](https://colab.research.google.com/gist/NirantK/ad658be3abefc09b17ce29f45255e14e/splade-single-encoder.ipynb), [alternate link](https://gist.github.com/NirantK/ad658be3abefc09b17ce29f45255e14e) with all the code.

## Setting Up
```python
from transformers import AutoModelForMaskedLM, AutoTokenizer

model_id = 'naver/splade-cocondenser-ensembledistil'

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForMaskedLM.from_pretrained(model_id)

text = """Arthur Robert Ashe Jr. (July 10, 1943 – February 6, 1993) was an American professional tennis player. He won three Grand Slam titles in singles and two in doubles."""
```

## Computing the Sparse Vector
```python
import torch

def compute_vector(text):
    """
    Computes a vector from logits and attention mask using ReLU, log, and max operations.
    """
    tokens = tokenizer(text, return_tensors="pt")
    output = model(**tokens)
    logits, attention_mask = output.logits, tokens.attention_mask
    relu_log = torch.log(1 + torch.relu(logits))
    weighted_log = relu_log * attention_mask.unsqueeze(-1)
    max_val, _ = torch.max(weighted_log, dim=1)
    vec = max_val.squeeze()

    return vec, tokens


vec, tokens = compute_vector(text)
print(vec.shape)
```

You'll notice that there are 38 tokens in the text based on this tokenizer. This will be different from the number of tokens in the vector. In a TF-IDF, we'd assign weights only to these tokens or words. In SPLADE, we assign weights to all the tokens in the vocabulary using this vector using our learned model.

# Term Expansion and Weights
```python
def extract_and_map_sparse_vector(vector, tokenizer):
    """
    Extracts non-zero elements from a given vector and maps these elements to their human-readable tokens using a tokenizer. The function creates and returns a sorted dictionary where keys are the tokens corresponding to non-zero elements in the vector, and values are the weights of these elements, sorted in descending order of weights.

    This function is useful in NLP tasks where you need to understand the significance of different tokens based on a model's output vector. It first identifies non-zero values in the vector, maps them to tokens, and sorts them by weight for better interpretability.

    Args:
    vector (torch.Tensor): A PyTorch tensor from which to extract non-zero elements.
    tokenizer: The tokenizer used for tokenization in the model, providing the mapping from tokens to indices.

    Returns:
    dict: A sorted dictionary mapping human-readable tokens to their corresponding non-zero weights.
    """

    # Extract indices and values of non-zero elements in the vector
    cols = vector.nonzero().squeeze().cpu().tolist()
    weights = vector[cols].cpu().tolist()

    # Map indices to tokens and create a dictionary
    idx2token = {idx: token for token, idx in tokenizer.get_vocab().items()}
    token_weight_dict = {idx2token[idx]: round(weight, 2) for idx, weight in zip(cols, weights)}

    # Sort the dictionary by weights in descending order
    sorted_token_weight_dict = {k: v for k, v in sorted(token_weight_dict.items(), key=lambda item: item[1], reverse=True)}

    return sorted_token_weight_dict

# Usage example
sorted_tokens = extract_and_map_sparse_vector(vec, tokenizer)
sorted_tokens
```

There will be 102 sorted tokens in total. This has expanded to include tokens that weren't in the original text. This is the term expansion we will talk about next.

Here are some terms that are added: "Berlin", and "founder" - despite having no mention of Arthur's race (which leads to Owen's Berlin win) and his work as the founder of Arthur Ashe Institute for Urban Health. Here are the top few `sorted_tokens` with a weight of more than 1: 

```python
{
 'ashe': 2.95,
 'arthur': 2.61,
 'tennis': 2.22,
 'robert': 1.74,
 'jr': 1.55,
 'he': 1.39,
 'founder': 1.36,
 'doubles': 1.24,
 'won': 1.22,
 'slam': 1.22,
 'died': 1.19,
 'singles': 1.1,
 'was': 1.07,
 'player': 1.06,
 'titles': 0.99,
 'birthday': 0.99,
 ...
}
```

If you're interested in using the higher-performance approach, check out the following models:

1. [naver/efficient-splade-VI-BT-large-doc](huggingface.co/naver/efficient-splade-vi-bt-large-doc)
2. [naver/efficient-splade-VI-BT-large-query](huggingface.co/naver/efficient-splade-vi-bt-large-doc)

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

This sparsity is critical; it mirrors the probability distributions from a typical [Masked Language Modeling](http://jalammar.github.io/illustrated-bert/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) task but is tuned for retrieval effectiveness, emphasizing terms that are both:

1. Contextually relevant: Terms that represent a document well should be given more weight.
2. Discriminative across documents: Terms that a document has, and other documents don't, should be given more weight.

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

# Leveraging Sparse Vectors in Qdrant for Efficient First-Stage Retrieval

Qdrant supports a separate index for Sparse Vectors. This enables you to use the same collection for both dense and sparse vectors. Each "Point" in Qdrant can have both dense and sparse vectors.

## Speed and Efficiency with Sparse Vectors

Sparse vectors, inherently characterized by their minimalistic data representation, offer a significant advantage in terms of speed. 

In Qdrant, the handling of sparse vectors is optimized to exploit this characteristic, resulting in rapid retrieval times. This makes Qdrant an ideal choice for first-stage retrieval where the goal is to quickly narrow down the search space from a large dataset. This is not a replacement for dense vectors, but a complementary approach that can be used in conjunction with dense vectors to improve ranking cost with minimal impact on relevance or latency. 

## Practical Implementation in Python

Let's delve into how Qdrant handles sparse vectors with an example. Here is what we will cover:

1. Setting Up Qdrant Client: Initially, we establish a connection with Qdrant using the QdrantClient. This setup is crucial for subsequent operations.

2. Creating a Collection with Sparse Vector Support: In Qdrant, a collection is a container for your vectors. Here, we create a collection specifically designed to support sparse vectors. This is done using the recreate_collection method where we define the parameters for sparse vectors, such as setting the index configuration.

3. Inserting Sparse Vectors: Once the collection is set up, we can insert sparse vectors into it. This involves defining the sparse vector with its indices and values, and then upserting this point into the collection.

4. Querying with Sparse Vectors: To perform a search, we first prepare a query vector. This involves computing the vector from a query text and extracting its indices and values. We then use these details to construct a query against our collection.

5. Retrieving and Interpreting Results: The search operation returns results that include the id of the matching document, its score, and other relevant details. The score is a crucial aspect, reflecting the similarity between the query and the documents in the collection.

### 1. Setting up

```python
# Qdrant client setup
client = QdrantClient(":memory:")

# Define collection name
COLLECTION_NAME = "example_collection"

# Insert sparse vector into Qdrant collection
point_id = 1  # Assign a unique ID for the point
```

### 2. Creating a Collection with Sparse Vector Support

```python
client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={},
        sparse_vectors_config={
            "text": models.SparseVectorParams(
                index=models.SparseIndexConfig(
                    on_disk=False,
                    full_scan_threshold=100,
                )
            )
        },
    )
```


### 3. Inserting Sparse Vectors

Here, we see the process of inserting a sparse vector into the Qdrant collection. This step is key to building a dataset that can be quickly retrieved in the first stage of the retrieval process, utilizing the efficiency of sparse vectors. Since this is for demonstration purposes, we insert only one point with Sparse Vector and no dense vector.

```python
client.upsert(
    collection_name=COLLECTION_NAME,
    points=[
        models.PointStruct(
            id=point_id,
            payload={},  # Add any additional payload if necessary
            vector={
                "text": models.SparseVector(
                    indices=indices.tolist(),
                    values=values.tolist()
                )
            }
        )
    ]
)
```
By upserting points with sparse vectors, we prepare our dataset for rapid first-stage retrieval, laying the groundwork for subsequent detailed analysis using dense vectors. Notice that we use "text" to denote the name of the sparse vector.

Those familiar with the Qdrant API will notice that the extra care taken to be consistent with the existing named vectors API -- this is to make it easier to use sparse vectors in existing codebases. As always, you're able to **apply payload filters**, shard keys, and other advanced features you've come to expect from Qdrant. To make things easier for you, the indices and values don't have to be sorted before upsert. Qdrant will sort them when the index is persisted e.g. on disk.

### 4. Querying with Sparse Vectors

We use the same process to prepare a query vector as well. This involves computing the vector from a query text and extracting its indices and values. We then use these details to construct a query against our collection. 

```python
# Preparing a query vector

query_text = "Who was Arthur Ashe?"
query_vec, query_tokens = compute_vector(query_text)
query_vec.shape

query_indices = query_vec.nonzero().numpy().flatten()
query_values = query_vec.detach().numpy()[indices]
```

In this example, we use the same model for both document and query. This is not a requirement, but it's a simpler approach.

### 5. Retrieving and Interpreting Results

After setting up the collection and inserting sparse vectors, the next critical step is retrieving and interpreting the results. This process involves executing a search query and then analyzing the returned results.

```python
# Searching for similar documents
result = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=models.NamedSparseVector(
            name="text",
            vector=models.SparseVector(
                indices=query_indices, 
                values=query_values,
            ),
        ),
        with_vectors=["text"],
    )

result
```

In the above code, we execute a search against our collection using the prepared sparse vector query. The `client.search` method takes the collection name and the query vector as inputs. The query vector is constructed using the `models.NamedSparseVector`, which includes the indices and values derived from the query text. This is a crucial step in efficiently retrieving relevant documents. 

Those familiar with the Qdrant API will notice that the extra care taken to be consistent with the existing named vectors API -- this is to make it easier to use sparse vectors in existing codebases. As always, you're still able to apply payload filters, shard keys, and other advanced features you've come to expect from Qdrant.

```python
ScoredPoint(id=1, version=0, score=3.4292831420898438, payload={}, vector={'text': SparseVector(indices=[2001, 2002, 2010, 2018, 2032, ...], values=[1.0660614967346191, 1.391068458557129, 0.8903818726539612, 0.2502821087837219, ...])}, shard_key=None)
```

The result, as shown above, is a `ScoredPoint` object containing the ID of the retrieved document, its version, a similarity score, and the sparse vector. The score is a key element as it quantifies the similarity between the query and the document, based on their respective vectors.

To understand how this scoring works, we use the familiar dot product method:

$$\text{Similarity}(\text{Query}, \text{Document}) = \sum_{i \in I} \text{Query}_i \times \text{Document}_i$$

This formula calculates the similarity score by multiplying corresponding elements of the query and document vectors and summing these products. This method is particularly effective with sparse vectors, where many elements are zero, leading to a computationally efficient process. The higher the score, the greater the similarity between the query and the document, making it a valuable metric for assessing the relevance of the retrieved documents.


## Qdrant's Dual-Vector Capability: A Two-Stage Retrieval Powerhouse

Qdrant's unique ability to handle both sparse and dense vectors within the same collection is not just a feature, but a strategic advantage. Here’s how you can use this in a two-stage retrieval process:

1. *First-Stage Retrieval with Sparse Vectors*: Initially, query Qdrant with sparse vectors for the first-stage retrieval. This stage is all about speed and efficiently filtering through vast amounts of data to find a relevant subset. Sparse vectors are ideal for this due to their lower computational overhead and faster processing times. You will get a list of scored points as a result of this stage.

2. *Second-Stage Ranking with Dense Vectors*: Once a relevant subset of data is identified, the process moves to the second stage, which involves dense vector-based ranking. Dense vectors, with their rich information representation, are well-suited for this detailed analysis, providing a more nuanced understanding and ranking of the results.

You can limit the second stage to only the top results from the first stage, which will further improve the efficiency of your system. You can use the same collection for both stages, with the first-stage retrieval using sparse vectors and the second-stage ranking using dense vectors. This is a powerful combination that can significantly improve the efficiency of your system.

### Combining Sparse and Dense Vectors for Better Ranking
What if we told you there's a magical formula that combines sparse and dense vectors for damn good ranking? Well, we don't know of one yet. But we do know that lot of people like Reciprocal Rank Fusion (RRF) for combining sparse and dense vectors. [Ranx](https://github.com/AmenRa/ranx) is a great library for this.

## Additional Resources
For those who want to dive deeper, here are the top papers on the topic most of which have code available:

1. Problem Motivation: [Sparse Overcomplete Word Vector Representations](https://ar5iv.org/abs/1506.02004?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors)
1. [SPLADE v2: Sparse Lexical and Expansion Model for Information Retrieval](https://ar5iv.org/abs/2109.10086?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors)
1. [SPLADE: Sparse Lexical and Expansion Model for First Stage Ranking](https://ar5iv.org/abs/2107.05720?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors)
1. Late Interaction - [ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://ar5iv.org/abs/2112.01488?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors)
1. [SparseEmbed: Learning Sparse Lexical Representations with Contextual Embeddings for Retrieval](https://research.google/pubs/pub52289/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors)

Why just read when you try it out? 

We've packed an easy-to-use Colab for you: [Sparse Vectors Single Encoder Demo](https://colab.research.google.com/gist/NirantK/ad658be3abefc09b17ce29f45255e14e/splade-single-encoder.ipynb). Run it, tinker with it, and start seeing the magic unfold in your projects. We can't wait to hear how you use it!

## Conclusion

Alright, folks, let's wrap it up. Better ranking isn't a 'nice-to-have,' it's a game-changer, and Qdrant can get you there.

Got questions? Our [Discord community](https://qdrant.to/discord?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) is teeming with answers. 

If you enjoyed reading this, why not sign up for our [newsletter](https://qdrant.tech/subscribe/?utm_source=qdrant&utm_medium=website&utm_campaign=sparse-vectors&utm_content=article&utm_term=sparse-vectors) to stay ahead of the curve. 

And, of course, a big thanks to you, our readers, for pushing us to make ranking better for everyone.