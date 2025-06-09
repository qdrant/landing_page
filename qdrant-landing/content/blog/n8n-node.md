---
title: "​​Introducing the Official Qdrant Node for n8n" 
draft: false
slug: n8n-node
short_description: Qdrant now has an official, team-supported node for n8n.
description: Qdrant now has an official, team-supported node for n8n.
preview_image: /blog/n8n-node/n8n-node-blog-hero.jpg
date: 2025-06-09
author: Evgeniya (Jenny) Sukhodolskaya 
featured: false
tags:
  - news
  - blog
  - n8n

---

## ​​Introducing the Official Qdrant Node for n8n

Amazing news for n8n builders working with semantic search: Qdrant now has an official, team-supported node for n8n, available as a verified community note!
This new integration brings the full power of Qdrant’s vector database directly into your n8n workflows: no more wrestling with HTTP nodes.
Whether you’re building RAG systems, intelligent agents, or advanced unstructured data analysis tools, this node is designed to make your life easier and your solutions more robust.

## Why This Matters

Previously, integrating Qdrant with n8n meant manually configuring HTTP requests for every operation, limiting access to advanced features like batch upserts, custom embeddings, and hybrid search.

The new Qdrant node changes that.

It supports everything Qdrant can do, including hybrid search, reranking with multivectors, batch upserts and updates, sophisticated filtering, and compatibility with the latest [Qdrant 1.14.0](https://qdrant.tech/blog/qdrant-1.14.x/) release.

The Qdrant node is available for both cloud and self-hosted n8n instances, starting from version 1.94.0. Installing it is as simple as searching for “Qdrant” in the n8n integrations panel and clicking “Install.” You’ll be up and running in seconds.  

## Step-by-Step Example of Hybrid Search 

One exciting feature of the new node is seamless hybrid search: combining the precision of keyword-based (sparse) search with the semantic power of dense embeddings. This is especially valuable in domains like legal or medical search, where both exact matches and contextual understanding are crucial.

## Video example: How to install & use the node for hybrid search 

<iframe width="560" height="315" src="https://www.youtube.com/embed/sYP_kHWptHY?si=t4GTxVCfTNiXEE4S" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Explore More and Get Involved

The Qdrant node for n8n is just the beginning. You can now build advanced RAG chatbots, agents for unstructured big data analysis, and much more, all natively within n8n. If you want to see more tutorials or have specific use cases in mind, let us know in the comments or join our community discussions.

We welcome your feedback, suggestions, and contributions on GitHub! Don’t forget to star the repo and join our Discord community if you have questions or want to connect with other users.

## Resources

* [Qdrant n8n Node on npm](https://www.npmjs.com/package/n8n-nodes-qdrant)  
* [GitHub Repo](https://github.com/qdrant/n8n-nodes-qdrant)  
* [Video: Connecting Qdrant to n8n](https://youtu.be/fYMGpXyAsfQ?feature=shared&t=194)  
* [Video: Introducing Qdrant's Official n8n Node: Hybrid Search Example](https://www.youtube.com/watch?v=sYP_kHWptHY)
* [Hybrid Search Concepts](https://qdrant.tech/documentation/concepts/search/)
* [Qdrant's n8n User Docs](https://qdrant.tech/documentation/platforms/n8n/)
