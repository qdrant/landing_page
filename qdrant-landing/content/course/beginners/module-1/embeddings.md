---
title: "How It Works: Embeddings"
short_description: "Module 1 of the Beginner Course: turn text into vectors with FastEmbed and see what those numbers hold."
description: "Learn how embedding models turn text into vectors that capture meaning, and generate your first embeddings locally with FastEmbed and Python."
weight: 4
isLesson: true
---

{{< date >}} Module 1 {{< /date >}}

# How It Works: Embeddings

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

These are related, but they are not the same. A larger model can produce a short vector, and a higher-dimensional vector does not automatically produce better search results.

### Why This Model

This module uses `sentence-transformers/all-MiniLM-L6-v2` because it's small enough to run on a CPU with no API keys or GPU, and accurate enough to demonstrate semantic search clearly. When you start your own project, see [Embedding Models](/course/essentials/day-1/embedding-models/) for how to weigh size, language, and domain fit when picking a model.
