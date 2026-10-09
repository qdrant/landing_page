---
title: "Load a dataset into Qdrant"
page: /documentation/tutorials-basics/huggingface-datasets/
skills:
  - qdrant-performance-optimization/indexing-performance-optimization
---
Help me load my dataset into Qdrant. Read https://skills.qdrant.tech/qdrant-performance-optimization/indexing-performance-optimization/SKILL.md first. Ask me where the data lives, how many records it holds, whether it already carries embeddings, and which fields I will filter on, before writing any upload code. If it has precomputed vectors, confirm the dimension and distance metric they were made for rather than assuming, and tell me what it would cost to re-embed if they do not match what I need. Decide with me whether to stream or download, and pick a batch size from my record size instead of a round number. Tell me what to set before the bulk load rather than after, including the indexing threshold and which payload indexes to create up front, and what to put back afterward. Finish by telling me how to confirm the load actually finished, since an upload that returns is not the same as a collection that is ready to query.
