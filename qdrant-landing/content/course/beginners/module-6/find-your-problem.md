---
title: "Find Your Problem"
short_description: "Bonus module of the Beginner Course: match a search problem to the Qdrant feature that fixes it."
description: "Pair each common search problem with the feature that addresses it, and see which stage of a query that feature runs in."
weight: 2
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Find Your Problem

Each row pairs a problem with the feature that addresses it, and names the stage of a query where it runs.

| Problem | Feature | Stage |
|---------|---------|-------|
| The right documents come back in the wrong order | [Score boosting](/documentation/search/search-relevance/#score-boosting) with a formula query | Rescore |
| The order should account for recency or distance | [Decay functions](/documentation/search/search-relevance/#decay-functions) inside the formula | Rescore |
| The accurate model is too slow to run over the whole collection | [Multi-stage query](/documentation/search/hybrid-queries/#multi-stage-queries) | Rescore |
| The top results are near-identical | [Maximal Marginal Relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) | Select |
| One document fills the page with its own chunks | [Grouping](/documentation/search/search/#grouping-api) | Select |
| A better model, or user clicks, disagree with retrieval | [Relevance feedback](/documentation/search/search-relevance/#relevance-feedback) | Next query |
| There is no query text, only examples of good and bad | [Recommendation and Discovery APIs](/documentation/search/explore/#recommendation-api) | Replaces the query |

![One query drawn as three stages left to right. Retrieve, which is wide and cheap, holds prefetch, hybrid, and filters. Rescore, which runs over the candidates, holds score boosting, decay, and reranking. Select, which decides what fills the page, holds MMR and grouping.](/courses/beginners/module-6/pipeline.png)
