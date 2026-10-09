---
title: "Choose a multimodal model"
page: /documentation/tutorials-basics/multimodal-search/
skills:
  - qdrant-search-quality/diagnosis
---
Help me pick an embedding model for multimodal search over my own data. Read https://skills.qdrant.tech/qdrant-search-quality/diagnosis/SKILL.md first. Ask me which modalities I actually need to search across, in which direction, what languages my content and my queries are in, and roughly how much of each modality I hold. Then tell me which models bridge that particular gap, since a model that embeds images and text into one space is not the same as one that handles my language pair, and say what each choice costs me in dimension, storage, and inference. Tell me how to check the model fits before I embed everything: a small sample, a handful of queries I know the answers to, and what a bad result looks like. Then give me the collection configuration that follows from the model I picked, and say which parts I cannot change later without re-embedding.
