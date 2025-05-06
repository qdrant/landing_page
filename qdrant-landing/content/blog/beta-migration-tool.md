---
draft: true
title: "Beta launch: database migration tool"
short_description: "Short description"
description: "Other description."
preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
social_preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
title_preview_image: /blog/product-ui-changes/new-ui-hero-final.jpg
date: 2025-05-06T00:02:00Z
author: Qdrant
featured: false
tags:
  - Qdrant
---

 Migrating your data just got easier 

We also launched the beta release of a database migration tool, significantly simplifying data migration processes.

You can take data from any Qdrant instance to another. Examples include from open source to another running in Qdrant Cloud as well as migrating from one cloud region to another. All with one command\!

Unlike Qdrant’s included [snapshot migration method](https://qdrant.tech/documentation/concepts/snapshots/), which requires consistent node-specific snapshots, our migration tool enables you to easily migrate data between different Qdrant database clusters in streaming batches. 

This is especially useful if you want to change the collection configuration on the target, for example by choosing a different replication factor or quantization method.

**Learn more and start migrating easily: [Qdrant Migration Tool](https://github.com/qdrant/migration)**