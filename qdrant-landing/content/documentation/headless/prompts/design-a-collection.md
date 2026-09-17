---
title: "Design a collection"
page: /documentation/manage-data/collections/
# Two skills because the prompt genuinely spans both. Naming only one would
# label the whole prompt as that one thing, which is why this prompt had no
# skill at all before the body grew to cover sizing.
skills:
  - qdrant-multitenancy
  - qdrant-sizing
---
Help me design a Qdrant collection for my data. Ask me what I am searching over, roughly how many vectors I expect and how fast that will grow, which embedding model I am using, what I will filter on, and what query rate I need, before you write any code. If the use case has to support multiple users, customers, or organizations, decide on a multitenancy strategy by reading https://skills.qdrant.tech/qdrant-multitenancy/SKILL.md. Then derive the vector size from the embedding model rather than hardcoding it, name the distance metric the model was trained for and say why you picked it, and add a payload index for every field I will filter on. Size it before I create anything, reading https://skills.qdrant.tech/qdrant-sizing/SKILL.md: tell me how much memory the vectors and the index will need, how many shards to create and why, whether I need replication, and whether the vectors belong in memory or on disk. If quantization would change that answer, say which kind, what it saves, and what it costs me in recall. Finish by telling me which of these I cannot change later without recreating the collection.
