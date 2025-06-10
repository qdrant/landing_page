---
draft: false
title: "Database Migration Tool: One-Command Cluster-to-Cluster Transfers"
short_description: "Qdrant’s migration tool (beta) lets you move data across clusters or regions with one command—no snapshots needed. Try it now."
description: "Migrate data across clusters, regions, from open source to cloud, and more with just one command."
preview_image: /blog/beta-database-migration-tool/tool-beta.jpg
social_preview_image: /blog/beta-database-migration-tool/tool-beta.jpg
title_preview_image: /blog/beta-database-migration-tool/tool-beta.jpg
date: 2025-06-10T00:02:00Z # year, month, date
author: Qdrant
featured: false
tags:
  - Qdrant
---

## Migrating your data just got easier

We’ve launched the **beta** of our Qdrant Migration Tool, designed to simplify moving data between different instances, whether you're migrating between Qdrant deployments or switching from other vector database providers.

This powerful tool streams all vectors from a source collection to a target Qdrant instance in live batches. It supports migrations from one Qdrant deployment to another, including from open source to Qdrant Cloud or between cloud regions. But that's not all. You can also migrate your data from other vector databases directly into Qdrant. All with a single command.

Unlike Qdrant’s included [snapshot migration method](https://qdrant.tech/documentation/concepts/snapshots/), which requires consistent node-specific snapshots, our migration tool enables you to easily migrate data between different Qdrant database clusters in streaming batches. The only requirement is that the vector size and distance function must match.

This is especially useful if you want to change the collection configuration on the target, for example by choosing a different replication factor or quantization method.

The easiest way to run the qdrant migration tool is as a container. You can run it on any machine where you have connectivity to both the source and the target Qdrant databases. Direct connectivity between both databases is not required. For optimal performance, you should run the tool on a machine with a fast network connection and minimum latency to both databases.

## Resources 

Access the [Qdrant Migration Tool](https://github.com/qdrant/migration) 

[Check out a tutorial](https://qdrant.tech/documentation/guides/migration/)

Watch this video to learn how to use it for moving data between Qdrant instances:

<iframe width="560" height="315" src="https://www.youtube.com/embed/FU39926M0m4?si=qhrlDibev9We_gLo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
