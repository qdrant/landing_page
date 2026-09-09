---
title: "References and Further Reading"
short_description: "Module 5 of the Beginner Course: references on named vectors, multimodal search, and clustering."
description: "References for Module 5: named vectors, multimodal and multilingual search, and the APIs behind the capstone project."
weight: 9
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# References and Further Reading

- [Named Vectors](/documentation/manage-data/vectors/#named-vectors): declaring more than one vector per point and querying a named one with `using`.
- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, Reciprocal Rank Fusion with weights, Distribution-Based Score Fusion, and formula queries.
- [Indexing and Filterable HNSW](/documentation/manage-data/indexing/): payload index types, why indexes come before ingestion, and the IDF modifier that BM25 scoring needs.
- [Filtering](/documentation/search/filtering/): full filter syntax used throughout the capstone, including MatchAny and datetime ranges.
- [Bulk Upload](/documentation/manage-data/bulk-upload/): batch sizes and index ordering for the daily ingestion job.
- [FastEmbed](/documentation/fastembed/): the local embedding path behind `models.Document` and `models.Image`, and every model name it accepts.
- [Multimodal and Multilingual Search](/documentation/tutorials-basics/multimodal-search/): a Cohere Embed 4.0 tutorial building retrieval over images and text in a shared embedding space.
- [multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large): the multilingual swap from [Analyst Queries](/course/beginners/module-5/analyst-queries/), with its 100 languages, 1024 dimensions, and required query and passage prefixes.
- [CLIP ViT-B/32](https://huggingface.co/openai/clip-vit-base-patch32): model card for the image model behind `Qdrant/clip-ViT-B-32-vision` and its text counterpart.
