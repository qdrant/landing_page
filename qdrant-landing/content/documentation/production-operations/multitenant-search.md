---
title: "How to Implement Multitenancy and Custom Sharding in Qdrant"
short_description: "Choose and implement the right Qdrant multitenancy model for your tenant shape, backed by measured benchmarks."
description: "How to choose between Qdrant's multitenancy models, payload field with a tenant index, shard per tenant, and tiered multitenancy, and implement the one that fits your tenant shape, backed by measured benchmarks."
social_preview_image: /articles_data/multitenancy/preview/social_preview.jpg
preview_dir: /articles_data/multitenancy/preview
small_preview_image: /articles_data/multitenancy/icon.svg
weight: 60
author: Andrei Cristea and David Myriel
author_link: https://www.linkedin.com/in/andrei-cristea-it/
date: 2026-10-19T10:00:00+02:00
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

In Qdrant, multitenancy means keeping many tenants in one collection, with a payload field or a dedicated shard keeping their data apart. Qdrant supports three models for this: a tenant field that every query filters on, a shard per tenant through custom sharding, and tiered multitenancy, which combines the two. Custom sharding is where the two topics overlap: it is a distributed-deployment feature that also gives a tenant its own shard.

This guide starts from the payload model, the one built for many small tenants, and treats the other two as the way out when a tenant outgrows it. Every number in it comes from experiments on one dataset and one small cluster, described in [How We Measured](#how-we-measured).

## Choose by Application Shape

Like most architecture decisions, multitenancy comes down to tradeoffs, and choosing a design requires both engineering and business knowledge of your application: how many customers you have, whether their contracts require dedicated infrastructure, and what isolation your pricing tiers promise. Three axes shape the design:

- Isolation level: how much tenants share, such as nodes, collections, and other resources, and therefore how far one tenant's load or one mistake can spread.
- Infrastructure cost: what you pay to run the deployment, in money on a managed service or in operations time when self-hosted.
- Enforcement effort: how much of the isolation your own code must enforce, for example by applying the tenant filter on every request.

No design wins on all three. The cheaper the infrastructure, the more tenants share, and in the cheapest design your own code has to enforce the boundary between them.

Real architectures sit on a gradient between two extremes. At one end, every tenant gets its own database: a shared-nothing setup with easy backups, migrations, and Terraform-managed tenant lifecycles, and no isolation rules in code, at the highest running cost. At the other end, everything shares one deployment and your codebase routes every decision, which takes rigor at scale but suits a small team. In Qdrant terms, the gradient runs from Silo (a cluster per tenant) through Bridge (a collection per tenant) to Pool (one shared collection).

{{< island path="content/documentation/headless/multitenancy/tradeoff-triangle" ratio="960 / 620" >}}
![Isolation and infrastructure cost fall from Silo to Bridge to Pool, while the enforcement your code carries rises at Pool](/docs/tradeoff-triangle.png)
{{< /island >}}

Four questions from [The Tao of Qdrant Multi-Tenancy](https://medium.com/qdrant/the-tao-of-qdrant-multi-tenancy-162c71f830fb) settle most of the choice before any measurement:

- **Models:** if tenants bring their own embedding models or collection settings, each needs a collection of its own, and a Qdrant Cloud cluster allows 1,000 collections by default.
- **Location:** if a tenant's data must stay in a region, it needs shards or a cluster on nodes in that region.
- **Scale:** if one tenant holds a disproportionate share of the data, plan for the escalations this guide covers.
- **Isolation:** if logical separation is enough, tenants can share a collection; physical separation means a dedicated shard on its own node, or a cluster of its own.

## Pick a Qdrant Model for the Pool

Once tenants share a collection, the next decision is engineering rather than business: how many tenants you have, and how evenly sized they are. Qdrant offers three models for a shared collection, and they form the same gradient on a smaller scale:

| Qdrant model                      | Fits                                                | Isolation                                                             | Infrastructure cost                          |
| -----------------------------------| -----------------------------------------------------| -----------------------------------------------------------------------| ----------------------------------------------|
| Payload field with a tenant index | Many tenants of similar, modest size                | Lowest: tenants share the same shards                                 | Lowest: no per-tenant shards                 |
| Tiered multitenancy               | Many small tenants plus a few large or growing ones | Mixed: small tenants share a fallback shard, large ones get their own | Grows with each promoted tenant              |
| Shard per tenant                  | A few large tenants that need their own resources   | Highest: each tenant has its own shard, which can sit on its own node | Highest: each shard key adds physical shards |

{{< island path="content/documentation/headless/multitenancy/model-picker" ratio="960 / 680" >}}
![Decision map: a payload field for many similar tenants, tiered multitenancy when a few are big, a shard for one dominant tenant, and a collection per tenant for a handful of tenants or different configurations](/docs/model-picker.png)
{{< /island >}}

Start with the payload model.

## Payload Field with a Tenant Index

### Set It Up

Consider a blogging platform where every author also gets a personal subdomain: a visitor can search across the whole site at `blogplatform.com`, or search only one author's work at `authorname.blogplatform.com`. Both searches hit the same collection. The subdomain only tells your backend which author to filter by, and if the request came through `blogplatform.com` instead, that filter is simply absent. This is a natural fit for payload partitioning: one collection, the same code path, and a filter that is present or missing depending on which URL served the request.

The example here uses the [`fabiochiu/medium-articles`](https://huggingface.co/datasets/fabiochiu/medium-articles) dataset, which has two properties worth noting before setting it up:

- Articles can have more than one author, so a co-authored article needs a point per author.
- The 85,119 authors are heavily skewed, not flat: 71% publish exactly one article, and 95% publish five or fewer. Still, no single author holds a meaningful share of the roughly 164,000 article-author pairs in the dataset. That shape, many tenants, uneven but with no dominant one, is exactly what this model is for.

Set this up by creating the collection as usual, then adding a keyword index on the author field with `is_tenant` set to `true`:

```python
from qdrant_client.models import KeywordIndexParams, KeywordIndexType

client.create_payload_index(
    collection_name=ARTICLES_COLLECTION,
    field_name='author_name',
    field_schema=KeywordIndexParams(type=KeywordIndexType.KEYWORD, is_tenant=True),
)
```

`is_tenant` tells Qdrant to store each author's points together on disk. Upload points as you normally would, with one change: each (article, author) pair needs its own ID.

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

This setup needs no shards, no distributed mode, and no extra collections, so it is the lightest of the three models to run. It is not automatically fast: without the index, a tenant filter took more than 80 ms for tenants of up to 5,000 points, against 0.7 to 1.7 ms with it.

### Create the Index Before the Data

Two measurements recur from here on. Recall@10 is the share of a query's ten true nearest neighbors, found by exact search over the tenant's points, that the regular approximate search returned; 1.00 means nothing was missed. Latency is the median (p50) or 95th percentile (p95) over repeated queries.

The tenant index does its job when it exists from the start: filtered queries on a 10,000-point tenant come back in 1.81 ms with recall 1.00. Skip it, and the same query takes more than twice as long and returns only 5% of the right answers: Qdrant's HNSW graph only gains filter-aware edges for a field when a payload index for it already exists at indexing time, so without one, filtered search traverses a graph that is blind to tenant boundaries. Adding the index after the data is already loaded fixes the speed, since query planning can now estimate the filter's cardinality and retrieve by index directly, but not the recall: the graph itself still has no filter-aware edges for this field, and creating a payload index afterward does not add them.

On Qdrant Cloud, strict mode is on by default and rejects filters on unindexed fields, so the no-index case fails with an error there instead of slowing down; these runs turned strict mode off to measure its cost.

| Setup | Setup time | Unfiltered query | 10,000-point tenant |
|---|---|---|---|
| Tenant index from the start | 307 s | 1.72 ms, recall 1.00 | 1.81 ms, recall 1.00 |
| No index | 175 s | 1.81 ms, recall 0.99 | 3.88 ms, recall 0.05 |
| Index added after loading | 175 s + 8 s | 1.79 ms, recall 0.99 | 0.83 ms, recall 0.05 |
| Per-tenant graphs (`m=0`) | 285 s | 1.51 ms, recall 0.24 | 1.48 ms, recall 1.00 |

{{< island path="content/documentation/headless/multitenancy/index-timing" ratio="960 / 660" >}}
![Below about 6,500 points every setup scans exactly and keeps recall 1.00; above it, only the index created before loading kept full recall at 10,000 and 20,000 points](/docs/index-timing.png)
{{< /island >}}

The lesson for an author who co-writes an article: create the tenant index before the first point lands. If a collection already has data when you decide to add one, force Qdrant to rebuild the HNSW graph afterward, for example by bumping `hnsw_config.ef_construct` by one, which triggers the optimizer to re-index every segment, rather than trust that adding the field alone restores full search quality.

### Skip the Global Graph If Nothing Searches Across Tenants

The last row of the table uses a different setup: `m=0` disables the single global graph, and `payload_m` builds a separate, smaller graph per tenant instead. It barely shortened the one-time load, 285 s against 307 s, and filtered queries kept recall 1.00, but unfiltered recall fell to 0.24: with no single graph to search, Qdrant has to check every tenant's graph separately and merge the results. That rules it out for the blogging platform, whose site-wide search runs without a tenant filter.

{{< island path="content/documentation/headless/multitenancy/per-tenant-graphs" ratio="960 / 640" >}}
![Illustrative: one global graph connects every tenant, while per-tenant graphs have no edges between tenants, so an unfiltered query must search each and merge](/docs/per-tenant-graphs.png)
{{< /island >}}

```python
from qdrant_client.models import HnswConfigDiff

client.create_collection(
    collection_name=ARTICLES_COLLECTION,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    hnsw_config=HnswConfigDiff(m=0, payload_m=16),
)
```

An existing collection can switch with `update_collection`, which rebuilds its HNSW index.

### Keep Each Tenant's Points Together on Disk

With vectors on disk, `is_tenant` won outright: it loaded faster than a plain keyword index, 203 s against 250 s, and served a 5,000-point tenant faster too, 1.79 ms against 3.25 ms. Storing a tenant's points next to each other lets a filtered query read them sequentially instead of seeking across the segment.

{{< island path="content/documentation/headless/multitenancy/disk-locality" ratio="960 / 630" >}}
![On disk, the tenant index answered faster than a plain keyword index at every tenant size and finished setup in 203 s against 250 s](/docs/disk-locality.png)
{{< /island >}}

### Enforce the Boundary on Every Request

In every model, your code still enforces the boundary: every request carries the tenant filter, the shard key, or both. Each of these fails silently, with no error to warn you:

- A query missing the tenant filter does not return nothing, it returns every tenant's points, since similarity search always ranks the nearest vectors and has no concept of "no match."
- Retrieving a point by its ID ignores the tenant filter entirely, so a guessed or leaked ID returns that point regardless of who owns it. Scope ID lookups with a `has_id` condition combined with the tenant filter, never `has_id` alone.
- An upsert that reuses another tenant's point ID overwrites it outright: tenant A's write to an ID already held by tenant B replaces B's point with no trace of the original.

The same mistake recently showed up one layer up the stack: a semantic cache for LLM responses scoped tenants by embedding distance from a short namespace prefix instead of a hard filter, and users with similar enough questions received each other's cached answers. Treat the tenant field as a hard filter everywhere, including in anything you build on top of Qdrant, never as a similarity signal.

Qdrant's access control cannot carry this boundary for you inside a shared collection: JWT tokens grant read or write access per collection, not per tenant, so the tenant filter must come from your backend, never from the client. Only a collection or a cluster per tenant moves the boundary into Qdrant itself.

### Scope Keyword Statistics to the Tenant

If tenants also search by keyword with BM25 or miniCOIL sparse vectors, a shared collection computes IDF over every tenant's documents at once, so a term that is rare within one tenant's data can still score as common. Since v1.19, the `idf` search parameter takes a payload filter that scopes those statistics, independently of the retrieval filter:

{{< code-snippet path="/documentation/headless/snippets/text-search/query-bm25-idf-corpus/" >}}

Routing a query to a tenant's dedicated shard scopes the statistics already, but an `idf` filter that matches points on another shard silently uses whatever overlap exists locally. This was not measured here.

### Articles That Belong to Several Tenants

When an article belongs to several tenants, a separate point per tenant is not the only option. A follow-up experiment tenanted articles on both their authors and the publication they appeared in (covering 58% of articles) and tested one point per article, with a list of tenants, instead of one point per tenant. Recall held at 1.00 for every kind of tenant, and the list-valued layout stored 161,413 points against 257,726, about 60% fewer. The cost was slower queries for a large publication, 2.36 ms against 1.63 ms at p95, since a point can sit next to only one of its tenants on disk. It holds only while every tenant stays in the shared collection, as [When a Tenant Outgrows the Shared Collection](#when-a-tenant-outgrows-the-shared-collection) shows.

## When a Tenant Outgrows the Shared Collection

Three measurements show what outgrowing the payload model looks like:

- A tenant holding 90% of the collection does not hurt a small tenant's own queries while nothing else is happening, but the dominant tenant's own recall drifts down to 0.985.
- Loading a new 100,000-point tenant raised the other tenants' p95 from 0.74 to 6.84 ms in one run and only from 0.78 to 0.95 ms in another of the same setup: a shared collection's noisy-neighbor cost is not a fixed number. On a shard of its own, the same load left them flat.
- Removing a tenant by filter pushed other tenants' queries as high as 198 ms while the delete ran (on two to four probes, too few for a precise number); dropping a tenant's shard key took a fraction of a second.

{{< island path="content/documentation/headless/multitenancy/noisy-neighbor" ratio="960 / 556" >}}
![While a new 100,000-point tenant loaded, the shared collection's p95 for other tenants rose to 0.95 ms in one run and 6.84 ms in the other; on its own shard it stayed at 0.73 ms](/docs/noisy-neighbor.png)
{{< /island >}}

Before moving any tenant out, settle how points shared by several tenants are stored. A point lives in exactly one shard. Stored once with tenants `[A, B]`, a co-authored article stays reachable in the shared collection, but once author A has a shard of their own, B's queries no longer reach it. With every author on a separate shard, only 245 of 482 tenant-article memberships stayed visible, and after a promotion, co-authors left in the fallback shard saw only 3 of their 240. One copy per tenant kept all of them.

{{< island path="content/documentation/headless/multitenancy/membership-visibility" ratio="960 / 692" >}}
![A co-authored article stored once as [A, B] stays visible to both co-authors in the payload model, but only 245 of 482 memberships survive a shard per tenant and 3 of 240 survive a promotion; one copy per tenant keeps all of them](/docs/membership-visibility.png)
{{< /island >}}

There are two ways out. A few large tenants you know about upfront can each get a shard of their own. When tenants grow over time, tiered multitenancy promotes them one at a time. Either way, Qdrant's guidance caps a cluster at around 1,000 dedicated shards, a documented recommendation rather than a measured one, so with 85,119 authors, a shard for everyone is not an option.

## Move a Dominant Tenant onto Its Own Shard

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

Every write and query for that tenant then carries `shard_key_selector="{tenant_id}"`. Custom sharding is chosen when you create the collection, and an auto-sharded collection cannot be converted in place, so decide upfront whether any tenant might need a shard of its own.

On the single-node cluster used here, moving the dominant tenant onto its own shard mostly helped that tenant: its recall rose from 0.985 to 0.997. A mid-sized tenant got faster, 1.71 to 1.18 ms, but its recall fell from 0.999 to 0.981; the two numbers come from separate runs, so treat the drop as a warning rather than a precise figure. The small tenant this isolation was meant to protect barely moved, 0.52 to 0.55 ms: on one node, a dedicated shard still shares the node's CPU, RAM, and disk.

{{< island path="content/documentation/headless/multitenancy/isolation-tradeoff" ratio="960 / 672" >}}
![Moving the whale onto its own shard raised its recall from 0.985 to 0.997; the mid tenant got faster but its recall fell from 0.999 to 0.981; the tiny tenant barely moved](/docs/isolation-tradeoff.png)
{{< /island >}}

Real isolation needs the shard on its own node, set with the `placement` argument of `create_shard_key`. A shard key can also be a region instead of a tenant, which is how custom sharding keeps data in a region, provided those nodes run there; a Qdrant Cloud cluster runs in a single region.

## Promote Growing Tenants with Tiered Multitenancy

Tiered multitenancy keeps the payload model's low cost for most tenants while giving the few that outgrow it their own shard, without the application needing to know which case it is talking to: every request names a `target` shard key, the tenant, and a `fallback` key, the shared shard everyone starts in, and Qdrant routes to whichever one is active.

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

Promoting a tenant out of the fallback shard moves its points with `replicate_points` rather than a fresh upload:

```python
from qdrant_client import models

# 1. Create the tenant's own shard in Partial state, so requests keep going to the fallback
client.create_shard_key(
    ARTICLES_COLLECTION,
    shard_key="{tenant_id}",
    shards_number=1,
    replication_factor=1,
    initial_state=models.ReplicaState.PARTIAL,
)

# 2. Copy its points out of the fallback shard; the new shard goes active,
# and Qdrant starts routing to it, once the copy finishes
client.cluster_collection_update(
    ARTICLES_COLLECTION,
    cluster_operation=models.ReplicatePointsOperation(
        replicate_points=models.ReplicatePoints(
            from_shard_key="default",
            to_shard_key="{tenant_id}",
            filter=tenant_filter,
        )
    ),
)

# 3. Remove the now-duplicated points from the fallback shard; Qdrant does not do this automatically
client.delete(
    ARTICLES_COLLECTION,
    points_selector=models.FilterSelector(filter=tenant_filter),
    shard_key_selector="default",
)
```

In one run, copying 98,619 points took 10 seconds, during which the other tenants' p95 rose to about 32 ms, and the cleanup took about two minutes with one 25 ms spike. In a separate run, all 200 writes made before and during the copy were visible afterward.

{{< island path="content/documentation/headless/multitenancy/promotion-timeline" ratio="960 / 820" >}}
![Promotion in three steps: a Partial shard, a 10-second copy that raised other tenants' p95 to 32 ms, and a cleanup of about 2 minutes with one 25 ms spike; 200 of 200 writes were kept](/docs/promotion-timeline.png)
{{< /island >}}

Qdrant's guidance puts the point to promote a tenant at around 20,000 points, a recommendation not tested here.

## Takeaways

These come from one dataset and one small single-node cluster, so check them on your own data before relying on the exact numbers.

| Situation | Start with |
|---|---|
| Many tenants, none dominant | A payload field with an `is_tenant` index, created before the first upload |
| Tenant index added to a collection that already has data | Rebuild the HNSW index, for example by bumping `ef_construct` by one |
| Nothing ever searches across tenants | Per-tenant graphs, `m=0` with `payload_m=16` |
| Points shared by several tenants | One copy per tenant if any tenant may ever get its own shard; a list-valued tenant field saves about 60% of points otherwise |
| One tenant far larger or busier than the rest | A shard of its own, on a separate node for real isolation |
| Tenants that grow over time | Tiered multitenancy, promoting a tenant at around 20,000 points, per Qdrant's guidance |
| Keyword search in a shared collection | IDF scoped to the tenant with the `idf` search parameter, from v1.19 |
| Data that must stay in a region | Custom sharding keyed by region, on nodes in that region |
| Different models or settings per tenant | A collection per tenant |

## Check Your Choice

Before committing to a model, run the same checks against your own data: load a representative slice onto a staging collection, at your actual tenant-size distribution rather than only the largest or average tenant, and measure filtered-query latency and recall with the tenant index in place and without it. Then confirm that none of the three silent failures in [Enforce the Boundary on Every Request](#enforce-the-boundary-on-every-request) is present in your own code. The notebooks in [qdrant-labs/multitenancy-qdrant-guide](https://github.com/qdrant-labs/multitenancy-qdrant-guide) run these measurements; point them at your own collection.

## How We Measured

- **Data:** the [`fabiochiu/medium-articles`](https://huggingface.co/datasets/fabiochiu/medium-articles) dataset, one point per article and author, 164,365 points for 85,119 authors, embedded with `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions). For the tenant-size sweep, random points were relabeled into six synthetic tenants of 500 to 40,000 points.
- **Cluster:** Qdrant Cloud, one node with 2 vCPU and 6.9 GB of RAM. Vectors stayed in RAM except in the on-disk comparison.
- **Metrics:** recall@10 against exact search over the tenant's points, and p50 or p95 latency over repeated queries. During loads, deletes, and promotions, other tenants' queries ran continuously as probes, and each phase reports their latency.
- **Noise:** most results come from a single run. Two runs of the same load disagreed by a factor of seven at p95, so treat small differences, such as the mid tenant's recall change, as indicative.
- **Not measured:** isolation across several nodes, data residency, keyword ranking with per-tenant IDF, clusters near the 1,000-shard guidance, the 20,000-point promotion guidance, and the quality of answers built on the search results.
- **Code:** [qdrant-labs/multitenancy-qdrant-guide](https://github.com/qdrant-labs/multitenancy-qdrant-guide).

## Adjacent Work

- [Multitenancy](/documentation/manage-data/multitenancy/): the `is_tenant` index, user-defined sharding, and the tiered multitenancy reference, including promotion.
- [Indexing](/documentation/manage-data/indexing/): payload indexes, filter-aware HNSW, and rebuilding the HNSW index.
- [Distributed deployment](/documentation/scaling/distributed_deployment/#sharding): sharding beyond tenant isolation, including shard replication and placement.
- [Security](/documentation/security/): API keys and JWT access control, which is granted per collection.
- [Qdrant Cloud Dashboard](https://cloud.qdrant.io): manage clusters, collections, and shard keys without scripting the API.
- [The Tao of Qdrant Multi-Tenancy](https://medium.com/qdrant/the-tao-of-qdrant-multi-tenancy-162c71f830fb): four architecture paths, from a collection per customer to a hybrid of them.
- [qdrant-multitenancy agent skill](https://skills.qdrant.tech/qdrant-multitenancy/SKILL.md): the same decision rules, packaged for coding agents.
