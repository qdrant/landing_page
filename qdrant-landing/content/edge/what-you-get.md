---
label: WHAT YOU GET
title: Search Locally,</br>Sync Centrally
description: Running on the device doesn't mean the device is on its own. Each Edge Shard is self-contained, manages its own vector and payload storage, and runs search locally. Sync it with a collection on a central Qdrant server.
cards:
- id: 0
  image:
    src: /img/edge/cards/index-card.svg
    alt: Index
  title: Build the index where the compute is.
  description: Indexing is expensive, and an edge device is the wrong place to pay for it. Write your points to a Qdrant server as well as the local shard, let the server build the index, and sync back only the segments that changed.
- id: 1
  image:
    src: /img/edge/cards/backup-card.svg
    alt: Backup
  title: Back up and restore a device.
  description: Push a shard's data to a central Qdrant server, and restore it when a device is replaced, reset, or provisioned for the first time.
- id: 2
  image:
    src: /img/edge/cards/analyze-card.svg
    alt: Analyze
  title: Analyze across the whole fleet.
  description: Pull data from Edge Shards across your fleet into one Qdrant server when you need to query or analyze across devices rather than within one.
- id: 3
  image:
    src: /img/edge/cards/sync-card.svg
    alt: Sync
  title: Keep the fleet on the same data.
  description: Synchronize Edge Shards through a central Qdrant server to keep every device working from the same set.
sitemapExclude: true
---

