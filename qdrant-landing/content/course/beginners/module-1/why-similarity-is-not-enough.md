---
title: "Why Similarity Alone Is Not Enough"
short_description: "Module 1 of the Beginner Course: where semantic search fails, from word order to exact product codes."
description: "See where similarity breaks: negation, word order, and exact product codes. Learn why a payload filter, not a better model, is the fix."
weight: 7
isLesson: true
---

{{< date >}} Module 1 {{< /date >}}

# Why Similarity Alone Is Not Enough

[What Is Search?](/course/beginners/module-1/what-is-search/) and [Why Keyword Search Struggles](/course/beginners/module-1/why-keyword-search-struggles/) showed keyword search failing on synonyms, paraphrasing, polysemy, and word order. It's tempting to read that as "semantic search replaces keyword search." It doesn't, each is strong exactly where the other is weak, as the next two cases show.

In Qdrant, each item you store is called a **point**. A point contains a vector and can also include a **payload**, which is metadata such as a timestamp or permission list. A **collection** is the group of points you search.

You can use a **filter** to restrict results by payload values, such as only returning documents a user can access. Filtering narrows the results before similarity search ranks them. Later modules show how to combine them in a Qdrant query.

### Word Order and Negation Still Trip It Up

[Why Keyword Search Struggles](/course/beginners/module-1/why-keyword-search-struggles/) said keyword search can't tell "dog bites man" from "man bites dog." You'd expect semantic search to fix that. It mostly doesn't:

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
