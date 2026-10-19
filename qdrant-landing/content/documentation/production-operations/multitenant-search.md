---
title: "How to Implement Multitenancy and Custom Sharding in Qdrant"
short_description: "Explore how Qdrant's multitenancy and custom sharding streamline machine-learning operations, enhancing scalability and data security."
description: "Discover how multitenancy and custom sharding in Qdrant can streamline your machine-learning operations. Learn how to scale efficiently and manage data securely."
social_preview_image: /articles_data/multitenancy/preview/social_preview.jpg
preview_dir: /articles_data/multitenancy/preview
small_preview_image: /articles_data/multitenancy/icon.svg
weight: 60
author: David Myriel
date: 2024-02-06T13:21:00.000Z
draft: false
keywords:
  - multitenancy
  - custom sharding
  - multiple partitions
  - vector database
aliases:
  - /articles/multitenancy/
---

# Serve Many Customers from One Qdrant Deployment with Multitenancy and Custom Sharding

Once your application stores data for several customers, [multitenancy](/documentation/manage-data/multitenancy/) and [distributed deployment](/documentation/scaling/distributed_deployment/#sharding) become inevitable topics for the engineering team. The two solve different problems. Multitenancy answers one specific question: how do I serve many customers from shared infrastructure while keeping each customer's data separate? Distributed deployment is about how much data and traffic you have, not whose data it is.

Multitenancy matters whenever different users see different data. In a B2B application, each business partner needs its own separate environment, since each can have users of its own. In a consumer app like Google Drive, the tenant is a single user, whose files must stay separate from everyone else's. A public product catalog, where every visitor searches the same items, needs no multitenancy at all.

In Qdrant, multitenancy means keeping many tenants in one collection, with a payload field or a dedicated shard keeping their data apart. Qdrant supports three models for this: a tenant field that every query filters on, a shard per tenant through custom sharding, and tiered multitenancy, which combines the two. Custom sharding is where the two topics overlap: it is a distributed-deployment feature that also gives a tenant its own shard. A separate collection per tenant remains an option for a few tenants with different needs.

## Choose by Application Shape

Like most architecture decisions, multitenancy comes down to tradeoffs, and choosing a design requires both engineering and business knowledge of your application: how many customers you have, whether their contracts require dedicated infrastructure, and what isolation your pricing tiers promise. Three axes shape the design:

- Isolation level: how much tenants share, such as nodes, collections, and other resources, and therefore how far one tenant's load or one mistake can spread.
- Infrastructure cost: what you pay to run the deployment, in money on a managed service or in operations time when self-hosted.
- Enforcement effort: how much of the isolation your own code must enforce, for example by applying the tenant filter on every request.

No design wins on all three. The cheaper the infrastructure, the more tenants share, and in the cheapest design your own code has to enforce the boundary between them. 

{{< island path="content/documentation/headless/multitenancy/tradeoff-triangle" width="70%" ratio="4 / 3" title="Multitenancy architecture tradeoffs: isolation, infrastructure cost, and how much your own code has to enforce." >}}
![Tradeoff triangle](/docs/tradeoff-triangle.png)
{{< /island >}}

A few typical architectures show up in the market, forming two extremes:
1. Database-per-tenant: a pure infrastructure setup, clean from a software-engineering perspective, cloud-first, and very costly. Goes great for a service the size of Netflix with a microservice architecture, where each tenant has its own isolated server, also called a shared-nothing architecture. Backups and migrations are easy to control, with no code-level isolation constraints to verify or maintain. Goes well with Terraform setups, where the tenant is created, managed, and destroyed.
2. The other extreme is a monolithic setup, where every decision is routed through the codebase. Requires strong technical rigor to pull off at scale. However, on a smaller scale, a small maintenance team can actually be beneficial.

From general architecture to Qdrant specifically, each approach splits into the following gradient: 

| Approach                       | Isolation | Infrastructure cost | Setup effort                   | Ongoing enforcement in code |
| --------------------------------| -----------| ---------------------| --------------------------------| -----------------------------|
| Silo (cluster per tenant)      | Highest   | Highest             | High (provisioning per tenant) | Low                         |
| Bridge (collection per tenant) | Medium    | Medium              | Medium                         | Low (scoped keys)           |
| Pool (shared collection)       | Lowest    | Lowest              | Lowest                         | High (every request path)   |

Even though `pool` has the highest ongoing enforcement in the code, this guide focuses mostly on that case next, including how to handle it when the enforcement is gamed or not entirely clear, applying a use-case approach to each strategy to show the best mapping from each decision.

## Pick a Qdrant Model for the Pool

Once tenants share a collection, the next decision is engineering rather than business: how many tenants you have, and how evenly sized they are. Qdrant offers three models for a shared collection, and they form the same gradient on a smaller scale:

| Qdrant model                      | Fits                                                | Isolation                                                             | Infrastructure cost                          |
| -----------------------------------| -----------------------------------------------------| -----------------------------------------------------------------------| ----------------------------------------------|
| Payload field with a tenant index | Many tenants of similar, modest size                | Lowest: tenants share the same shards                                 | Lowest: no per-tenant shards                 |
| Tiered multitenancy               | Many small tenants plus a few large or growing ones | Mixed: small tenants share a fallback shard, large ones get their own | Grows with each promoted tenant              |
| Shard per tenant                  | A few large tenants that need their own resources   | Highest: each tenant has its own shard, which can sit on its own node | Highest: each shard key adds physical shards |

{{< island path="content/documentation/headless/multitenancy/model-picker" width="90%" ratio="8 / 7" title="Pick a multitenancy model for your tenant shape." >}}
![Model picker](/docs/model-picker.png)
{{< /island >}}

In all three, your code still enforces the boundary: every request carries the tenant filter, the shard key, or both. Each of these fails silently, with no error to warn you. A query missing the tenant filter does not return nothing, it returns every tenant's points, since similarity search always ranks the nearest vectors and has no concept of "no match." Retrieving a point by its ID ignores the tenant filter entirely, so a guessed or leaked ID returns that point regardless of who owns it; scope ID lookups with a `has_id` condition combined with the tenant filter, never `has_id` alone. An upsert that reuses another tenant's point ID overwrites it outright: tenant A's write to an ID already held by tenant B replaces B's point with no trace of the original. The same mistake recently showed up one layer up the stack: a semantic cache for LLM responses scoped tenants by embedding distance from a short namespace prefix instead of a hard filter, and users with similar enough questions received each other's cached answers. Treat the tenant field as a hard filter everywhere, including in anything you build on top of Qdrant, never as a similarity signal.

## Payload Field with a Tenant Index

Consider a blogging platform where every author also gets a personal subdomain: a visitor can search across the whole site at `blogplatform.com`, or search only one author's work at `authorname.blogplatform.com`. Both searches hit the same collection. The subdomain only tells your backend which author to filter by, and if the request came through `blogplatform.com` instead, that filter is simply absent. This is a natural fit for payload partitioning: one collection, the same code path, and a filter that is present or missing depending on which URL served the request.

The example here uses the [`fabiochiu/medium-articles`](https://huggingface.co/datasets/fabiochiu/medium-articles) dataset, which has two properties worth noting before setting it up:

- Articles can have more than one author. A co-authored article needs a point for each author, which the ID scheme below has to account for.
- The 85,119 authors are heavily skewed, not flat: 71% publish exactly one article, and the most active publish around a hundred. Still, no single author holds a meaningful share of the roughly 164,000 article-author pairs in the dataset. That shape, many tenants, uneven but with no dominant one, is exactly what this model is for. A platform with one customer far larger than the rest is a different case, covered later in this section.

Each (article, author) pair becomes its own point, so a co-authored article is stored once per author. Set this up by creating the collection as usual, then adding a keyword index on the author field with `is_tenant` set to `true`:

```python
from qdrant_client.models import KeywordIndexParams, KeywordIndexType

client.create_payload_index(
    collection_name=ARTICLES_COLLECTION,
    field_name='author_name',
    field_schema=KeywordIndexParams(type=KeywordIndexType.KEYWORD, is_tenant=True),
)
```

`is_tenant` tells Qdrant to store each author's points together on disk, which this section measures later. For now, upload points as you normally would, with one change: since the same article produces a separate point per author, each point needs its own ID rather than one derived from the article alone.

```python
from uuid import uuid5, NAMESPACE_URL

points = (
    PointStruct(
        id=str(uuid5(NAMESPACE_URL, f"{item['url']}:{author}")),
        vector=Document(text=item['text'], model="sentence-transformers/all-MiniLM-L6-v2"),
        payload={
            'text': item['text'],
            'title': item['title'],
            'url': item['url'],
            'author_name': author,
            'timestamp': item['timestamp'],
            'tags': item['tags'],
        },
    )
    for item in dataset
    for author in item['authors']
)
```

Deriving the ID from the article's URL and the author's name keeps every co-author's copy distinct. Reusing the article's row number instead would make the second author silently overwrite the first.

This setup needs no shards, no distributed mode, and no extra collections, so it is the lightest of the four models to run. It is not automatically fast: a tenant filter on an unindexed field costs 80 milliseconds or more on this dataset, against under one millisecond with the index in place. The rest of this section measures what that index buys you, and where it stops being enough.

Four results from a single run, 164,365 points, Qdrant Cloud, 2 vCPU, 6.9 GB RAM, change what this section can claim. The tenant index does its job when it exists from the start: filtered queries on a 10,000-point tenant come back in 1.81 ms with perfect recall. Skip it, and the same query costs 3.88 ms and returns only 5% of the right answers, because without an index to pre-filter by, Qdrant's graph traversal has to guess which of the matching points to surface. Adding the index after the data is already loaded fixes the speed, 0.83 ms, but not the recall, still 5%: the index now finds the tenant's points quickly, but the vector index itself was built without knowing tenants existed, and that gap does not close on its own. Setting `m` to `0` to skip the collection-wide graph did not noticeably speed up this one-time load, and it cut unfiltered-query recall to about a quarter.

| Setup | Setup time | Unfiltered query | 10,000-point tenant |
|---|---|---|---|
| Tenant index from the start | 307 s | 1.72 ms, recall 1.00 | 1.81 ms, recall 1.00 |
| No index | 175 s | 1.81 ms, recall 0.99 | 3.88 ms, recall 0.05 |
| Index added after loading | 175 s + 8 s | 1.79 ms, recall 0.99 | 0.83 ms, recall 0.05 |
| Per-tenant graphs (`m=0`) | 285 s | 1.51 ms, recall 0.24 | 1.48 ms, recall 1.00 |

{{< island path="content/documentation/headless/multitenancy/index-timing" width="90%" ratio="16 / 9" title="Filtered search latency and recall by tenant size, depending on when the tenant index was created." >}}
![Index timing](/docs/index-timing.png)
{{< /island >}}

{{< island path="content/documentation/headless/multitenancy/per-tenant-graphs" width="80%" ratio="16 / 9" title="Setup time and unfiltered-query recall, with and without per-tenant graphs (m=0)." >}}
![Per-tenant graphs](/docs/per-tenant-graphs.png)
{{< /island >}}

On disk, `is_tenant` won outright rather than trading one thing for another: it loaded faster than a plain keyword index, 203 s against 250 s, and served a 5,000-point tenant faster too, 1.79 ms against 3.25 ms, a smaller margin than Qdrant's own published 1.5-to-304 benchmark, which ran on a far more memory-constrained setup.

{{< island path="content/documentation/headless/multitenancy/disk-locality" width="90%" ratio="16 / 9" title="On-disk filtered search latency: a plain keyword index against Qdrant's tenant index." >}}
![Disk locality](/docs/disk-locality.png)
{{< /island >}}

The lesson for an author who co-writes an article: create the tenant index before the first point lands. If a collection already has data when you decide to add one, plan to reindex rather than trust that adding the field alone restores full search quality.

A separate question sits underneath that one: when an article belongs to several tenants, is a separate point per tenant the only option? A follow-up experiment tenanted articles on both their authors and the publication they appeared in, which covers 58% of articles, and tested the alternative directly: one point per article, with a list of tenants, instead of one point per tenant. Recall held at 1.00 across every category, author, a small publication, a large publication, and articles shared between an author and a publication, and the list-valued layout needed 161,413 points against 257,726 for the duplicated version of the same two-field scheme, about 60% fewer. The cost showed up in exactly one place: a large publication's p95 latency was 2.36 ms against 1.63 ms for the duplicated layout, since a point can sit next to only one of its tenants on disk, not all of them. Duplication stays the simpler default; a list-valued tenant field earns its place once storage or write cost from many overlapping tenants becomes the bigger problem.

Three more results mark when this design stops being enough on its own. A tenant holding 90% of the collection does not hurt a small tenant's own queries while nothing else is happening, 0.52 ms either way, but the dominant tenant's own recall drifts down to 0.985 at that size, the first sign of one collection serving a customer far larger than the rest. Loading a new 100,000-point tenant alongside everyone else moved query latency by very different amounts on two separate runs under the same setup, p95 rose from 0.78 to 0.95 ms in one and from 0.74 to 6.84 ms in the other; treat that spread itself as the finding, a shared collection's noisy-neighbor cost is not a fixed number. Removing a tenant by filter costs the most while the delete call is in flight: on just two to four probes caught during the call itself, not enough to call a precise number, latency spiked as high as 108 ms removing a small tenant and 198 ms removing a large one, settling back toward baseline well within the following cleanup pass, 48 seconds for the larger removal. None of these rule out the payload model; they are the signals that tell you which tenant has outgrown it.

## Shard per Tenant

Give a tenant its own shard once it is large or busy enough that sharing a collection works against it: a customer whose write volume would otherwise compete with smaller tenants for the same segments, or one whose data needs to disappear in a single operation rather than a slow filtered delete.

Create the collection with custom sharding, then create a shard key for the tenant:

```python
from qdrant_client.models import VectorParams, Distance, ShardingMethod

client.create_collection(
    collection_name=ARTICLES_COLLECTION,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    shard_number=1,
    sharding_method=ShardingMethod.CUSTOM,
)
client.create_shard_key(ARTICLES_COLLECTION, "{tenant_id}")
```

Every write and query for that tenant then carries `shard_key_selector="{tenant_id}"`. The sharding method cannot be changed after the collection exists, so decide upfront if any tenant might need this later.

On the single-node cluster this was measured on, isolating a dominant tenant onto its own shard helped the tenant itself more than its neighbors. The dominant tenant's own recall rose from 0.985 to 0.997 with only a marginal latency change; a mid-sized tenant's queries got faster too, 1.71 ms down to 1.18 ms, but at a real cost, its own recall slipped from 0.999 to 0.981. The small tenant this isolation was meant to protect barely moved, 0.52 ms against 0.55 ms: on one node, a dedicated shard still shares the node's CPU, RAM, and disk with everyone else, and the isolation this model promises needs a second node to actually show up. Loading a new 100,000-point tenant into its own shard, rather than the shared collection, left the other tenants' p95 essentially flat, 0.69 to 0.73 ms, a cleaner result than the shared collection managed on either of its two runs. Removing a tenant is cheaper this way too: dropping its shard key costs a fraction of a second, with query latency for everyone else pinned near baseline throughout, though that specific measurement rests on very few probes, not enough to rule out a larger spike happening between them.

One correctness problem does not go away just because every tenant has its own shard: an article shared between two tenants, stored as one point with a list-valued tenant field, is reachable through only one shard, whichever one the point was written to. With every author on their own shard, only 245 of 482 expected tenant-article memberships remained visible, since co-authors routing to a different shard than the point itself simply cannot reach it. Duplicate the point per tenant if sharing is possible at all; the list-valued design that worked in the payload model does not survive sharding.

Qdrant's own guidance caps a cluster at around 1,000 dedicated shards, the same order of magnitude as the collection-per-tenant limit this guide opens with. With 85,119 real authors in this dataset, giving every one of them a shard is not an option regardless of performance; that ceiling, a documented recommendation rather than a measured one, is what tiered multitenancy exists to get around.

## Tiered Multitenancy

Tiered multitenancy keeps the pool model's low cost for most tenants while giving the few that outgrow it their own shard, without the application needing to know which case it is talking to: every request names a `target` shard key, the tenant, and a `fallback` key, the shared shard everyone starts in, and Qdrant routes to whichever one actually exists.

```python
from qdrant_client.models import ShardKeyWithFallback

client.query_points(
    collection_name=ARTICLES_COLLECTION,
    query=query_vector,
    query_filter=tenant_filter,
    shard_key_selector=ShardKeyWithFallback(target="{tenant_id}", fallback="default"),
    limit=10,
)
```

Promoting a tenant out of the fallback shard moves its points with `replicate_points` rather than a fresh upload. Copying 98,619 points took 10 seconds, with neighboring tenants' p95 latency rising to about 32 ms while the copy ran. The cleanup that follows, deleting the promoted tenant's points from the fallback shard, took roughly two minutes and produced one latency spike of 25 ms. Writes made to the promoted tenant's data during the copy itself are not lost: every one of 100 test writes, made both before the copy started and while it was in progress, was present and visible once the promotion finished.

The same correctness problem from the shard-per-tenant model shows up here too, in a narrower and easier-to-miss form. An article shared between two authors, stored as one point with a list-valued tenant field, survives the copy step: both authors can still see it while the point briefly exists in both shards. It disappears for the un-promoted co-author the moment the promoted copy is deleted from the fallback shard. For the twenty un-promoted co-authors in one test, only 3 of their 240 expected memberships remained visible after that step, against 242 of 242 for the twenty who were promoted. Duplicating the point per tenant is the only layout that survives promotion intact.

Qdrant's own guidance puts the point to promote a tenant at around 20,000 points, and recommends staying under roughly 1,000 dedicated shards per cluster, the same ceiling as the shard-per-tenant model; neither of those numbers was tested directly here, they are the vendor's own recommendation, not a measured threshold. When a tenant needs something tiered multitenancy cannot give it, a different embedding model, a different collection configuration, or isolation enforced by Qdrant itself rather than your own code, it needs a collection of its own instead, not a shard within this one.

<!-- 



## Collection per Tenant

-->

## Check Your Choice

Every number in this guide came from one dataset and one cluster size. Before committing to a model, run the same checks against your own data: load a representative slice onto a staging collection, at your actual tenant-size distribution rather than only the largest or average tenant, and measure filtered-query latency and recall with the tenant index in place and without it. Confirm the two failure modes this guide flags are not silently present in your own code: a query missing the tenant filter returns every tenant's points rather than an error, and an upsert that reuses another tenant's point ID overwrites it without warning. None of this needs a separate tool: the same `qdrant-client` calls used throughout this guide, pointed at a staging collection loaded with your own data, are enough to replace these measured numbers with your own.

## Adjacent Work

This guide covers the mechanics of sharing a cluster between tenants; the underlying features it builds on have their own documentation. [Multitenancy](/documentation/manage-data/multitenancy/) covers the `is_tenant` payload index itself, and [distributed deployment](/documentation/scaling/distributed_deployment/#sharding) covers sharding beyond the tenant-isolation use case this guide focuses on, including shard replication and placement. For managing clusters, collections, and shard keys without scripting the API directly, the [Qdrant Cloud Dashboard](https://cloud.qdrant.io) exposes the same operations through a UI.