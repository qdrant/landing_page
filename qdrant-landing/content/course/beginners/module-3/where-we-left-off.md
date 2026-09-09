---
title: "Where We Left Off"
short_description: "Module 3 of the Beginner Course: where dense retrieval gets shaky on exact terms."
description: "Dense retrieval handles meaning well and gets shaky on the part of a query that has to be exact. See where Module 2's pipeline falls short."
weight: 1
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Where We Left Off

In Module 2, you built a complete ingestion and retrieval pipeline: raw text, vector, store, top-K query. Dense retrieval handles meaning well. It gets shaky on the part of a query that has to be exact.

Here is a shoe catalog with two products one digit apart. Searching it dense-only for `Nike Pegasus 40`:

| Result | Dense score |
|--------|-------------|
| Nike Pegasus 40 running shoes | 0.8713 |
| Nike Pegasus 41 running shoes | 0.8626 |
| Nike Pegasus 40 womens running shoes | 0.7830 |
| Nike Pegasus Trail 4 trail running shoes | 0.7425 |

### The Problem

Dense ranks the right shoe first, so nothing here looks broken. Look at the margin: **0.0087**, about one percent of the top score. To the model, "Pegasus 40" and "Pegasus 41" are near-identical statements about running shoes, because that is what they are. The digit a shopper cares about is one token out of five, averaged into a vector describing the whole phrase.

A margin that thin holds across eight products. Across eighty thousand, with every colorway and width in the catalog, something will drift into that one percent and take the top slot. Model numbers, SKUs, and part codes need matching, not neighborhood. That is the gap sparse search fills.
