---
title: "Module 1: Let's Understand Search"
short_description: "Module 1 of the Beginners course: Understand why traditional search struggles and how modern semantic search improves it."
description: "Understand why traditional search struggles and how modern semantic search improves it. Learn about embeddings, distance metrics, and hybrid search systems."
isLesson: true
weight: 20
---

{{< date >}} Module 1 {{< /date >}}

<!--
TODO (video): add the Module 1 overview video before launch. Follow the
Essentials embed pattern. Outro bumper yes, Intro bumper no.

<div class="video">
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID?rel=0"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>
-->

# Let's Understand Search

Traditional search retrieves documents by matching the words in a query to the words in an index. It’s fast and still useful for precise terms, but it can miss relevant results when people express the same intent differently. In this module, you’ll see how embeddings let search compare meaning, how similarity is measured, and why modern search often combines both approaches.

#### TL;DR
```
Search has to decide what makes a result relevant. In this module, you'll
learn why matching words falls short and how comparing meaning fixes it.
You'll explore embeddings, cosine similarity, and distance metrics, then
see where similarity alone still fails: word order, negation, and exact
product codes. You'll also meet the vocabulary the rest of the course
builds on, including collections, points, payloads, and filters. By the
end, you'll have embedded your first text and measured how close its
meaning sits to related and unrelated phrases.
```

## Today’s Path

- Why keyword search misses relevant results
- How embeddings let search compare meaning
- How cosine similarity measures that meaning
- When exact matching still matters

### Before You Start

Choose how you want to follow this module:

- **Use follow-along notebooks on our:** [GitHub](https://github.com/qdrant/examples/blob/master/course/beginners)
- **Run locally:** Use Python 3.9 or later, then install the dependencies:

```bash
pip install fastembed numpy
```

The embedding model runs on your CPU. You don't need a GPU or API keys. The first run downloads the model, so it may take a few minutes and requires an internet connection. Later runs use the cached model.

## 1. What Is Search?

Search is the act of finding the right information out of everything you have, given a question. You type "car repair" into a box, and something has to decide which of your thousands of documents, products, or messages actually answers that.

Every search system, no matter how it's built internally, does the same two things:

1. **Retrieve**: narrow a huge collection down to a shortlist of documents that might be relevant.
2. **Rank**: order that shortlist so the best answer ends up near the top.

At the heart of search is one question: what makes a result relevant? <br>
We'll start with the simplest possible answer, watch it fail, and build up from there. No prior knowledge of vector search engines or indexing algorithms is assumed.

## 2. The Problem: Why Keyword Search Struggles

In its simplest form, keyword search retrieves documents by matching query terms against terms in the document. In other words, it matches the words themselves, not what they mean. It works when the query and document use the same vocabulary, but it can miss relevant results when the same intent is expressed differently.

![Keyword search only matches documents that contain the exact words "car" and "repair"](/courses/beginners/module-1/car-repair.png)

That creates a few common problems:

- **Different words, same meaning:** "car repair" misses "automobile maintenance."
- **Same word, different meaning:** "Apple stock" can retrieve fruit content instead of financial information.
- **Same words, different order:** "dog bites man" and "man bites dog" contain the same terms, but mean very different things.

## 3. How Traditional Search Improved

Traditional search has evolved beyond exact word matching. Techniques such as stemming, typo tolerance, and relevance ranking make it faster and more forgiving. But they still rely on words: the system cannot tell that “car repair” and “automobile maintenance” mean the same thing unless that connection is explicitly defined.

That's the gap **semantic search** closes. Instead of asking "Does this document contain the same words?" it asks "Does this document mean the same thing?" Nobody hand-codes the fact that "car" and "automobile" are related, the embedding model learns it from the text it was trained on, and sentences with related meaning end up as vectors that sit close together, even when they share no words.

## 4. How It Works: Embeddings

### What Is an Embedding?

An embedding is a [vector](<https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)>): a list of numbers that captures meaning. Semantic search works by converting text into embeddings, text with similar meaning produces embeddings that sit close together in high-dimensional space, and text with different meaning produces embeddings that sit far apart. Each position in that list is a dimension; no single one maps to a human concept like "color," meaning comes from all of them combined.

### The Embedding Model

An embedding model takes a piece of text and returns a fixed-length array of floating-point numbers. The exact numbers matter less than the relationships between them.

```python
from fastembed import TextEmbedding

# model.embed() takes a list of strings and returns one vector per string
model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
query_vec = list(model.embed(["car repair"]))[0]
doc_vec   = list(model.embed(["automobile maintenance"]))[0]

# check both vectors are the same length (384 dimensions each), then peek at the first 5 floats of each
print(len(query_vec), len(doc_vec))
print(query_vec[:5])
print(doc_vec[:5])
```

![An embedding model turns the text "car repair" into a fixed-length list of 384 numbers](/courses/beginners/module-1/generating-vector.png)

### Model Size and Vector Dimension

When choosing an embedding model, two sizes matter:

- **Model size** is the number of parameters in the model. Larger models often capture more nuance, but need more compute to create embeddings.
- **Vector dimension** is the number of values in each embedding. Higher-dimensional vectors use more storage and take more work to compare during search.

These are related, but they are not the same. A larger model can produce a short vector, and a higher-dimensional vector does not automatically produce better search results

### Why This Model

This module uses `sentence-transformers/all-MiniLM-L6-v2` because it's small enough to run on a CPU with no API keys or GPU, and accurate enough to demonstrate semantic search clearly. When you start your own project, see [Points, Vectors and Payloads](/course/essentials/day-1/embedding-models/) for how to weigh size, language, and domain fit when picking a model.

## 5. Comparing Meaning: Distance Metrics

Once we have vectors, we need a way to measure how similar two of them are. Different metrics suit different situations.

### Cosine Similarity

Cosine similarity measures the angle between two vectors. Vectors that point in a similar direction receive a score closer to 1. Vectors that point in different directions receive a lower score. <br>
It ignores vector length, which is the overall size of a vector. For text embeddings, the direction often carries more useful information about meaning than this size. This makes cosine similarity a common choice for semantic search.

$$
\text{cosine\_similarity}(A, B) = \frac{A \cdot B}{\lVert A \rVert \, \lVert B \rVert}
$$

Here, $A \cdot B$ is the **dot product**: multiply each pair of matching values in the two vectors and add the results. $\lVert A \rVert$ is the vector’s length, also called its magnitude. Dividing by both vector lengths removes the effect of vector size, so the score measures their angle instead.

![Cosine similarity measures the angle between two vectors: a smaller angle gives a score closer to 1, unrelated vectors score near 0, and opposite vectors score near -1](/courses/beginners/module-1/cosine-similarity.png)

For example, embedding "car repair" and "automobile maintenance" and comparing the two vectors with this formula yields a similarity score around 0.73, far higher than an unrelated pair would score, reflecting their shared meaning despite having no words in common.

### Try It Yourself: Compare Cosine Scores

Reuse the embedding snippet from section 4 to embed three query/document pairs, then score each pair with cosine similarity, using the formula above implemented directly with NumPy.

<aside role="status">This snippet computes cosine similarity by hand with NumPy so you can see the formula at work. It's for teaching only, when you search with Qdrant, this comparison happens for you internally, you never write this loop yourself.</aside>

```python
from fastembed import TextEmbedding
import numpy as np

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

pairs = [
    ("car repair", "automobile maintenance"),                    # synonyms
    ("cheap flights to New York", "affordable airfare to NYC"),  # paraphrase
    ("cheap flights to New York", "best pizza in Chicago"),      # unrelated
]

for query, document in pairs:
    query_vec = list(model.embed([query]))[0]
    doc_vec = list(model.embed([document]))[0]
    score = cosine_similarity(query_vec, doc_vec)
    print(f"{score:.3f}  |  {query!r}  vs  {document!r}")

# Expected output:
#   0.733  |  'car repair'  vs  'automobile maintenance'
#   0.821  |  'cheap flights to New York'  vs  'affordable airfare to NYC'
#   0.332  |  'cheap flights to New York'  vs  'best pizza in Chicago'
```

**What to look for:**

- The synonym and paraphrase pairs (0.733, 0.821) score high despite sharing almost no words.
- The unrelated pair (0.332) scores far lower, reflecting different meaning.

**Your turn:** Run this block (it reuses `model` and `cosine_similarity` from above) to test a **polysemy** case, where the same word has more than one meaning. See how extra context changes the score:

```python
polysemy_pairs = [
    ("apple stock", "shares of a tech company"),
    ("apple stock", "a crisp red fruit"),
    ("Apple Inc. stock price", "shares of a tech company"),
]

for query, document in polysemy_pairs:
    query_vec = list(model.embed([query]))[0]
    doc_vec = list(model.embed([document]))[0]
    score = cosine_similarity(query_vec, doc_vec)
    print(f"{score:.3f}  |  {query!r}  vs  {document!r}")
```

Does `"apple stock"` score higher against the finance sense or the fruit sense, and does that match the sense you meant? Then compare that first score to the third row: does spelling out `"Apple Inc."` instead of `"apple"` pull the score toward the finance sense, and by how much?

### Distance Metric Comparison

| Metric | Common use | Notes |
|--------|----------|-------|
| Cosine | Text similarity, NLP (Natural Language Processing) models | Compares vector direction and ignores vector length. A common default for text embeddings. |
| Dot product | Vectors already normalized to unit length | Produces the same ranking as cosine similarity when every vector has unit length. |
| Euclidean (L2) | Image embeddings, spatial data | Measures the straight-line distance between vectors. Both direction and length affect the score. |
| Manhattan (L1) | Grid-like or count-based data | Adds the absolute difference for each dimension. Less common for text embeddings. |

**Cosine vs. dot product:** When vectors are normalized to unit length, cosine similarity and dot product produce the same ranking. In that case, dot product is a simpler way to calculate the same result. Qdrant normalizes vectors when you use cosine distance, then uses dot product internally during search.

## 6. Why Similarity Alone Is Not Enough

Sections 1 and 2 showed keyword search failing on synonyms, paraphrasing, polysemy, and word order. It's tempting to read that as "semantic search replaces keyword search." It doesn't, each is strong exactly where the other is weak, as the next two cases show. 

In Qdrant, each item you store is called a **point**. A point contains a vector and can also include a **payload**, which is metadata such as a timestamp or permission list. A **collection** is the group of points you search.

You can use a **filter** to restrict results by payload values, such as only returning documents a user can access. Filtering narrows the results before similarity search ranks them. Later modules show how to combine them in a Qdrant query.

### Word Order and Negation Still Trip It Up

Section 2 said keyword search can't tell "dog bites man" from "man bites dog." You'd expect semantic search to fix that. It mostly doesn't:

| Pair | Cosine similarity |
|------|-------------------|
| "dog bites man" vs "man bites dog" | 0.907 |
| "safe for kids" vs "harmful to kids" | 0.779 |
| "dog bites man" vs "a canine attacked a person" | 0.570 |

The first two rows score high, even though each pair means something different: one flips who's doing the biting, the other flips safe into dangerous. For this model and this kind of phrasing, high lexical overlap still produces a high score, even though a person would read these pairs as opposites right away.

The third pair is a paraphrase: "a canine attacked a person" means nearly the same thing as "dog bites man." Yet it receives a lower score (0.570) than the reversed sentence (0.907), which changes the meaning.

Semantic search works well for many synonyms and paraphrases, but similarity scores can still miss important details such as word order and negation. Do not rely on similarity alone when those details matter.

### Exact Matching: When You Need a Filter, Not Similarity

Not every query needs semantic understanding. A query for an exact product code, like "SKU-48291", needs an exact match instead. Try it yourself: embed the query and three candidate product codes, then compare their cosine scores.

<aside role="status">Again, this is a hand-rolled example so you can see why similarity search falls short here. Qdrant doesn't ask you to embed and compare codes like this, you'd just filter on the payload field, as shown further down.</aside>

```python
from fastembed import TextEmbedding
import numpy as np

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

query = "SKU-48291 issue"
candidates = ["SKU-48292", "SKU-48291", "SKU-48290"]  # wrong, correct, wrong

query_vec = list(model.embed([query]))[0]

for candidate in candidates:
    candidate_vec = list(model.embed([candidate]))[0]
    score = cosine_similarity(query_vec, candidate_vec)
    print(f"{score:.3f}  |  {candidate}")

# Real output:
#   0.730  |  SKU-48292  (wrong product)
#   0.734  |  SKU-48291  (correct product)
#   0.765  |  SKU-48290  (wrong product, scores HIGHEST)
```

The wrong product code coming out on top is a real failure, and the fix is a payload filter, not keyword search: restrict the search to points where the `sku` field equals `"SKU-48291"`, and you get back exactly that product, no embedding or similarity score involved. Module 2 shows how to write that filtered query for real, once we have a Qdrant collection to run it against.

A payload filter is different from keyword search. A filter checks whether a field has an exact value. Keyword search, such as BM25, ranks documents by the words they share with the query. Similarity search, keyword search, and filters solve different retrieval problems, and production systems often combine them.

## 7. When a System Needs Both

The previous examples show why no single retrieval method works for every query. A search system may need semantic search to find related meaning, filters to match exact values such as a SKU, and keyword search when matching terms should affect the ranking.

**Hybrid search** specifically combines semantic retrieval with keyword retrieval. It uses **dense vectors** to compare meaning and **sparse vectors** to match and rank terms, often with an algorithm such as BM25.

Not every search system needs hybrid search. But when users may search by either meaning or specific terms, combining both methods can return more relevant results.

Hybrid search is the next module's topic.

## 8. Further Reading

- [Distance Metrics](/course/essentials/day-1/distance-metrics/) Learn more about cosine similarity, dot product, and Euclidean distance.
- [Vector Embeddings Explained](/articles/what-are-embeddings/) A deeper introduction to how embedding models turn data into vectors.
- [FastEmbed](/articles/fastembed/) Learn more about the library used to generate embeddings in this module.

## What's Next: Module 2

In the next module, we'll break down:

- What is a vector, and why does it have hundreds to thousands of dimensions?
- How do dimensions actually represent meaning?
- How similarity really works under the hood, and when it fails.
- Your first Qdrant collection: points, payloads, and your first query.
