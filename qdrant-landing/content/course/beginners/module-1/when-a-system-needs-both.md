---
title: "When a System Needs Both"
short_description: "Module 1 of the Beginner Course: when to combine semantic matching with exact matching."
description: "Learn when a search system needs both semantic matching and exact matching, and how the two approaches cover each other's blind spots."
weight: 7
isLesson: true
---

{{< date >}} Module 1 {{< /date >}}

# When a System Needs Both

Those failures show why no single retrieval method works for every query. A search system may need semantic search to find related meaning, filters to match exact values such as a SKU, and keyword search when matching terms should affect the ranking.

**Hybrid search** specifically combines semantic retrieval with keyword retrieval. It uses **dense vectors** to compare meaning and **sparse vectors** to match and rank terms, often with an algorithm such as BM25.

Not every search system needs hybrid search. But when users may search by either meaning or specific terms, combining both methods can return more relevant results.

Module 3 covers hybrid search in detail.
