---
title: "Choose a multimodal model"
page: /documentation/tutorials-basics/multimodal-search/
skills:
  - qdrant-search-quality/diagnosis
---
Help me choose an embedding model for multimodal search over my own data. First, read https://skills.qdrant.tech/qdrant-search-quality/diagnosis/SKILL.md

Ask me which modalities I need to search across and in which direction, for example, text queries that find images. Also ask which languages my content and queries use, and roughly how much data I have in each modality.

Use those details to identify models that support my search needs. Distinguish between support for different modalities and support for different languages: a model that puts images and text in the same embedding space may not work well for my language pair. Explain each option’s embedding dimensions, storage requirements, and inference costs.

Before I embed the full dataset, help me test the model on a small sample using a handful of queries with known relevant results. Explain what to look for and which failures would suggest the model is a poor fit.

Once I’ve chosen a model, give me the corresponding Qdrant collection configuration. Explain which choices I can change later, which require rebuilding the collection or index, and which require re-embedding the data.
