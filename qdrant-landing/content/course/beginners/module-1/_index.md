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

Understand why traditional search struggles and how modern semantic search improves it.

## In This Module, You'll Learn

- Why keyword search misses relevant results
- How embeddings let search compare meaning
- How cosine similarity measures that meaning
- When exact matching still matters

### Before You Start

Choose how you want to follow this module:

- **Use Colab:** [Open the companion notebook in Colab](https://colab.research.google.com/github/qdrant/examples/blob/master/Beginner-course/Module1.ipynb) to run the examples in your browser.
- **Run locally:** Use Python 3.9 or later, then install the dependencies:

```bash
pip install fastembed numpy
```

The embedding model runs on your CPU. You don't need a GPU or API keys.

## 1. What Is Search?

Search is the act of finding the right information out of everything you have, given a question. You type "car repair" into a box, and something has to decide which of your thousands of documents, products, or messages actually answers that.

Every search system, no matter how it's built internally, does the same two things:

1. **Retrieve**: narrow a huge collection down to a shortlist of documents that might be relevant.
2. **Rank**: order that shortlist so the best answer ends up near the top.

This module is about one question: how does a system decide what "relevant" means? We'll start with the simplest possible answer, watch it fail, and build up from there. No prior knowledge of vector search engines or indexing algorithms is assumed.

## 2. The Problem: Why Keyword Search Struggles

Keyword search retrieves documents by exact word match: it checks whether the literal terms in your query appear in the document, with no understanding of what those terms mean. That works when people use the same terms as the content they need, as the example shows.

![Keyword search only matches documents that contain the exact words "car" and "repair"](/courses/beginners/module-1/car-repair.png)

That creates a few common problems:

- **Different words, same meaning:** "car repair" misses "automobile maintenance."
- **Same word, different meaning:** "Apple stock" can retrieve fruit content instead of financial information.
- **Same words, different order:** "dog bites man" and "man bites dog" contain the same terms, but mean very different things.

## 3. How Traditional Search Improved

Keyword search picked up real upgrades over the years: faster lookups, relevance ranking, tolerance for typos, matching on word roots. Each made matching faster or more forgiving, but none of them taught the system what words mean. A keyword system can't know "car" and "automobile" are synonyms unless someone hard-codes that fact, and you can't hard-code an entire language.

That's the gap semantic search closes. Instead of asking "Does this document contain the same words?" it asks "Does this document mean the same thing?" Nobody hand-codes the fact that "car" and "automobile" are related, the model learns it from the text it was trained on, and sentences with related meaning end up as vectors that sit close together, even when they share no words.

## 4. How It Works: Embeddings

### What Is an Embedding?

An embedding is a vector: a list of numbers that captures meaning. Semantic search works by converting text into embeddings, text with similar meaning produces embeddings that sit close together in high-dimensional space, and text with different meaning produces embeddings that sit far apart. Each position in that list is a dimension; no single one maps to a human concept like "color," meaning comes from all of them combined.

### The Embedding Model

An embedding model takes a piece of text and returns a fixed-length array of floating-point numbers. The exact numbers matter less than the relationships between them.

```python
from fastembed import TextEmbedding

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

# model.embed() takes a list of strings and returns one vector per string
query_vec = list(model.embed(["car repair"]))[0]
doc_vec   = list(model.embed(["automobile maintenance"]))[0]

print(len(query_vec), len(doc_vec))   # check both vectors are the same length: 384 dimensions each
print(query_vec[:5])                  # peek at the first 5 of the query's 384 floats
print(doc_vec[:5])                    # peek at the first 5 of the document's 384 floats
```

![An embedding model turns the text "car repair" into a fixed-length list of 384 numbers](/courses/beginners/module-1/generating-vector.png)

### Model Size: A Tradeoff

Embedding models come in different sizes. Smaller models (128–384 dimensions, like the one above) are fast and cheap to run. Larger ones (1024+ dimensions) can capture more nuance and context, at the cost of more compute and memory. Dimension count alone isn't a quality signal, a well-trained small model can beat a poorly trained large one.

### Why This Model

This module uses `sentence-transformers/all-MiniLM-L6-v2` because it's small enough to run on a CPU with no API keys or GPU, and accurate enough to demonstrate semantic search clearly. When you start your own project, see [Points, Vectors and Payloads](/course/essentials/day-1/embedding-models/) for how to weigh size, language, and domain fit when picking a model.

## 5. Comparing Meaning: Distance Metrics

Once we have vectors, we need a way to measure how similar two of them are. Different metrics suit different situations.

### Cosine Similarity

The most common metric for text. It measures the angle between two vectors and ignores their length, focusing purely on direction. Scores range from -1 to 1: 1.0 means the vectors point the same way, 0.0 means unrelated, -1 means opposite. In practice, normalized text-embedding models like the one used here rarely produce negative scores, so unrelated text usually lands as a small positive number instead.

$$
\text{cosine\_similarity}(A, B) = \frac{A \cdot B}{\lVert A \rVert \, \lVert B \rVert}
$$

![Cosine similarity measures the angle between two vectors: a smaller angle gives a score closer to 1, unrelated vectors score near 0, and opposite vectors score near -1](/courses/beginners/module-1/cosine-similarity.png)

For example, embedding "car repair" and "automobile maintenance" and comparing the two vectors with this formula yields a similarity score around 0.73, far higher than an unrelated pair would score, reflecting their shared meaning despite having no words in common.

### Try It Yourself: Compare Cosine Scores

Reuse the embedding snippet from section 4 to embed three query/document pairs, then score each pair with cosine similarity, using the formula above implemented directly with NumPy.

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

**Your turn:** swap in a polysemy case. Score `"apple stock"` against both `"shares of a tech company"` and `"a crisp red fruit"`. Which comes out higher, and does it match the sense you meant?

### Distance Metric Comparison

| Metric | Best for | Notes |
|--------|----------|-------|
| Cosine | Text similarity, NLP (Natural Language Processing) models | Robust to different vector magnitudes. Most common default. |
| Dot product | Vectors already normalized to unit length | Numerically identical to cosine similarity once vectors are unit length, same score, not a separate metric. |
| Euclidean (L2) | Image embeddings, spatial data | Sensitive to magnitude; works best with models trained for it. |
| Manhattan (L1) | Grid-like or count-based data | Sums absolute differences per dimension rather than squaring them first, making it less affected by extreme values in any single dimension. |

**Cosine vs. dot product:** for vectors normalized to unit length, dot product produces the exact same ranking as cosine similarity, it's a cheaper way to compute the same result, not a different metric. That's why Qdrant normalizes vectors on upload and computes a "Cosine" collection as a dot product internally.

## 6. Why Similarity Alone Is Not Enough

Sections 1 and 2 showed keyword search failing on synonyms, paraphrasing, polysemy, and word order. It's tempting to read that as "semantic search replaces keyword search." It doesn't, each is strong exactly where the other is weak, as the next two cases show. (Filtering by recency, permissions, or other payload values, and combining that with ranking signals, is a separate layer on top of similarity, later modules cover it once you have a collection to filter.)

### Word Order and Negation Still Trip It Up

Section 2 said keyword search can't tell "dog bites man" from "man bites dog." You'd expect semantic search to fix that. It mostly doesn't:

| Pair | Cosine similarity |
|------|-------------------|
| "dog bites man" vs "man bites dog" | 0.907 |
| "safe for kids" vs "harmful to kids" | 0.779 |
| "dog bites man" vs "a canine attacked a person" | 0.570 |

The first two rows score high, even though each pair means something different: one flips who's doing the biting, the other flips safe into dangerous. The model mostly notices that the two sentences share almost all the same words, so it calls them similar, even though a person would read them as opposites right away.

The third row is the sharpest version of the problem: "a canine attacked a person" is a genuine paraphrase of "dog bites man," meaning the same thing in different words, yet it scores lower (0.570) than the reversed, opposite-meaning sentence (0.907). Shared words move the score more than shared meaning does.

So: semantic search is great at synonyms and paraphrasing, but shaky on word order and negation. Don't rely on a similarity score alone anywhere it actually matters whether something is "safe" or "not safe."

### Exact Matching: Where Keyword Search Wins

Not every query needs semantic understanding. A query for an exact SKU (Stock Keeping Unit, the unique code a retailer assigns to one specific product), like "SKU-48291," needs an exact match instead. Try it yourself: embed the query and three candidate SKUs, then compare their cosine scores.

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

Semantic similarity here doesn't just drift toward the wrong SKU, it ranks the wrong one first. A keyword-style exact filter gets it right, trivially: restrict the results to points where the `sku` payload field equals `"SKU-48291"`, and only that one product comes back, no embedding, no similarity score, just an exact match. Module 2 builds a real filtered Qdrant query once there's a collection with payloads to filter.

Keyword matching isn't obsolete, it's exactly the right tool when a query needs to hit one precise token. Dense similarity finds the general neighborhood of relevant results; exact keyword matching finds the right point within it. Neither replaces the other.

## 7. When a System Needs Both

The SKU example above is why some production systems run semantic and exact retrieval together rather than picking one: a single collection can serve queries that need meaning and queries that need one precise token. This isn't a universal requirement, plenty of systems only ever need one or the other, but when a use case needs both, that's called **hybrid search**, combining **dense** (semantic/vector) retrieval with **sparse** (keyword-style, e.g. BM25) retrieval.

Hybrid search is the next module's topic.

## 8. References & Further Reading

**Qdrant docs:**

- [Qdrant Documentation Overview](/documentation/overview/)
  - How Qdrant's vector search engine fits together: collections, points, payloads, and APIs.
- [Distance Metrics](/course/essentials/day-1/distance-metrics/)
  - Cosine, dot product, and Euclidean distance compared, and how to pick the right one for your embedding model.
- [Filtering](/documentation/search/filtering/)
  - Payload filter syntax, indexed fields, and combining filters with vector queries.

**Go deeper:**

- [Vector Embeddings Explained](/articles/what-are-embeddings/)
  - A longer walkthrough of how embedding models are trained and how embeddings are used in ML and search.
- [What Is a Vector Database?](/articles/what-is-a-vector-database/)
  - Why storing and searching vectors at scale needs purpose-built infrastructure, not a bolt-on to a relational database.
- [FastEmbed: Qdrant's Efficient Python Library for Embedding Generation](/articles/fastembed/)
  - The library used in this module's code samples, and how it differs from running models directly.
- [Fine-Tuning Sparse Embeddings for E-Commerce Search, Part 1: Why Sparse Embeddings Beat BM25](/articles/sparse-embeddings-ecommerce-part-1/)
  - A deeper look at the "sparse" side of hybrid search from section 7.
- [What Is RAG in AI?](/articles/what-is-rag-in-ai/)
  - How retrieval-augmented generation (RAG) works and where a vector search engine fits in.

**Definitions:**

- [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Dot product](https://en.wikipedia.org/wiki/Dot_product)
- [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance)
- [Manhattan (taxicab) distance](https://en.wikipedia.org/wiki/Taxicab_geometry)

## What's Next: Module 2

In the next module, we'll break down:

- What is a vector, and why does it have hundreds to thousands of dimensions?
- How do dimensions actually represent meaning?
- How similarity really works under the hood, and when it fails.
- Your first Qdrant collection: points, payloads, and your first query.
