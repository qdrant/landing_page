---
title: "​​Introducing the Official Qdrant Node for n8n: Native, Powerful, and Ready for Hybrid Search" 
draft: false
slug: n8n-node
short_description: Qdrant now has an official, team-supported node for n8n.
description: Qdrant now has an official, team-supported node for n8n.
preview_image: /blog/n8n-node/n8n-node-blog-hero.jpg
date: 2025-06-07
author: Evgeniya (Jenny) Sukhodolskaya 
featured: false
tags:
  - news
  - blog
  - n8n

---

## ​​Introducing the Official Qdrant Node for n8n: Native, Powerful, and Ready for Hybrid Search 

Amazing news for n8n builders working with semantic search: Qdrant now has an official, team-supported node for n8n, available as a verified community note!   
This new integration brings the full power of Qdrant’s vector database directly into your n8n workflows: no more wrestling with HTTP nodes or manual API calls.   
Whether you’re building RAG systems, intelligent agents, or advanced unstructured data analysis tools, this node is designed to make your life easier and your solutions more robust.

## Why This Matters

Previously, integrating Qdrant with n8n meant manually configuring HTTP requests for every operation, limiting access to advanced features like batch upserts, custom embeddings, and hybrid search. 

The new Qdrant node changes that. 

It supports everything Qdrant can do, including hybrid search, reranking with multivectors, batch upserts and updates, sophisticated filtering, and compatibility with the latest [Qdrant 1.14.0](https://qdrant.tech/blog/qdrant-1.14.x/) release.

The Qdrant node is not just a wrapper; it’s a fully-featured, officially maintained integration. 

##Getting Started: Installation Is a Click Away

The Qdrant node is available for both cloud and self-hosted n8n instances, starting from version 1.94.0. Installing it is as simple as searching for “Qdrant” in the n8n integrations panel and clicking “Install.” You’ll be up and running in seconds.  

## Unlocking Hybrid Search: A Step-by-Step Guide 

One of the most exciting features of the new node is seamless hybrid search: combining the precision of keyword-based (sparse) search with the semantic power of dense embeddings. This is especially valuable in domains like legal or medical search, where both exact matches and contextual understanding are crucial.

\<iframe width="560" height="315" src="https://www.youtube.com/embed/sYP\_kHWptHY?si=hmrJpZtZronO-ibU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen\>\</iframe\>

Here’s a quick walkthrough:  
1\. Create a Hybrid Collection

* Use Qdrant Cloud’s free tier for experimentation.  
* Create a collection that supports both dense (semantic) and sparse (lexical) vectors. For example:

json  
{  
  "semantic": {  
    "size": 4,  
    "distance": "Cosine"  
  },  
  "lexical": {}  
}

Dense vectors are for semantic search; sparse vectors handle keyword searches. The sparse vector configuration is simple—just specify the name, as the size is dynamic1.

2\. Insert Data Points

* Insert points with both dense and sparse vectors. Here’s a sample payload:

json  
\[  
  {  
    "id": "209ed309-bb5e-47fd-8af6-a54eea28e0e7",  
    "payload": {},  
    "vector": {  
      "semantic": \[0.3, 0.1, 0.4, 0.2\],  
      "lexical": {"indices":\[1, 2\], "values": \[0.2, \-0.5\]}  
    }  
  },  
  {  
    "id": "f7e8316e-91da-4b97-9ae9-7503e6cdbd7b",  
    "payload": {},  
    "vector": {  
      "semantic": \[0.4, 0.0, \-0.4, 0.2\],  
      "lexical": {"indices":\[54\], "values": \[\-0.9\]}  
    }  
  }  
\]

Batch upserts are now supported natively, making large-scale data ingestion fast and simple1.

3\. Run a Hybrid Search

* Use the query\_points operation to perform hybrid searches. For example:

json  
\[  
  {  
    "query": \[0.0, 0.6, 0.7, 0.9\],  
    "using": "semantic",  
    "limit": 2  
  },  
  {  
    "query": {  
      "indices": \[55, 2\],  
      "values": \[0.6, 0.7\]  
    },  
    "using": "lexical",  
    "limit": 2  
  }  
\]

* Merge results using reciprocal rank fusion (RRF):

json  
{"fusion": "rrf"}

This approach retrieves top results from both semantic and lexical searches and fuses them, delivering more relevant outcomes,especially for complex, domain-specific queries.

## Explore More and Get Involved

The Qdrant node for n8n is just the beginning. You can now build advanced RAG chatbots, agents for unstructured big data analysis, and much more, all natively within n8n1. If you want to see more tutorials or have specific use cases in mind, let us know in the comments or join our community discussions.

We welcome your feedback, suggestions, and contributions on GitHub\! Don’t forget to star the repo and join our Discord community if you have questions or want to connect with other users.

##Resources:

* [Qdrant n8n Node on npm](https://www.npmjs.com/package/n8n-nodes-qdrant)  
* [GitHub Repo](https://github.com/qdrant/n8n-nodes-qdrant)  
* [Video: Connecting Qdrant to n8n](https://youtu.be/fYMGpXyAsfQ?feature=shared&t=194)  
* [Video: Introducing Qdrant's Official n8n Node: Hybrid Search Example](https://www.youtube.com/watch?v=sYP_kHWptHY)
* [Hybrid Search Concepts](https://qdrant.tech/documentation/concepts/search/)
* [Qdrant's n8n User Docs](https://qdrant.tech/documentation/platforms/n8n/)