---
draft: false
title: Why You Shouldn’t Create One Qdrant Collection per User - Derrick Mwiti 
slug: binary-quantization
short_description: Understanding Why You Shouldn’t Create One Qdrant Collection per User.
description: This blog will explore why one collection per user is a scalability trap and provide a better alternative, multi-tenancy with payload indexing. 
preview_image: /blog/One-Qdrant-Collection-per-User/preview.png
date: 2025-23-06T10:30:10.952Z
author: Derrick Mwiti
slug: one-Qdrant-collection-per-user
featured: false
tags:
  - Qdrant indexing
  - Multi-tenancy
  - Qdrant
---
# Why You Shouldn’t Create One Qdrant Collection per User

It is tempting to isolate each user when building AI and search-driven applications. Separating each collection per user will lead to more straightforward logic and query separation. But the catch is that each Qdrant collection carries its indexes, metadata, and runtime structures. This internal overhead can cause your application to fall apart when you scale it to thousands of users. 

This blog will explore why one collection per user is a scalability trap and provide a better alternative, multi-tenancy with payload indexing. 

## What Happens When You Create One Collection per User

You might be tempted to create one collection per user for the following reasons: 

* Recreating and dropping the collections independently.   
* No need to worry about complex filtering logic during queries.   
* You may not need payloads or per-user conditions. 

This might work for a few users, but scaling is a nightmare. Under the hood, each collection spins up its own instance of Qdrant’s internal data structures, including the HSNW graph, payload index, quantization layers, and vector storage. As a result, memory usage on your cluster spikes, and queries become slow, leading to huge cracks in your infrastructure. 

## Understanding the Overhead

To understand why one collection per user doesn’t scale, you must look at how Qdrant works behind the scenes. Each Qdrant collection you create will have the following systems: 

* An **HNSW vector index** with neighbor graphs that require memory to operate optimally.   
* A dedicated **payload index** for mapping metadata to points for fast filtering.   
* WAL logs, separate storage files, and checkpoints on disk. 

Think of each collection as a self-contained vector search engine. Therefore, the cost of spinning up 1,000 tiny engines can add up real quick. These numerous collections lead to:

* **Memory** **growing** linearly for each collection.  
* **Disk I/O** becomes fragmented as the engine handles thousands of WALs and checkpoints.  
* **Increased startup time** as all the collections must share the same limited memory at boot time.   
* **Query throughput** drops as a result of numerous concurrent queries. 


Due to these limitations, we recommend employing multitenancy via payloads.

## Multitenancy Done Right

Instead of creating separate collections for each user, Qdrant recommends creating a single collection and separate access using payloads. Each Qdrant point can have a payload as metadata. For multitenancy, you can include a \`user\_id\` or \`tenant\_id\` for each point. 

{

  "id": "vec\_812",

  "vector": \[ ... \],

  "payload": {

    "user\_id": "1234",

    "doc\_type": "medical\_summary"

  }

}

Here is an example of a filter:

{

  "filter": {

    "must": \[

      {

        "key": "user\_id",

        "match": { "value": "1234" }

      }

    \]

  },

  "top": 10,

  "vector": \[ ... \]

}

Using the above structure, you can store all your points in a single collection and filter them using the payload values. 

Compared to creating a collection for each user, this approach is beneficial because: 

* It can scale to millions of vectors across thousands of users.   
* Minimal startup time since there is only one collection to load.   
* Low memory footprint since there is no index duplication.  
* The code is easier to maintain because you have one schema, endpoint, and query format.   
* Easier to add new filters later on. 

## Conclusion

Choosing the right collection strategy upfront is all about long-term maintainability and scalability. Using one collection per user at the beginning may work, but it can wreak havoc when you attempt to scale that system. In conclusion, we have learned that: 

* Each collection you create adds nontrivial overhead related to startup time, memory, and disk usage.   
* Performance declines drastically as the number of collections increases.   
* Multitenancy via payload filtering solves the problem of a single collection per user, scalably. 

Qdrant was built with multitenancy in mind. Storing vectors in a single collection with filtering leads to better isolation and performance without the headache of managing multiple collections. Create a free [Qdrant Cloud](https://qdrant.tech/cloud/) account and try multitenancy for your next project.   
