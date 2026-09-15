---
title: "Design a collection"
skill: qdrant-multitenancy
page: /documentation/manage-data/collections/
---
Help me design a Qdrant collection for my data. Ask me what I am searching
over, roughly how many vectors I expect, which embedding model I am using, and
what I will filter on, before you write any code. Decide first whether this
should be one collection or many, reading
https://skills.qdrant.tech/qdrant-multitenancy/SKILL.md, since that choice
drives the index layout. Then derive the vector size from the model rather than
hardcoding it, name the distance metric the model was trained for and say why
you picked it, and add a payload index for every field I will filter on. Finish
by telling me which of these I cannot change later without recreating the
collection.
