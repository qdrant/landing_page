---
title: "Plan time-based shards"
page: /documentation/tutorials-operations/time-based-sharding/
skills:
  - qdrant-scaling/scaling-data-volume/sliding-time-window
---
Help me plan time-based sharding for my Qdrant collection. First, read https://skills.qdrant.tech/qdrant-scaling/scaling-data-volume/sliding-time-window/SKILL.md

Before choosing a shard interval or retention window, ask me what my data contains, how quickly it arrives, how far back queries typically reach, and how long I need to retain it. Treat daily shards and a seven-day window as an example, not a default.

Recommend an interval and retention window based on my answers, and explain why they fit. If a sliding time window would not suit my workload, for example, because queries routinely span the full history or older data must remain searchable, say so before proposing a configuration.

If it fits, show me how to derive shard keys from my timestamp field. Then lay out the job that creates new shards and removes expired ones, including what runs at each time boundary and in what order. Explain how to handle a point that arrives late when its shard has already been deleted.

Finally, explain which choices I can change later and which require recreating the collection.
