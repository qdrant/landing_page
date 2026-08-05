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

## Today's path

1. What Is Search?
2. The Problem: Why Keyword Search Struggles
3. How Traditional Search Improved
4. How It Works: Embeddings
5. Comparing Meaning: Distance Metrics
6. Why Similarity Alone Is Not Enough
7. Modern Search = Hybrid Systems
8. References & Further Reading

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/Beginner-course/Module1.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

### Before You Start: Environment Setup

You can follow this module two ways: in the browser, or on your own machine. Pick whichever suits you. The embedding model used throughout this module runs locally on your CPU. The Colab notebook linked at the start of this module runs every snippet on this page in your browser, with no account and no setup. To run the code locally instead, you'll need Python 3.9 or later and two packages:

```bash
pip install fastembed numpy
```


## 1. What Is Search?

Search is the act of finding the right information out of everything you have, given a question. You type "car repair" into a box, and something has to decide which of your thousands of documents, products, or messages actually answers that.

Every search system, no matter how it's built internally, does the same two things:

1. **Retrieve**: narrow a huge collection down to a shortlist of documents that might be relevant.
2. **Rank**: order that shortlist so the best answer ends up near the top.

This module is about one question: how does a system decide what "relevant" means? We'll start with the simplest possible answer, watch it fail, and build up from there. No prior knowledge of vector search engines or indexing algorithms is assumed.

## 2. The Problem: Why Keyword Search Struggles

Traditional search works by matching exact words. That's it. If the query string appears in the document, it's a hit. If it doesn't, it's a miss, no matter how closely related the meaning is.

```python
# Simple keyword search
if "car repair" in document:
    return document
```

![Keyword search only matches documents that contain the exact words "car" and "repair"](/courses/beginners/module-1/car-repair.png)

This approach works for predictable, structured queries. It breaks immediately on the language real users actually write.

### Real-World Failure Examples

| Query | Document in the index | Result |
|-------|----------------------|--------|
| car repair | automobile maintenance guide | Missed |
| cheap flights NYC | affordable airfare to New York | Missed |
| Apple stock | apple harvest season guide | Wrong sense matched* |


### The Four Core Failure Modes

- **Synonyms**: "car" and "automobile" mean the same thing, but to a keyword engine they're unrelated.
- **Paraphrasing**: "cheap flights" and "affordable airfare" are identical in intent, invisible to grep.
- **Polysemy**: One word can have multiple meanings. For example, "apple" can mean a fruit or a company
- **Word order**: "dog bites man" and "man bites dog" use identical words. A Keyword search would not understand the nuance.

## 3. How Traditional Search Improved

Keyword search picked up several upgrades over the years. Each one made matching faster or more forgiving, but none of them taught the system what words mean.

| Technique | What it added | Still missing |
|-----------|---------------|---------------|
| Inverted index | Fast lookup across millions of documents without scanning each one | No ranking, no relevance, just presence or absence |
| TF-IDF / BM25 | Relevance ranking based on term frequency and inverse document frequency | No synonyms, no semantic understanding |
| Fuzzy matching | Tolerance for typos and near-spellings (receave → receive) | Still word-based; "automobile" is not a typo of "car" |
| Stemming | Reduces words to their root form (running → run) | Misses cross-vocabulary synonyms entirely |

A keyword system can't know "car" and "automobile" are synonyms unless someone hard-codes that fact, and you can't hard-code an entire language.

### Enter Semantic Search

Semantic search asks a different question. Instead of "Does this document
contain the same words?" it asks "Does this document mean the same thing?". 

Nobody hand-codes the fact that "car" and "automobile" are related. The
model learns it from the text it was trained and sentences converted into vectors end up near
each other despite sharing no words, and search becomes a geometry problem. 

## 4. How It Works: Embeddings

### What Is an Embedding?

An embedding is a vector: a list of numbers that captures meaning. Semantic search works by converting text into embeddings — text with similar meaning produces embeddings that sit close together in high-dimensional space, and text with different meaning produces embeddings that sit far apart.

### The Embedding Model

An embedding model takes a piece of text and returns a fixed-length array of floating-point numbers. The exact numbers matter less than the relationships between them — that's what the rest of this section is about.

```python
from fastembed import TextEmbedding

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

query_vec = list(model.embed(["car repair"]))[0]
doc_vec   = list(model.embed(["automobile maintenance"]))[0]

print(len(query_vec), len(doc_vec))   # 384 dimensions each
print(query_vec[:5])                  # first 5 of the query's 384 floats
print(doc_vec[:5])                    # first 5 of the document's 384 floats
```

![An embedding model turns the text "car repair" into a fixed-length list of 384 numbers](/courses/beginners/module-1/generating-vector.png)

### Kinds of Embedding Models

- **Size (dimensions)**: smaller models (128–384 dims, like the one above) are fast and cheap; larger ones (1024+ dims) can capture more nuance at a higher compute and memory cost. Dimension count alone isn't a quality signal — a well-trained small model can beat a poorly trained large one. See [Points, Vectors and Payloads](/course/essentials/day-1/embedding-models/) for real model sizes and the memory math.
- **Bi-encoder vs. cross-encoder**: a bi-encoder embeds the query and each document separately (what this module uses), so it's fast enough to search a whole collection. A cross-encoder embeds a query and document together for higher accuracy, but only re-ranks a shortlist — too slow to run on everything.
- **Contextual vs. static**: the model used above gives a word a different vector depending on context. Older static models (word2vec, GloVe) give every word one fixed vector, so "bank" means the same thing in "river bank" and "savings bank."
- **Monolingual vs. multilingual, and domain-specific**: some models cover one language, others many; some are fine-tuned on legal, medical, or code text and beat general models there.
- **Multimodal / image-only**: encode images, audio, or a mix of modalities into the same vector space as text.

### Choosing a Model for Your Use Case

Default to a small general bi-encoder for single-language product or FAQ search — that's what this module uses. Go multilingual for cross-language question answering. Add a cross-encoder re-ranking step when precision matters more than speed. Use a domain-tuned model for legal, medical, or code content.

### Dimensions

A dimension is one position in the vector. No single one maps to a human concept like "color"; meaning comes from all of them combined.

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

Reuse the embedding snippet from section 5 to embed three query/document pairs, then score each pair with cosine similarity, using the formula above implemented directly with NumPy.

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
```

**What to look for:** the first two pairs share little or no vocabulary, yet both score high. That's semantic search catching the synonym and the paraphrase that keyword search missed back in section 2. The third pair scores much lower, confirming the model separates unrelated meaning instead of matching surface words.

**Your turn:** swap in a polysemy case. Score `"apple stock"` against both `"shares of a tech company"` and `"a crisp red fruit"`. Which comes out higher, and does it match the sense you meant?

### Distance Metric Comparison

| Metric | Best for | Notes |
|--------|----------|-------|
| Cosine | Text similarity, NLP (Natural Language Processing) models | Robust to different vector magnitudes. Most common default. |
| Dot product | Vectors already normalized to unit length | Numerically identical to cosine similarity once vectors are unit length — same score, not a separate metric. |
| Euclidean (L2) | Image embeddings, spatial data | Sensitive to magnitude; works best with models trained for it. |
| Manhattan (L1) | Grid-like or count-based data | Sums absolute differences per dimension rather than squaring them first, making it less affected by extreme values in any single dimension. |

**Cosine vs. dot product:** cosine similarity is direction only — it divides out the length of both vectors. Dot product is direction times both vectors' magnitudes, so on raw vectors it's sensitive to length in a way that isn't meaningful for text. Once every vector is normalized to unit length, though, both magnitudes are 1, and dot product becomes numerically identical to cosine similarity — dividing by 1 changes nothing. That's why Qdrant normalizes vectors on upload and computes a "Cosine" collection as a dot product internally: it's the same score, computed the simpler way, not an extra speed optimization applied at query time.

## 6. Why Similarity Alone Is Not Enough

Sections 1 and 2 showed keyword search failing on synonyms, paraphrasing, polysemy, and word order. It's tempting to read that as "semantic search replaces keyword search." It doesn't — each is strong exactly where the other is weak, and a real search system needs several more things beyond raw vector similarity:

- **Filtering**: Return only documents within the last 30 days. Return only items the current user has permission to see.
- **Ranking signals**: Recency, popularity, and personalization are payload values that should influence result order beyond pure similarity.

### Word Order and Negation Still Trip It Up

Section 2 said keyword search can't tell "dog bites man" from "man bites dog." You'd expect semantic search to fix that. It mostly doesn't:

| Pair | Cosine similarity |
|------|-------------------|
| "dog bites man" vs "man bites dog" | 0.907 |
| "safe for kids" vs "harmful to kids" | 0.779 |

<!-- Both scores above are verified (FastEmbed, sentence-transformers/all-MiniLM-L6-v2).
     TODO: add a genuine-paraphrase pair scoring ~0.570 here, to show it can score lower than the
     pairs above despite meaning the same thing. Needs the exact sentence pair that produced 0.570 —
     a self-picked paraphrase ("the dog attacked the man" / "the man was attacked by the dog")
     scored 0.967 instead, so it isn't a valid substitute. -->

Both scores are high, even though each pair means something different: one flips who's doing the biting, the other flips safe into dangerous. The model mostly notices that the two sentences share almost all the same words, so it calls them similar, even though a person would read them as opposites right away.

So: semantic search is great at synonyms and paraphrasing, but shaky on word order and negation. Don't rely on a similarity score alone anywhere it actually matters whether something is "safe" or "not safe."

### Exact Matching: Where Keyword Search Wins

A query for an exact SKU (Stock Keeping Unit — the unique code a retailer assigns to one specific product), like "SKU-48291," needs an exact match. Semantic similarity doesn't reliably give you one. Try it yourself: embed the query and three candidate SKUs, then compare their cosine scores.

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
#   0.765  |  SKU-48290  (wrong product — scores HIGHEST)
```

Semantic similarity here doesn't just drift toward the wrong SKU, it ranks the wrong one first. A keyword-style exact filter gets it right, trivially:

```python
# must: { key: "sku", match: { value: "SKU-48291" } }
#   → only SKU-48291 is returned
```

This is the flip side of sections 1 and 2: keyword matching isn't obsolete, it's exactly the right tool when a query needs to hit one precise token. Dense similarity is good at finding the general neighborhood of relevant results; exact, keyword-style matching is what finds the right point within it. Neither replaces the other — which is exactly what hybrid search, up next, is built to combine.

## 7. Modern Search = Hybrid Systems

Production search today combines multiple retrieval signals in a single pipeline. Each signal handles a different class of query. Together, they cover the full spectrum of how real users search.

So far this module has called the two approaches **semantic search** and **keyword search**. In production systems, and in Qdrant's own docs, you'll see them under different names: **dense** and **sparse**. Same ideas, vector-search vocabulary:

### Hybrid Search Components

- **Dense**: another name for semantic/vector search. Each embedding is a dense vector — nearly all of its dimensions (say, 384 of them) carry a non-zero value, and meaning comes from the combination of all of them.
- **Sparse**: another name for keyword-style retrieval — BM25, TF-IDF, and learned sparse embedding models (such as SPLADE, SParse Lexical AnD Expansion). These vectors are mostly zeros, with a non-zero weight only at the dimensions that correspond to matched terms, for exact terms and rare tokens.

Hybrid systems combine both, covering exact terms and intent in one pipeline, at the cost of more complexity to build, tune, and operate.

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
  - A deeper look at the "sparse" side of hybrid search from section 8.
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
