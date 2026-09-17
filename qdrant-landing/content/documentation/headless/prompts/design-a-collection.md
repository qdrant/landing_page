---
title: "Design a collection"
# No skill: on purpose. The catalog has no collection-design skill, and
# qdrant-multitenancy would label the whole prompt as a tenancy prompt in
# the index. The body still links it where it is actually relevant.
page: /documentation/manage-data/collections/
---
Help me design a Qdrant collection for my data. Ask me what I am searching over, roughly how many vectors I expect, which embedding model I am using, and what I will filter on, before you write any code. If the use case requires supporting multiple users, customers, or organizations, decide on a multitenancy strategy by reading https://skills.qdrant.tech/qdrant-multitenancy/SKILL.md. Then derive the vector size from the model rather than hardcoding it, name the distance metric the model was trained for and say why you picked it, and add a payload index for every field I will filter on. Finish by telling me which of these I cannot change later without recreating the collection.
