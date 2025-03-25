---
title: "Qdrant 1.14 - Reranking Support, More Resource Optimizations & Cost Tracking"
draft: false
short_description: "Qdrant 1.14 adds Score-Boosting Reranker for custom search ranking and improved performance optimizations."
description: "Qdrant 1.14 introduces Score-Boosting Reranker for custom search ranking, improved resource utilization, and detailed cost tracking." 
preview_image: /blog/qdrant-1.14.x/social_preview.png
social_preview_image: /blog/qdrant-1.14.x/social_preview.png
date: 2025-03-25T00:00:00-08:00
author: David Myriel
featured: true
tags:
  - vector search
  - vector database
  - semantic search
  - release notes
  - performance optimization
  - reranking
  - search engine
  - database
  - AI
  - machine learning
---

[**Qdrant 1.14.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.14.0) Let's look at the main features for this version:

**Score-Boosting Reranker:** Blend vector similarity with custom rules and context.</br>
**Improved Resource Utilization:** CPU and disk IO optimization for faster processing.</br>

**Memory Optimization:** Reduced usage for large datasets with improved ID tracking.</br>
**RocksDB to Gridstore:** Additional reliance on our custom key-value store. </br>
**IO Measurements:** Detailed cost tracking for deployment performance analysis.</br>

## Score-Boosting Reranker
![reranking](/blog/qdrant-1.14.x/reranking.jpg)

When integrating vector search into specific applications, you might want to tweak the final result list using domain or business logic. For example, if you are building a **chatbot or search on website content**, you might want to rank results with `title` metadata higher than `body_text` in your results. 

In **e-commerce** you may want to boost products from a specific manufacturer—perhaps because you have a promotion or need to clear inventory. With this update, you can easily influence ranking using metadata like `brand` or `stock_status`.

> The **Score-Boosting Reranker** allows you to combine vector-based similarity with **business or domain-specific logic** by applying a **rescoring step** on top of the standard semantic or distance-based ranking.

As you structure the query, you can define a `formula` that references both existing scores (like cosine similarities) and additional payload data (e.g., timestamps, location info, numeric attributes). Let's take a look at some examples:

### Idea 1: Prioritizing Website Content

Let's say you are trying to improve the search feature for a documentation site, such as our [**Developer Portal**](https://qdrant.tech/documentation/). You would chunk and vectorize all your documentation and store it in a Qdrant collection.

**Figure 1:** Any time someone types in **hybrid queries**, you want to show them the most relevant result at the top.
![reranking](/blog/qdrant-1.14.x/website-search.png)

**Reranking** can help you prioritize the best results based on user intent.

Your website collection can have vectors for **titles**, **paragraphs**, and **code snippet** sections of your documentation. You can create a `tag` payload field that indicates whether a point is a title, paragraph, or snippet. Then, to give more weight to titles and paragraphs, you might do something like:

```
score = score + (is_title * 0.5) + (is_paragraph * 0.25)
```

**Above is just sample logic - but here is the actual Qdrant API request:**

```bash
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.2, 0.8, ...],   // <-- dense vector for the query
        "limit": 50
    },
    "query": {
        "formula": {
            "sum": [
                "$score",
                {
                    "mult": [
                        0.5,
                        { "key": "tag", "match": { "any": ["h1","h2","h3","h4"] } }
                    ]
                },
                {
                    "mult": [
                        0.25,
                        { "key": "tag", "match": { "any": ["p","li"] } }
                    ]
                }
            ]
        }
    }
}
```

### Idea 2: Reranking Most Recent Results

One of the most important advancements is the ability to prioritize recency. In many scenarios, such as in news or job listings, users want to see the most recent results first. Until now, this wasn’t possible without additional work: *you had to fetch all the data and manually filter for the latest entries on their side*.

Now, the similarity score **doesn’t have to rely solely on cosine distance**. It can also take into account how recent the data is, allowing for much more dynamic and context-aware ranking. 

> With the Score-Boosting Reranker, simply add a `date` payload field and factor it into your formula so fresher data rises to the top.

**Example Query**:

```bash
POST /collections/{collection_name}/points/query
{
  "prefetch": { ... },
  "query": {
    "formula": {
      "sum": [
        "$score",
        {
          "gauss_decay":
            "target": { "datetime": <todays date> },
            "x": { "datetime_key": <payload key> },
            "scale": <1 week in seconds>
        }
      ]
    }
  }
}
```

### Idea 3: Factor in Geographical Proximity

Let’s say you’re searching for a restaurant serving Currywurst. Sure, Berlin has some of the best, but you probably don’t want to spend two days traveling for a sausage covered in magical seasoning. The best match is the one that **balances the distance with a real-world geographical distance**. You want your users see relevant and conveniently located options.

This feature introduces a multi-objective optimization: combining semantic similarity with geographical proximity. Suppose each point has a `geo.location` payload field (latitude, longitude). You can use a `gauss_decay` function to clamp the distance into a 0–1 range and add that to your similarity score:

```
score = $score + gauss_decay(distance)
```

**Example Query**:

```bash
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.2, 0.8, ...],
        "limit": 50
    },
    "query": {
        "formula": {
            "sum": [
                "$score",
                {
                    "gauss_decay": {
                        "scale": 5000,               // e.g. 5 km
                        "x": {
                            "geo_distance": {
                                "origin": { "lat": 52.504043, "lon": 13.393236 }, // Berlin
                                "to": "geo.location"
                            }
                        }
                    }
                }
            ]
        },
        "defaults": {
            "geo.location": { "lat": 48.137154, "lon": 11.576124 } // Munich
        }
    }
}
```

You can tweak parameters like target, scale, and midpoint to shape how quickly the score decays over distance. This is extremely useful for local search scenarios, where location is a major factor but not the only factor.

> This is a very powerful feature that allows for extensive customization. Read more about this feature in the [**Hybrid Queries Documentation**](/documentation/concepts/hybrid-queries/)

## Improved Resource Use During Segment Optimization
![optimizations](/blog/qdrant-1.14.x/optimizations.jpg)

Qdrant now **saturates CPU and disk IO** more effectively in parallel when optimizing segments. This helps reduce the "sawtooth" usage pattern—where CPU or disk often sat idle while waiting on the other resource.

This leads to **faster optimizations**, which are specially noticeable on large machines handling big data movement.
It also gives you **predictable performance**, as there are fewer sudden spikes or slowdowns during indexing and merging operations.

**Figure 2:** Indexing 400 million vectors - CPU and disk usage profiles. Previous Qdrant version on the left, new Qdrant version on the right.
![indexation-improvement](/blog/qdrant-1.14.x/indexation.png)

**Observed Results:** The new version on the right clearly shows much better CPU saturation across the full process. The improvement is especially noticeable during large-scale indexing. 

In our experiment, **we indexed 400 million 512-dimensional vectors**. The previous version of Qdrant took around 40 hours on an 8-core machine, while the new version with this change completed the task in just 28 hours.

> **Tutorial:** If you want to work with a large number of vectors, we can show you how. [**Learn how to upload and search large collections efficiently.**](/documentation/database-tutorials/large-scale-search/)

### Minor Fixes & Optimizations
![reranking](/blog/qdrant-1.14.x/gridstore.jpg)

#### Ending our Reliance on RocksDB

RocksDB has been removed from the **mutable ID tracker** and all **immutable payload indices**, which are both internal components of Qdrant. In practical terms, this means: less RocksDB, faster internals.

Even though RocksDB is great for general-purpose use cases, it hasn’t been an ideal fit for Qdrant. The two biggest issues are: **1) the lack of control over the files it creates** and **2) unpredictable timing of data compaction**.

These limitations can lead to issues like latency spikes that are difficult to diagnose or mitigate. Our long-term goal is to fully eliminate RocksDB to gain complete control over Qdrant’s performance and storage behavior. **That’s also why we built GridStore**—a key-value engine designed specifically for our needs.

> The last remaining use of RocksDB is within **mutable payload indices**, and that too will be removed in a future release, fully cutting the dependency.

![reranking](/blog/qdrant-1.14.x/gridstore.png)

*Read more about how we built [**Gridstore, our custom key-value store**](/articles/gridstore-key-value-storage/).*

#### Optimized Memory Usage in Immutable Segments

We revamped how the ID tracker and related metadata structures store data in memory. This can result in a notable RAM reduction for very large datasets (hundreds of millions of vectors).

This causes **much lower overhead**, where memory savings let you store more vectors on the same hardware. Also, improved scalability is a major benefit. If your workload was near the RAM limit, this might let you push further **without using additional servers**.

#### I/O Measurements for Serverless Deployments

Qdrant 1.14 introduces detailed tracking of **read/write costs** (CPU, disk, etc.) per operation. This is primarily intended for serverless billing, but also helpsyou diagnose performance hotspots in dedicated setups.

> Now you can have **full cost visibility**, and you can understand exactly which queries or updates cause the most overhead.

This also makes for easier optimization - you can tweak indexes, partitioning, or formula queries to reduce resource usage based on concrete metrics.

## Upgrading to Version 1.14

With Qdrant 1.14, all client libraries remain fully compatible. If you do not need custom payload-based ranking, **your existing workflows remain unchanged**.

> **Upgrading from earlier versions is straightforward** — no major API or index-breaking changes. 

In **Qdrant Cloud**, simply go to your **Cluster Details** screen and select **Version 1.14** from the dropdown. The upgrade may take a few moments. 

**Figure 3:** Updating to the latest software version from Qdrant Cloud dashboard.
![reranking](/blog/qdrant-1.14.x/upgrade.png)

**Documentation:** For a full list of formula expressions, conditions, decay functions, and usage examples, see the official [**Qdrant documentation**](https://qdrant.tech/documentation) and the [**API reference**](https://api.qdrant.tech/). This includes detailed code snippets for popular languages and a variety of advanced reranking examples.

#### Join the Discussion!

**We'd love to hear your feedback:** If you have questions or want to share your experience, join our [**Discord**](https://qdrant.to/join-slack) or open an issue on [**GitHub**](https://github.com/qdrant/qdrant/issues).

![community](/blog/qdrant-1.14.x/community.jpg)