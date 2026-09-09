---
title: "Fusion Strategies"
short_description: "Module 3 of the Beginner Course: Reciprocal Rank Fusion compared with Distribution-Based Score Fusion."
description: "Compare the two fusion strategies. Reciprocal Rank Fusion uses position alone, while Distribution-Based Score Fusion rescales scores onto a comparable range."
weight: 5
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Fusion Strategies

The difference between the two strategies is what each does with magnitude. RRF knows only that a document came first, second, or third, so a runaway top match and a photo finish look identical to it. DBSF rescales each retriever's scores onto a comparable range before combining them, which keeps that information at the cost of depending on how those scores are distributed.

| Strategy | How it works | When to use it |
|----------|--------------|----------------|
| RRF (Reciprocal Rank Fusion) | Merges by rank position, discarding raw scores | The default, and the safe choice whenever the two score scales differ, which is nearly always |
| DBSF (Distribution-Based Score Fusion) | Normalizes each retriever's score distribution, then combines | When the size of the gaps between scores carries information worth keeping |

Neither reliably beats the other, so treat the choice as an evaluation result rather than a preference: start with RRF and switch only after measuring on a set of queries with known-good answers. The [Hybrid Queries documentation](/documentation/search/hybrid-queries/) covers both, along with their tuning parameters.
