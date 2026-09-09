---
title: "Measure First"
short_description: "Bonus module of the Beginner Course: build a golden set and pick the right relevance metric."
description: "Ranking changes are hard to judge by eye. Build a golden set, then pick between Recall@K, Mean Reciprocal Rank, and Normalized Discounted Cumulative Gain."
weight: 2
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Measure First

Ranking changes are hard to judge by eye, because a worse results page still looks like a list of plausible documents. Measure what you have before you change anything.

A golden set pairs queries with the documents that should come back for them. It turns a ranking change into a number.

Sample query and click pairs from your logs, or have someone who knows the domain write 20 or 30 queries with the answers they expect. [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/) covers both and computes the metrics with the Python library [`ranx`](https://amenra.github.io/ranx/).

Pick the metric that matches the labels you ended up with.

- `Recall@K`: the share of the relevant documents that reach the top K. Start here, since logs and a hand-written set both give you the binary labels it needs.
- `MRR` (Mean Reciprocal Rank): how high the first relevant document lands. Use it when the page shows a single answer, as in a chatbot.
- `NDCG@K` (Normalized Discounted Cumulative Gain): how closely the top K matches the best possible order. Use it once you have graded labels, such as 0, 1, and 2.

Measure a baseline at one K, change one thing, then measure the same metric at the same K.
