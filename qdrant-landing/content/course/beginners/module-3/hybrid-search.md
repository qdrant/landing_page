---
title: "Hybrid Search: Dense and Sparse"
short_description: "Module 3 of the Beginner Course: run both retrievers in one request and fuse the results."
description: "Hybrid search runs dense and sparse retrieval in the same request and merges their ranked lists into one result set. Learn how fusion works."
weight: 3
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Hybrid Search: Dense and Sparse

Hybrid search runs both retrievers in the same request and combines their ranked lists into one result set.

Run the same `Nike Pegasus 40` query through sparse alone and the picture inverts. The top three:

| Result | Sparse score |
|--------|--------------|
| Nike Pegasus 40 running shoes | 3.8396 |
| Nike Pegasus 40 womens running shoes | 3.8293 |
| Nike Pegasus 41 running shoes | 1.7007 |

Sparse pushes the 41 down to third, because `40` is a different token from `41`. But it now has dense's problem on a different pair: the men's and women's Pegasus 40 share every token the query contains, so it separates them by 0.0103 on a 3.8396 top score, roughly a quarter of a percent. Dense had those two 0.09 apart and no trouble at all.

Each retriever ranks the right shoe first, and each leaves it a hair ahead of something wrong. Neither is safe alone.

![Dense and sparse results for one query, merged by RRF fusion into a single ranked list.](/courses/beginners/module-3/nike-example.png)

### Fusion

**Fusion** combines the ranked results from two retrievers into a single list. After both retrievers finish, Qdrant applies fusion on the server to determine the final ranking.

Qdrant supports two fusion strategies: Reciprocal Rank Fusion and Distribution-Based Score Fusion. See the [Hybrid Queries documentation](/documentation/search/hybrid-queries/) for details and available parameters.

**Reciprocal Rank Fusion (RRF)** is the default. It merges the lists using each candidate's *position* and ignores the raw scores entirely, which matters because a dense score of 0.87 and a BM25 score of 3.84 sit on unrelated scales and cannot be meaningfully added. A document ranked highly by both retrievers finishes above one ranked highly by only one.

![Two ranked lists merged, with shared points ranked higher.](/courses/beginners/module-3/fusion.png)
