---
title: "Load a dataset into Qdrant"
page: /documentation/tutorials-basics/huggingface-datasets/
skills:
  - qdrant-performance-optimization/indexing-performance-optimization
---
Help me load my dataset into Qdrant. First, read https://skills.qdrant.tech/qdrant-performance-optimization/indexing-performance-optimization/SKILL.md

Before writing any upload code, ask me where the data lives, how many records it contains, whether it already has embeddings, and which fields I plan to filter on.

If the data has precomputed vectors, confirm their dimensions and intended distance metric. Don’t assume they match my needs. If they don’t, explain what re-embedding would cost.

Help me decide whether to stream the data or download it first. Choose a batch size based on the size of my records, and explain the choice.

Show me what to configure before the bulk load, including the indexing threshold and any payload indexes to create up front. Explain which settings to restore afterward and when to restore them.

Finish with checks I can use to confirm that all records were loaded and the collection is ready to query. Make clear how to tell the difference between an upload that has finished and a collection that has finished indexing.
