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

The embedding model runs on your CPU. You don't need a GPU or API keys. The first run downloads the model, so it may take a few minutes and requires an internet connection. Later runs use the cached model.

## 1. What Is Search?

Search is the act of finding the right information out of everything you have, given a question. You type "car repair" into a box, and something has to decide which of your thousands of documents, products, or messages actually answers that.

Every search system, no matter how it's built internally, does the same two things:

1. **Retrieve**: narrow a huge collection down to a shortlist of documents that might be relevant.
2. **Rank**: order that shortlist so the best answer ends up near the top.

This module is about one question: how does a system decide what "relevant" means? We'll start with the simplest possible answer, watch it fail, and build up from there. No prior knowledge of vector search engines or indexing algorithms is assumed.

## 2. The Problem: Why Keyword Search Struggles

In its simplest form, keyword search retrieves documents by exact word match: it checks whether the literal terms in your query appear in the document, with no understanding of what those terms mean. That works when people use the same terms as the content they need, as the example shows. (Real keyword systems add stemming, typo tolerance, and ranking on top, section 3 covers those, but none of them teach the system what words mean, which is the gap this module is really about.)

![Keyword search only matches documents that contain the exact words "car" and "repair"](/courses/beginners/module-1/car-repair.png)

That creates a few common problems:

- **Different words, same meaning:** "car repair" misses "automobile maintenance."
- **Same word, different meaning:** "Apple stock" can retrieve fruit content instead of financial information.
- **Same words, different order:** "dog bites man" and "man bites dog" contain the same terms, but mean very different things.

## 3. How Traditional Search Improved

Keyword search picked up real upgrades over the years: faster lookups, relevance ranking, tolerance for typos, matching on word roots. Each made matching faster or more forgiving, but none of them taught the system what words mean. A keyword system can't know "car" and "automobile" are synonyms unless someone hard-codes that fact, and you can't hard-code an entire language.

That's the gap **semantic search** closes. Instead of asking "Does this document contain the same words?" it asks "Does this document mean the same thing?" Nobody hand-codes the fact that "car" and "automobile" are related, the model learns it from the text it was trained on, and sentences with related meaning end up as vectors that sit close together, even when they share no words.

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

### Model Size: A Tradeoff

Embedding models vary along two mostly separate axes. The model's parameter count and architecture (how "big" the model itself is) drive how much compute it takes to generate an embedding, and how much nuance it can capture. The output's dimension count (128–384 for smaller models, 1024+ for larger ones, like the 384 above) drives how much memory each vector takes to store and how expensive it is to compare at search time. The two don't always move together: a bigger model doesn't automatically output bigger vectors, and more dimensions alone isn't a quality signal, a well-trained small model can beat a poorly trained large one.

### Why This Model

This module uses `sentence-transformers/all-MiniLM-L6-v2` because it's small enough to run on a CPU with no API keys or GPU, and accurate enough to demonstrate semantic search clearly. When you start your own project, see [Points, Vectors and Payloads](/course/essentials/day-1/embedding-models/) for how to weigh size, language, and domain fit when picking a model.

## 5. Comparing Meaning: Distance Metrics

Once we have vectors, we need a way to measure how similar two of them are. Different metrics suit different situations.

### Cosine Similarity

Cosine similarity measures the angular similarity between two vectors. It focuses on whether vectors point in the same direction rather than on their length. This aligns well with many text embeddings, where the angle encodes meaning and the length is less important.

$$
\text{cosine\_similarity}(A, B) = \frac{A \cdot B}{\lVert A \rVert \, \lVert B \rVert}
$$

Here $A \cdot B$ is the **dot product**: multiply each pair of matching positions in the two vectors and sum the results. $\lVert A \rVert$ is the vector's length (magnitude). Dividing the dot product by both lengths is what turns a raw dot product into a length-independent angle measurement.

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

**Your turn:** run this block (it reuses `model` and `cosine_similarity` from above) to test a polysemy case, and see how much a little extra context changes the score:

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

| Metric | Best for | Notes |
|--------|----------|-------|
| Cosine | Text similarity, NLP (Natural Language Processing) models | Robust to different vector magnitudes. Most common default. |
| Dot product | Vectors already normalized to unit length | Numerically identical to cosine similarity once vectors are unit length, same score, not a separate metric. |
| Euclidean (L2) | Image embeddings, spatial data | Sensitive to magnitude; works best with models trained for it. |
| Manhattan (L1) | Grid-like or count-based data | Sums absolute differences per dimension rather than squaring them first, making it less affected by extreme values in any single dimension. |

**Cosine vs. dot product:** for vectors normalized to unit length, dot product produces the exact same ranking as cosine similarity, it's a cheaper way to compute the same result, not a different metric. That's why Qdrant normalizes vectors on upload and computes a "Cosine" collection as a dot product internally.

## 6. Why Similarity Alone Is Not Enough

Sections 1 and 2 showed keyword search failing on synonyms, paraphrasing, polysemy, and word order. It's tempting to read that as "semantic search replaces keyword search." It doesn't, each is strong exactly where the other is weak, as the next two cases show. 

In Qdrant, each thing you store is a [**point**](https://qdrant.tech/documentation/manage-data/points/): a vector plus an optional [**payload**](https://qdrant.tech/documentation/manage-data/payload/), arbitrary metadata like a timestamp or a permission list, and a [**collection**](https://qdrant.tech/documentation/manage-data/collections/) is the set of points you search over. [Filtering](https://qdrant.tech/documentation/search/filtering/) by recency, permissions, or other payload values, and combining that with ranking signals, is a separate layer on top of similarity, later modules cover it once you have a collection to filter.

### Word Order and Negation Still Trip It Up

Section 2 said keyword search can't tell "dog bites man" from "man bites dog." You'd expect semantic search to fix that. It mostly doesn't:

| Pair | Cosine similarity |
|------|-------------------|
| "dog bites man" vs "man bites dog" | 0.907 |
| "safe for kids" vs "harmful to kids" | 0.779 |
| "dog bites man" vs "a canine attacked a person" | 0.570 |

The first two rows score high, even though each pair means something different: one flips who's doing the biting, the other flips safe into dangerous. For this model and this kind of phrasing, high lexical overlap still produces a high score, even though a person would read these pairs as opposites right away.

The third row is the sharpest version of the problem: "a canine attacked a person" is a genuine paraphrase of "dog bites man," meaning the same thing in different words, yet it scores lower (0.570) than the reversed, opposite-meaning sentence (0.907). Shared words move the score more than shared meaning does.

So: semantic search is great at synonyms and paraphrasing, but shaky on word order and negation. Don't rely on a similarity score alone anywhere it actually matters whether something is "safe" or "not safe."

### Exact Matching: When You Need a Filter, Not Similarity

Not every query needs semantic understanding. A query for an exact product code, like "SKU-48291" (SKU stands for Stock Keeping Unit, the retail term for this kind of code), needs an exact match instead. Try it yourself: embed the query and three candidate product codes, then compare their cosine scores.

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

Keyword search (like BM25, covered in the hybrid search section below) is a separate tool from a payload filter: it ranks documents by shared vocabulary, rather than checking for one exact match. Similarity, filters, and keyword search each solve a different problem, none of them replaces the others.

## 7. When a System Needs Both

The product code example above is why some production systems combine semantic search with exact filters or keyword search rather than picking one: a single collection can serve queries that need meaning, queries that need one precise token, and queries that need term-based relevance ranking. 

This isn't a universal requirement, plenty of systems only ever need one of these, but when a use case needs both meaning-based and term-based retrieval, that's called **hybrid search**: combining **dense** (semantic/vector) retrieval with **sparse** (keyword-style, e.g. BM25, a decades-old algorithm that ranks documents by how much of the query's vocabulary they contain) retrieval.

Hybrid search is the next module's topic.

## 8. References & Further Reading

**Qdrant docs:**

- [Distance Metrics](/course/essentials/day-1/distance-metrics/)
  - Cosine, dot product, and Euclidean distance compared, and how to pick the right one for your embedding model.
- [Filtering](/documentation/search/filtering/)
  - Payload filter syntax, indexed fields, and combining filters with vector queries.

**Go deeper:**

- [Vector Embeddings Explained](/articles/what-are-embeddings/)
  - A longer walkthrough of how embedding models are trained and how embeddings are used in ML and search.
- [FastEmbed: Qdrant's Efficient Python Library for Embedding Generation](/articles/fastembed/)
  - The library used in this module's code samples, and how it differs from running models directly.

**Definitions:**

- [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Dot product](https://en.wikipedia.org/wiki/Dot_product)
- **Upsert**: to insert a point if its ID doesn't exist yet, or update it in place if it does. It's how you add and modify data in a Qdrant collection. See [Upload Points](/documentation/manage-data/points/#upload-points).

## What's Next: Module 2

In the next module, we'll break down:

- What is a vector, and why does it have hundreds to thousands of dimensions?
- How do dimensions actually represent meaning?
- How similarity really works under the hood, and when it fails.
- Your first Qdrant collection: points, payloads, and your first query.
