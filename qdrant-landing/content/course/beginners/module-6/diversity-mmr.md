---
title: "Diversity: Maximal Marginal Relevance"
short_description: "Bonus module of the Beginner Course: trade relevance for variety, and avoid the candidates_limit trap."
description: "Maximal Marginal Relevance picks results that match the query and differ from each other. Learn the candidates_limit trap that makes it look inert."
weight: 5
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Diversity: Maximal Marginal Relevance

Maximal Marginal Relevance (MMR) picks results one at a time, preferring candidates that match the query and differ from what it has already picked. In Qdrant it is a parameter on a nearest neighbors query, and `diversity` sets how much relevance it trades for variety.

The trap is `candidates_limit`. It defaults to the query's `limit`, which leaves MMR nothing spare to choose from, so all it can do is reorder the results it was already given. This is the most common reason MMR looks like it did nothing.

![Two rows over the same eight documents, drawn as five identical squares followed by a circle, a triangle, and a diamond. In the first row, candidates_limit equal to limit gives MMR a pool of only the first four squares, all four of which it selects, so the outcome is a reorder. In the second row, candidates_limit of 8 gives it the whole set, and it selects one square plus the circle, triangle, and diamond, leaving four squares unselected, so the outcome is a different set of documents.](/courses/beginners/module-6/mmr-pool.png)

- [Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr): both parameters, and the scores an MMR query returns.
- [The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries](https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf): the 1998 paper the `diversity` parameter implements.
