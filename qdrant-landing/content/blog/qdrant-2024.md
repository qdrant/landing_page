---
title: "Qdrant 2024: A Year in Review"
draft: false
short_description: "Reflecting on a transformative year of innovation, growth, and community at Qdrant."
description: "Discover the milestones and advancements that defined Qdrant’s journey this year, from cutting-edge features to community-driven initiatives."
preview_image: /blog/qdrant-2024/social_preview.png
social_preview_image: /blog/qdrant-2024/social_preview.png
date: 2024-12-22T00:00:00-08:00
author: David Myriel
featured: true
tags:
  - Qdrant
  - vector search
  - community growth
  - hybrid search
  - data indexing
  - developer tools
  - artificial intelligence
  - machine learning
---

# A Year in Review

It’s been an exciting year, filled with growth, innovation, and a lot of hard work. From launching cutting-edge features to expanding our community and building stronger relationships with our users, this year has been nothing short of transformative. 

Qdrant solidified its position as a leading vector database solution, empowering developers to build sophisticated AI and machine learning applications. 

---

## Cutting-Edge Features

![qdrant-2022-0](/blog/qdrant-2024/qdrant-2024-0.jpg) 

### Unified Search Interface

**Hybrid Search**: The seamless integration of sparse and dense embeddings to enable more flexible, context-aware search capabilities.

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { 
                "indices": [1, 42],    // <┐
                "values": [0.22, 0.8]  // <┴─sparse vector
             },
            "using": "sparse",
            "limit": 20
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "using": "dense",
            "limit": 20
        }
    ],
    "query": { "fusion": "rrf" }, // <--- reciprocal rank fusion
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=models.SparseVector(indices=[1, 42], values=[0.22, 0.8]),
            using="sparse",
            limit=20,
        ),
        models.Prefetch(
            query=[0.01, 0.45, 0.67],
            using="dense",
            limit=20,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                values: [0.22, 0.8],
                indices: [1, 42],
            },
            using: 'sparse',
            limit: 20,
        },
        {
            query: [0.01, 0.45, 0.67],
            using: 'dense',
            limit: 20,
        },
    ],
    query: {
        fusion: 'rrf',
    },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest([(1, 0.22), (42, 0.8)].as_slice()))
            .using("sparse")
            .limit(20u64)
        )
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .using("dense")
            .limit(20u64)
        )
        .query(Query::new_fusion(Fusion::Rrf))
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import java.util.List;

import static io.qdrant.client.QueryFactory.fusion;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
    QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
    .addPrefetch(PrefetchQuery.newBuilder()
      .setQuery(nearest(List.of(0.22f, 0.8f), List.of(1, 42)))
      .setUsing("sparse")
      .setLimit(20)
      .build())
    .addPrefetch(PrefetchQuery.newBuilder()
      .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f)))
      .setUsing("dense")
      .setLimit(20)
      .build())
    .setQuery(fusion(Fusion.RRF))
    .build())
  .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List < PrefetchQuery > {
    new() {
      Query = new(float, uint)[] {
          (0.22f, 1), (0.8f, 42),
        },
        Using = "sparse",
        Limit = 20
    },
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Using = "dense",
        Limit = 20
    }
  },
  query: Fusion.Rrf
);
```

### Resource Optimizations

- **On-Disk Indexing**: Efficient handling of massive datasets by minimizing memory overhead without sacrificing performance.


### Visual Interface

- **Facet Counts and Aggregations**: Making it easier for users to analyze and interpret data within vector search results.


This year, we made incredible strides in improving what Qdrant offers to developers. Hybrid Search became a standout feature, blending sparse and dense embeddings to create searches that are not just smarter but more context-aware. We also introduced on-disk indexing options, like text, geo, and payload indices, which let users handle massive datasets without breaking a sweat (or their memory limits).  

Facet Counting and Distance Matrix APIs turned out to be game-changers for users needing better tools for analysis and visualization. They make it easier to dig deep into data and extract meaningful insights. On top of that, UUID support and Uint8-based quantization improved how users store and manage data, making Qdrant faster and more efficient than ever. 

## Data Exploration 

Our Web UI received a huge facelift this year. We wanted to make working with Qdrant even more intuitive, and that’s exactly what we did. Now, users can visualize their vector spaces, evaluate search quality, and even explore graph relationships between vectors—all without needing to write code. It’s all about empowering users to see the magic happening under the hood.  

<iframe width="560" height="315" src="https://www.youtube.com/embed/OzTHZ0SIulg?si=yRzbgKIhwqnglawD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## RAG & Agents

![qdrant-2022-1](/blog/qdrant-2024/qdrant-2024-1.jpg)

Beyond the core features, we delved into areas that are reshaping how AI interacts with data. Experimenting with sparse neural retrievers was a big focus for us, as was mimicking late interaction with any embedding model. We also pushed boundaries with tools like the Semantic Cache, making repeated searches lightning-fast while reducing compute costs.  

Agentic Retrieval-Augmented Generation (RAG) became a cornerstone of our experimentation. Combining Qdrant with RAG created systems capable of dynamic, context-aware decisions, and we were thrilled to share this through our RAG Evaluation Guide, which quickly became a favorite among developers looking to get more out of their systems.  

<iframe width="560" height="315" src="https://www.youtube.com/embed/_BQTnXpuH-E?si=LJ1WmRYEEP7rCoYm" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## Big Wins for Enterprise Users

![qdrant-2022-2](/blog/qdrant-2024/qdrant-2024-2.jpg)

It was a big year for Qdrant on the enterprise front, too. We achieved SOC2 Type 2 compliance, ensuring the highest standards for security and operational reliability. And our Hybrid Cloud Product Release gave enterprise users the flexibility they need to deploy Qdrant in whatever way works best for them.  

<iframe width="560" height="315" src="https://www.youtube.com/embed/BF02jULGCfo?si=jdrBImfY-tWDtM5t" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Qdrant’s adoption in enterprise environments has skyrocketed. Companies managing terabytes of data have turned to Qdrant for reliable, scalable, and efficient vector search.

One notable project we engaged with this year was **Quiszard.ai**, which is replacing traditional search systems with Qdrant to manage over 100 million documents and several terabytes of data. Collaborations like these push the boundaries of what vector search can achieve in enterprise settings.

---

## Community Work

One of the highlights of the year was seeing how much the Qdrant community has grown. Over 30,000 developers are now building amazing things with Qdrant, and their creativity inspires us every day. We launched the Qdrant Startup Program to help early-stage companies get the tools they need to succeed, and the Qdrant Stars Program to celebrate the contributors who’ve gone above and beyond.  

We also rolled out our new Developer Portal, which became a one-stop shop for tutorials, documentation, and everything a developer could need to get started with Qdrant.  

Our mission to make Qdrant accessible and easy to use has driven our commitment to education. This year, we:

- Launched comprehensive tutorials, including guides on **multitenancy**, **indexing for video**, and **quantization**.
- Published insightful articles, such as *"Why I'm Using pgvector (as a Qdrant Employee)"* and *"What is Semantic Search?"*.
- Hosted workshops, like our talk at **MLOps LA x Google Meetup**, where we showcased Qdrant’s vector visualization tools.

These efforts ensure developers, data scientists, and researchers can get started with Qdrant quickly and effectively.

The Qdrant community has grown exponentially this year. We now proudly support over **30,000 developers** worldwide. Through meetups, webinars, and forums, we’ve seen incredible projects come to life, from environmental monitoring tools to enterprise-grade search systems.

This year also marked the introduction of the **Distinguished Qdrant Ambassador Program**, which recognizes and supports developers making significant contributions to the Qdrant ecosystem. A special shoutout to **Pavan**, our first official ambassador, whose work has inspired many.

---

## The Year That Propelled Us Forward

![qdrant-2022-2](/blog/qdrant-2024/qdrant-2024-2.jpg)

Perhaps the biggest milestone was announcing our Series A funding. This marked a new chapter for Qdrant, giving us the resources to take everything we’re building to the next level. From the improved Query API to multivector support, this funding has allowed us to double down on what matters most to our users.  

The next year is shaping up to be even more exciting. We’re continuing our work on sparse neural retrievers, late interaction techniques, and optimizing systems like ColPali for even better performance. And we’ll keep pushing the envelope with innovations in hybrid search, semantic caching, and advanced indexing.  

As we move into the new year, our vision remains steadfast: to make Qdrant the go-to vector database for developers building intelligent applications. We’re focusing on:

- Expanding **Qdrant Cloud** capabilities, ensuring a seamless and scalable experience for users.
- Enhancing **vector storage solutions** for privacy-conscious AI systems, a growing need in industries like healthcare and finance.
- Growing our community even further through partnerships, events, and open-source contributions.

---

## Thank You for an Amazing Year

![qdrant-2022-3](/blog/qdrant-2024/qdrant-2024-3.jpg)

None of this would have been possible without you—our community, our partners, and our team. Your feedback, questions, and creativity have driven everything we’ve accomplished this year.  

None of this would have been possible without you—our community, partners, and contributors. Your feedback, questions, and innovations inspire us every day.

Here’s to another year of innovation, growth, and building the future of vector search together. We can’t wait to see what you create with Qdrant in the year ahead! 


As we close the year, we want to thank you for being part of the Qdrant journey. Here’s to another year of growth, innovation, and success together!

---
*Stay connected with Qdrant by joining our [community forum](#), following us on [GitHub](#), and subscribing to our [newsletter](#). Let’s build the future of vector search, together!*