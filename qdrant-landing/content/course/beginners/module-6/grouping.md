---
title: "Grouping: One Slot per Document"
short_description: "Bonus module of the Beginner Course: stop one document filling the page with its own chunks."
description: "Group results by a payload field so one document takes one slot, and see why deduplicating after the search leaves the page short."
weight: 6
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Grouping: One Slot per Document

Chunking creates the neighbor problem: one long document becomes many points, and a strong match on it can fill the whole first page with its own chunks. [`query_points_groups`](/documentation/search/search/#grouping-api) groups results by a payload field and returns a set number of groups, so one document takes one slot.

`group_size` caps how many chunks come back inside each group, and `with_lookup` attaches a parent record from another collection.

Deduplicating the results yourself after the search does not fill the page. If the top 10 hits are all chunks from three documents, you are left with three results and no way to get more without searching again. Asking the server for 10 groups returns 10 documents the first time.

Strict mode is on by default in Qdrant Cloud, and it rejects grouping on a field with no payload index, returning a 400. The field most often missing one is `document_id`.

- [Grouping API](/documentation/search/search/#grouping-api): `group_by`, `group_size`, and `with_lookup`.
- [Multi-Representation Search](/documentation/tutorials-search-engineering/multi-representation-search/): storing one document as several points and grouping them back together.
