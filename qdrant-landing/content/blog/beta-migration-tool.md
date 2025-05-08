---
draft: true
title: "Database Migration Tool Beta Launch: One-Command Cluster-to-Cluster Transfers"
short_description: "Qdrant’s Migration Tool (Beta) lets you move data across clusters or regions with one command—no snapshots needed. Try it now."
description: "We're launching the beta of Qdrant’s Database Migration Tool—migrate data across clusters, regions, or from open source to cloud with just one command. No manual snapshots, fully stream-based. Try the beta now!"
preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
social_preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
title_preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
date: 2025-05-07T00:02:00Z # year, month, date
author: Qdrant
featured: false
tags:
  - Qdrant
---

## Migrating your data just got easier

We’ve launched the beta release of our Qdrant Migration Tool, designed to simplify moving data between Qdrant instances.

This tool streams all vectors from a collection in the source Qdrant instance to a target Qdrant instance. It supports migrations from one Qdrant deployment to another, including from open source to Qdrant Cloud or between cloud regions. All with a single command.

Unlike Qdrant’s included [snapshot migration method](https://qdrant.tech/documentation/concepts/snapshots/), which requires consistent node-specific snapshots, our migration tool enables you to easily migrate data between different Qdrant database clusters in streaming batches. The only requirement is that the vector size and distance function must match.

This is especially useful if you want to change the collection configuration on the target, for example by choosing a different replication factor or quantization method.

The easiest way to run the qdrant migration tool is as a container. You can run it any machine where you have connectivity to both the source and the target Qdrant databases. Direct connectivity between both databases is not required. For optimal performance, you should run the tool on a machine with a fast network connection and minimum latency to both databases. [Read more about installation.](https://github.com/qdrant/migration?tab=readme-ov-file#installation)

## Learn more and start migrating easily: [Qdrant Migration Tool](https://github.com/qdrant/migration) 

Note: This project is in beta. The API may change in future releases.
