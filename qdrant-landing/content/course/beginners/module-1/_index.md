---
title: "Module 1: Let's Understand Search"
short_description: "Module 1 of the Beginners course: Understand why traditional search struggles and how modern semantic search improves it."
description: "Understand why traditional search struggles and how modern semantic search improves it. Learn about embeddings, distance metrics, and hybrid search systems."
isLesson: true
weight: 20
---

{{< date >}} Module 1 {{< /date >}}

# Let's Understand Search

Traditional search retrieves documents by matching the words in a query to the words in an index. It's fast and still useful for precise terms, but it can miss relevant results when people express the same intent differently. In this module, you'll see how embeddings let search compare meaning, how similarity is measured, and why modern search often combines both approaches.

#### Overview

> Search has to decide what makes a result relevant. In this module, you'll
learn why matching words falls short and how comparing meaning fixes it.
You'll explore embeddings, cosine similarity, and distance metrics, then
see where similarity alone still fails: word order, negation, and exact
product codes. You'll also meet the vocabulary the rest of the course
builds on, including collections, points, payloads, and filters. By the
end, you'll have embedded your first text and measured how close its
meaning sits to related and unrelated phrases.

## Today's Path

1. [What Is Search?](/course/beginners/module-1/what-is-search/)
2. [Why Keyword Search Struggles](/course/beginners/module-1/why-keyword-search-struggles/)
3. [How Traditional Search Improved](/course/beginners/module-1/how-traditional-search-improved/)
4. [How It Works: Embeddings](/course/beginners/module-1/embeddings/)
5. [Comparing Meaning: Distance Metrics](/course/beginners/module-1/distance-metrics/)
6. [Why Similarity Alone Is Not Enough](/course/beginners/module-1/why-similarity-is-not-enough/)
7. [When a System Needs Both](/course/beginners/module-1/when-a-system-needs-both/)
8. [Further Reading](/course/beginners/module-1/further-reading/)

### Before You Start

To run the code locally, use Python 3.9 or later and install the dependencies:

```bash
pip install fastembed numpy
```

The embedding model runs on your CPU. You don't need a GPU or API keys. The first run downloads the model, so it may take a few minutes and requires an internet connection. Later runs use the cached model.
