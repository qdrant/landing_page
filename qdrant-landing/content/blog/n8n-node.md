---
title: "​​Introducing the Official Qdrant Node for n8n" 
draft: false
slug: n8n-node
short_description: Qdrant now has an official, team-supported node for n8n.
description: Qdrant now has an official, team-supported node for n8n.
preview_image: /blog/n8n-node/n8n-node-blog-hero.jpg
date: 2025-06-09
author: Maddie Duhon & Evgeniya Sukhodolskaya
featured: false
tags:
  - news
  - blog
  - n8n

---

## ​​Introducing the Official Qdrant Node for n8n

Amazing news for n8n builders working with semantic search: Qdrant now has an [official, team-supported node for n8n](https://www.npmjs.com/package/n8n-nodes-qdrant), an early adopter of n8n's new [verified community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/#submit-your-node-for-verification-by-n8n) feature!

This new integration brings the full power of Qdrant directly into your n8n workflows: no more wrestling with HTTP nodes ever again!
Whether you’re building RAG systems, agentic pipelines, or advanced data analysis tools, this node is designed to make your life easier and your solutions more robust.

## Why This Matters

Previously, using Qdrant in n8n frequently meant configuring HTTP request nodes due to limited access to advanced Qdrant features like batch upserts and updates, hybrid search and recommendations, discovery search and distance matrix API, and many, many more.

The new Qdrant node changes that.

It supports everything Qdrant can do, including hybrid queries, reranking with multivectors, sophisticated filtering, and all that the latest [Qdrant 1.14.0](https://qdrant.tech/blog/qdrant-1.14.x/) release provides.

The Qdrant node is available for **both cloud and self-hosted n8n instances**, starting from version **1.94.0**. Installing it is as simple as clicking “Install” button, you’ll be up and running in seconds.  

## Start Using it Now: How to Install & Use the Node for Hybrid Search

We filmed a short demo for you on how to use this new node for **hybrid search** in Qdrant, as we thought it would be super handy for you to know how to combine the precision of keyword-based (sparse) search with the semantic power of dense embeddings in your n8n solutions.  
It's especially valuable in domains like legal or medical, where both exact matches and contextual understanding are crucial, so we love that you now have access to a method that delivers relevant results for complex, domain-specific queries!

This toy example walks you through fusing dense and lexical hybrid search results using Reciprocal Rank Fusion (RRF).

<iframe width="560" height="315" src="https://www.youtube.com/embed/sYP_kHWptHY?si=t4GTxVCfTNiXEE4S" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allowfullscreen></iframe>

Naturally, you don't have to stop at a simple example! Everything we suggested in our [Hybrid Search article](https://qdrant.tech/articles/hybrid-search/) is now possible to use natively, even our latest [Score-Boosting Reranker](https://qdrant.tech/blog/qdrant-1.14.x/#score-boosting-reranker), which allows for complete customization of the rescoring formula.

## Explore More and Get Involved

This example is just the beginning. You can now build Qdrant-based solutions, from advanced RAG to complicated agentic systems, all natively within n8n. If you want to see more tutorials or have specific use cases in mind, let us know in the comments on the video or join our community discussions.

We welcome your feedback, suggestions, and contributions on GitHub! Don’t forget to star the [new node's repo](https://github.com/qdrant/n8n-nodes-qdrant) and join our [Discord community](https://discord.gg/njJFNKXj) if you have questions or want to connect with other users.

## Resources

* [Qdrant n8n Node on npm](https://www.npmjs.com/package/n8n-nodes-qdrant)  
* [GitHub Repo](https://github.com/qdrant/n8n-nodes-qdrant)  
* [Video: Connecting Qdrant to n8n](https://youtu.be/fYMGpXyAsfQ?feature=shared&t=194)  
* [Qdrant's n8n User Docs](https://qdrant.tech/documentation/platforms/n8n/)