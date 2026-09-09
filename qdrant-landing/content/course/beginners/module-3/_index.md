---
title: "Module 3: Sparse vs Dense vs Hybrid Search"
short_description: "Module 3 of the Beginners course: dense and sparse retrieval, what each one misses, and how hybrid search combines them."
description: "Compare dense and sparse retrieval, see where each one fails on real queries, and build a hybrid search pipeline in Qdrant with rank fusion and filters."
isLesson: true
weight: 40
---

{{< date >}} Module 3 {{< /date >}}

# Sparse vs Dense vs Hybrid Search

Understand dense versus sparse retrieval, their strengths, and how a hybrid approach can combine them.

#### Overview

> Module 2 showed you where your data lives and how Qdrant retrieves it. 
In this module, you'll learn what that retrieval misses and how to cover the gap. 
You'll explore dense and sparse vectors, BM25, and the inverted index, then see 
why a product code defeats either one alone. You'll also learn how fusion merges 
two ranked lists, and where a filter belongs so both retrievers respect it. 
By the end, you'll have built a hybrid collection, run a fused query, 
and filtered it correctly.

## Today's Path

1. [Where We Left Off](/course/beginners/module-3/where-we-left-off/)
2. [The Two Families of Search](/course/beginners/module-3/the-two-families-of-search/)
3. [Hybrid Search: Dense and Sparse](/course/beginners/module-3/hybrid-search/)
4. [Setting Up Hybrid Search in Qdrant](/course/beginners/module-3/hybrid-search-in-qdrant/)
5. [Fusion Strategies](/course/beginners/module-3/fusion-strategies/)
6. [Filtering: Works with Any Retrieval Method](/course/beginners/module-3/filtering/)
7. [Knowledge Check](/course/beginners/module-3/knowledge-check/)
8. [References and Further Reading](/course/beginners/module-3/references-and-further-reading/)
