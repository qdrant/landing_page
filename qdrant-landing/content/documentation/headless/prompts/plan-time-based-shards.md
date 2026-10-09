---
title: "Plan time-based shards"
page: /documentation/tutorials-operations/time-based-sharding/
skills:
  - qdrant-scaling/scaling-data-volume/sliding-time-window
---
Help me plan time-based sharding for my collection. Read https://skills.qdrant.tech/qdrant-scaling/scaling-data-volume/sliding-time-window/SKILL.md first. Ask me what my data is, how fast it arrives, how far back queries actually reach, and how long I am required to keep anything, before you pick an interval, because daily shards and a seven-day window are one example rather than a default. Tell me the shard interval and retention window my answers imply, and say plainly if time-based sharding is the wrong shape for me, which it is when queries routinely span the whole history or when old data has to stay queryable. Then give me the shard key for my timestamp field, the roll-and-prune job including what runs at the boundary, and what happens to a point that arrives late for a shard that is already gone. Tell me which of these I cannot change later without recreating the collection.
