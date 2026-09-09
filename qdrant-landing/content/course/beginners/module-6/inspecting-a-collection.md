---
title: "Inspecting a Collection"
short_description: "Bonus module of the Beginner Course: facet counts and random sampling for checking what you ingested."
description: "Two features for checking what you actually ingested: facet counts for how selective a filter would be, and random sampling for spot checks."
weight: 7
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Inspecting a Collection

Two features for checking what you actually ingested.

| Feature | What it does |
|---------|--------------|
| [Facet counts](/documentation/manage-data/payload/#facet-counts) | Counts how many points hold each value of a payload field, which also shows how selective a filter would be. |
| [Random sampling](/documentation/search/search/#random-sampling) | Returns a random subset of a collection, for spot-checking ingested data. For a subset that repeats across queries, such as an evaluation set, use the [slice](/documentation/search/filtering/#slice) filter condition instead. |
