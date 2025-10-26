---
title: Hybrid Search and the Universal Query API
weight: 4
---

{{< date >}} Day 3 {{< /date >}}

# Hybrid Search and the Universal Query API

Learn how to combine dense and sparse vector search methods to build powerful hybrid search pipelines that serve diverse user needs.

<div class="video">
<iframe
  src="https://www.youtube.com/embed/p_IKYRGuxmM"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

## What You'll Learn

- Understand when to use dense vs. sparse vectors
- Build hybrid search pipelines with Qdrant's Universal Query API
- Apply Reciprocal Rank Fusion (RRF) to combine results
- Design multi-stage retrieval and reranking strategies

## The Challenge: Different Users, Different Search Needs

The reality is that your users exist across a spectrum: from precise keyword searchers to vague natural language describers, and forcing a single search approach means disappointing part of your audience. Rather than compromising on search quality for different user types, hybrid search allows you to meet everyone where they are.

### Dense Vectors: Semantic Understanding

Dense vectors are produced by neural encoders trained in a way that associates meaning with the inputs. No matter if you ask for an **elevator** or a **lift**, your intent is to get to another floor, even though the words differ. Even an escalator, or just stairs, should not be that far away, as they serve the same purpose!

Some models can also find what you need when you use:
- Spanish: **ascensor**
- Polish: **winda**
- German: **der Aufzug**

Or any other language, as these models might be trained to support many of them simultaneously.

### Sparse Vectors: Exact Matching

On the other hand, sparse vectors are more suitable for cases where the exact match matters. They are quite often described as keyword-based or lexical search.

Imagine you know the identifier of an item you want to find. For example, you have a particular smartphone model, so when buying some accessories, you don't want to see all the possible chargers for different devices, but only those you can use. That's where lexical search would be better suited than the dense vector search!

### Real-World Complexity: Legal Search Example

Unfortunately, reality is never that simple. Some of your users might be domain experts and use the same terminology as you do, so implementing just keyword-based search will be totally fine for their purposes. However, you don't want to ignore the part of your audience that can't express their intentions in proper terms. Some of your users may tend to produce vague, natural language-like descriptions of what they want to find, and in that case, dense vectors will capture that way better.

**Imagine a legal search system:**
- **Lawyers** will typically know the paragraph, section, or even a point of the legal act they want to find
- **Others** would rather describe a very specific case they encountered
- **Mixed cases**: Maybe somebody knows the particular act, but not the paragraph?

You don't need to choose just one method or build separate pipelines to serve both types of users! Hybrid search might be the solution you are looking for!

## What is Hybrid Search?

There is no single definition of hybrid search, but in general, we can call a specific pipeline hybrid when it combines at least two different search methods.

It might be dense and sparse vectors in a chain, in which you:
1. **Prefetch** some candidates with dense vector search, then **rerank** them with sparse
2. Or vice versa: use sparse for retrieval and dense for reranking

So, we have **retrievers** and **rerankers**.

### Complex Multi-Stage Pipelines

The options for building a hybrid search are endless. In some cases, people create really complex multi-stage search pipelines with:
- Faster methods for the initial retrieval
- Slower but more precise models reranking these pre-retrieved candidates

Qdrant's Universal Query API allows you to build such complex pipelines in a single call.

## Universal Query API

The Universal Query API was introduced in Qdrant 1.10. It consolidated all the other APIs in a single method and, most importantly for us, made it easier to build hybrid search pipelines.

### Pattern 1: Dense Retrieval → Sparse Reranking

Here is how the simplest chain of dense retrieval and sparse reranking could look, assuming we have already created a collection containing two named vectors:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(...)
client.query_points(
    collection_name="my_collection",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text=query,
                model="sentence-transformers/all-MiniLM-L6-v2",
            ),
            using="dense",
            limit=20,
        ),
    ],
    query=models.Document(
        text=query,
        model="Qdrant/bm25",
    ),
    using="sparse",
    limit=20,
)
```

In this example, we:
1. **Prefetched** twenty results with dense vector search
2. Then **sparse vectors** were used to rearrange them in an order defined by sparse relevancy scores

That means the sparse method was not used on all the points in a collection, but just a small subset of these twenty candidates.

### Pattern 2: Sparse Retrieval → Dense Reranking

If we swap the usage of both vectors, then we will have a different pipeline with sparse retrieval and dense reranking:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(...)
client.query_points(
    collection_name="my_collection",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text=query,
                model="Qdrant/bm25",
            ),
            using="sparse",
            limit=20,
        ),
    ],
    query=models.Document(
        text=query,
        model="sentence-transformers/all-MiniLM-L6-v2",
    ),
    using="dense",
    limit=20,
)
```

### The Limitation of Sequential Search

Using multiple search methods in sequence isn't always the best approach. Consider our earlier examples where we either:

1. Retrieve documents with dense vectors and then rerank with sparse method, or
2. Retrieve with the sparse method and then rerank with the dense one

**These two approaches can produce completely different results.** The initial retrieval method is actually more critical than the reranking step, because reranking can only work with what the retriever has already selected.

For instance, if there's a perfect document match that only sparse retrieval would identify, but you use dense retrieval first, you'll never find that document since it won't be included in the candidates passed to the reranker.

There are ways of incorporating both signals! Let's discuss fusion!

## Fusion: Combining Search Signals

Each retrieval method produces a numerical score assigned to each document it selects. These scores can't be directly compared to each other between different methods, so there is no clear way to mix candidates.

**The scoring problem:**
- Your dense retrieval may produce cosine similarity that never exceeds 1
- BM25 scores are virtually unbounded
- How would you decide whether a cosine similarity of 0.9 is better than a BM25 score of 10.7?

Fusion algorithms are designed to solve that. **Reciprocal Rank Fusion** is one of the most common techniques, so let's look at it.

## Reciprocal Rank Fusion (RRF)

The original scores returned by each method are primarily used to rank the documents by their relevance, so they define the order of how good each result is. RRF does not take the scores into account, but just the ranking defined by them, and calculates its own score based on the ranks returned by each individual method.

### The RRF Formula

$$\text{RRF\_score}(d) = \sum_{i=1}^{n} \frac{1}{k + \text{rank}_i(d)}$$

Where:
- `d` is the document
- `k` is a constant (typically 60)
- `n` is the number of retrieval methods
- `rank_i(d)` is the rank of document `d` in the i-th retrieval method

The value of the `k` parameter can help you increase or decrease the impact of the lower ranked documents. The smaller the parameter value, the bigger the impact of the top-ranked results.

### RRF Example: Step by Step

Let's assume we have these results coming from both methods:

**Dense Search Results:**
1. D1 (score: 0.95)
2. D2 (score: 0.89)
3. D3 (score: 0.85)
4. D4 (score: 0.82)

**Sparse Search Results:**
1. D5 (score: 15.2)
2. D3 (score: 12.8)
3. D1 (score: 10.1)
4. D2 (score: 8.5)

Now let's calculate RRF scores (using k=60):

| Document | Dense Rank | Dense RRF         | Sparse Rank | Sparse RRF        | Total RRF | Final Rank |
|----------|------------|-------------------|-------------|-------------------|-----------|------------|
| D1       | 1          | 1/(60+1) = 0.0164 | 3           | 1/(60+3) = 0.0159 | 0.0323    | 2          |
| D2       | 2          | 1/(60+2) = 0.0161 | 4           | 1/(60+4) = 0.0156 | 0.0317    | 3          |
| D3       | 3          | 1/(60+3) = 0.0159 | 2           | 1/(60+2) = 0.0161 | 0.0320    | **1**      |
| D4       | 4          | 1/(60+4) = 0.0156 | -           | 0                 | 0.0156    | 5          |
| D5       | -          | 0                 | 1           | 1/(60+1) = 0.0164 | 0.0164    | 4          |

**Notice:** D3 became the winner, even though it was not the best match for any of the individual methods! However, both ranked it quite high, so it probably captures both lexical and semantic meaning.

## Implementing RRF in Qdrant

If you would like to implement that process in Qdrant, then you don't have to calculate the RRF scores on your own. It's just built in!

This is an API call that you would have to make in order to retrieve twenty documents from both dense and sparse search, and then get just the top ten results based on the Reciprocal Rank Fusion:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(...)
client.query_points(
    collection_name="my_collection",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text=query,
                model="sentence-transformers/all-MiniLM-L6-v2",
            ),
            using="dense",
            limit=20,
        ),
        models.Prefetch(
            query=models.Document(
                text=query,
                model="Qdrant/bm25",
            ),
            using="sparse",
            limit=20,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

**Key points:**
- We prefetch 20 results from both dense and sparse methods
- The `FusionQuery` applies RRF to combine them
- We get the final top 10 results based on fused scores

Obviously, you can nest multiple prefetch operations, and apply the fusion at any level.

## Beyond Fusion: Advanced Reranking

Fusion is not the only way to build a hybrid search. Sometimes, you have a bigger set of weak retrievers and one strong reranker, which might be:

- A different neural model, such as a **cross-encoder**
- A more sophisticated dense retriever, which would practically be inapplicable for initial retrieval
- Multivector representations, such as **ColBERT**
- Custom business rules specific to your project

**Hybrid search might be really complex.** Reranking is a general term for all the methods we apply to the results of some intermediate search operations, and fusion is one way of tackling it.

## Key Takeaways

**What you've learned:**
- Dense vectors excel at semantic understanding and multilingual search
- Sparse vectors are ideal for exact matching and keyword-based retrieval
- Sequential retrieval + reranking has limitations (the first stage determines what's available)
- Fusion algorithms like RRF combine results from multiple methods effectively
- Qdrant's Universal Query API makes building complex hybrid pipelines simple

**When to use hybrid search:**
- Your users have diverse search behaviors (experts vs. casual users)
- You need both semantic understanding and exact matching
- Single-method search struggles with some query types
- You want to improve overall search quality and user satisfaction

## Next Steps & Resources

In the next lesson, we will build a hybrid search pipeline using Qdrant's Universal Query API with real data. Now that you know how it might be done, it's time to get your hands dirty with real implementation!

**Additional resources:**
- [Qdrant Documentation: Hybrid Search](/documentation/concepts/hybrid-queries/) - Complete technical reference
- [Universal Query API Guide](/documentation/concepts/search/#search-api) - API documentation

**Ready for hands-on practice?** In the next demo, you'll implement a real hybrid search, test different strategies, and measure the impact on search quality!
