---
title: "Module 2: First Principles of Vector Search"
short_description: "Module 2 of the Beginners course: how data is stored, indexed, and retrieved in Qdrant."
description: "Understand collections, points, vectors, payloads, HNSW, chunking, and the ingestion pipeline. Move from theory to actual system design in Qdrant."
isLesson: true
weight: 30
---

{{< date >}} Module 2 {{< /date >}}

# First Principles of Vector Search

<div class="video">
<iframe
  src="https://www.youtube.com/embed/kbdpE514qSY?rel=0"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

Understand collections, points, vectors, payloads, and the HNSW index, and move from theory to actual system design in Qdrant.

**Follow-along code**: [Module 2 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module2.ipynb)

#### Overview

> Module 1 explained why semantic search works. In this module, you'll learn 
where your data lives and how Qdrant searches it. You'll explore collections,
points, vectors, payloads, and distance metrics, then see how Qdrant finds the 
top-k matches without scanning every vector. You'll also learn how to filter
results by metadata and split long documents into smaller chunks before embedding
them. By the end, you'll have created a collection, stored points, and run 
your first filtered query.

## Today's Path

1. [From Idea to System](/course/beginners/module-2/from-idea-to-system/)
2. [Core Data Model](/course/beginners/module-2/core-data-model/)
3. [Distance Metrics](/course/beginners/module-2/distance-metrics/)
4. [Top-K Retrieval](/course/beginners/module-2/top-k-retrieval/)
5. [Fast Approximate Search: HNSW](/course/beginners/module-2/hnsw/)
6. [Payload Filtering](/course/beginners/module-2/payload-filtering/)
7. [Chunking Strategies](/course/beginners/module-2/chunking-strategies/)
8. [Ingestion Pipeline: End-to-End](/course/beginners/module-2/ingestion-pipeline/)
9. [Further Reading](/course/beginners/module-2/further-reading/)
