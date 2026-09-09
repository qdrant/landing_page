---
title: "From Idea to System"
short_description: "Module 2 of the Beginner Course: the building blocks that take raw text to a running collection."
description: "Move from theory to system design. See every building block that takes raw text to a running Qdrant collection, and how they fit together."
weight: 1
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# From Idea to System

In Module 1, we saw how search evolved from matching words to understanding meaning. Now we move from theory to actual system design. This module covers every building block you need to go from raw text to a running Qdrant collection.

- **Raw Text**
Documents, articles, PDFs

- **Chunk**
Split into passages

- **Embed**
Convert to dense vectors

- **Store**
Upsert to Qdrant: insert a point if its ID is new, update it if the ID already exists

- **Query**
Retrieve the top-K results: the K most similar matches to your query

![An embedding model turns source data into dense vectors; Qdrant stores, indexes, and queries them for an application.](/courses/beginners/module-2/flow.png)
