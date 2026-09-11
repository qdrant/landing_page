---
title: "Searching From Examples and Feedback"
short_description: "Bonus module of the Beginner Course: search with no query text, using examples and feedback."
description: "Search from positive and negative examples with the Recommendation and Discovery APIs, and fold click feedback into the next query."
weight: 7
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Searching From Examples and Feedback

Some searches have no query text. A reader clicks "more like this", or an analyst has three documents that are right and two that are wrong and no words for what separates them.

The [Recommendation API](/documentation/search/explore/#recommendation-api) searches from positive and negative examples. The [Discovery API](/documentation/search/explore/#discovery-api) takes context pairs, where each pair names one region of the vector space to move toward and one to move away from.

When a better model or a click log disagrees with your ranking, [relevance feedback](/documentation/search/search-relevance/#relevance-feedback) folds that disagreement into the next query, across the whole collection. It needs a second model and three weights fitted to your own setup, so start with the tutorial below.

A point passed in by ID, whether as `example`, `positive`, `negative`, or a relevance feedback `target`, is left out of the results. Pass its raw vector instead to keep it eligible.

- [Recommendation API](/documentation/search/explore/#recommendation-api) and [Discovery API](/documentation/search/explore/#discovery-api): searching from examples and from context pairs.
- [Relevance Feedback](/documentation/search/search-relevance/#relevance-feedback): the query interface and what the `naive` strategy computes.
- [Relevance Feedback Retrieval in Qdrant](/documentation/tutorials-search-engineering/using-relevance-feedback/): fitting the weights and evaluating the result.
