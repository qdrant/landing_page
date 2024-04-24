---
title: "Qdrant 1.9.0 - Heighten Your Security With Role-Based Access Control Support"
draft: false
slug: qdrant-1.9.x 
short_description: "Granular access control. Optimized shard transfers. Support for byte embeddings."
description: "New access control options for RBAC, a much faster shard transfer procedure, and direct support for byte embeddings. " 
preview_image: /blog/qdrant-1.9.x/qdrant-1.9.0.png
social_preview_image: /blog/qdrant-1.9.x/social_preview.png
date: 2024-04-24T00:00:00-08:00
author: David Myriel
featured: false 
tags:
  - vector search
  - role based access control
  - byte vectors
  - binary vectors
  - quantization
  - new features
---

[Qdrant 1.9.0 is out!](https://github.com/qdrant/qdrant/releases/tag/v1.9.0) This version complements the release of our new managed product [Qdrant Hybrid Cloud](https://hybrid-cloud.qdrant.tech/) with key security features valuable to our enterprise customers, and all those looking to productionize large-scale Generative AI. **Data privacy, system stability and resource optimizations** are always on our mind - so let's see what's new:

- **Granular access control:** You can further specify access control levels by using JSON Web Tokens. 
- **Optimized shard transfers:** The synchronization of shards between nodes is now significantly faster!
- **Support for byte embeddings:** Reduce the memory footprint of Qdrant with official `uint8` support.

## New access control options via JSON Web Tokens

Historically, our API key supported basic read and write operations. However, recognizing the evolving needs of our user base, especially large organizations, we've implemented additional options for finer control over data access within internal environments.

Qdrant now supports [granular access control using JSON Web Tokens (JWT)](/documentation/guides/security/#granular-access-control-with-jwt). JWT will let you easily limit a user's access to the specific data they are permitted to view. Specifically, JWT-based authentication leverages tokens with restricted access to designated data segments, laying the foundation for implementing role-based access control (RBAC) on top of it. **You will be able to define permissions for users and restrict access to sensitive endpoints.**

**Dashboard users:** For your convenience, we have added a JWT generation tool the Qdrant Web UI under the 🔑 tab. If you're using the default url, you will find it at `http://localhost:6333/dashboard#/jwt`.

![jwt-web-ui](/blog/qdrant-1.9.x/jwt-web-ui.png)

We highly recommend this feature to enterprises using [Qdrant Hybrid Cloud](https://hybrid-cloud.qdrant.tech/), as it is tailored to those who need additional control over company data and user access. RBAC empowers administrators to define roles and assign specific privileges to users based on their roles within the organization. In combination with [Hybrid Cloud's data sovereign architecture](/documentation/hybrid-cloud/), this feature reinforces internal security and efficient collaboration by granting access only to relevant resources.

> **Documentation:** [Read the access level breakdown](/documentation/guides/security/#table-of-access) to see which actions are allowed or denied.

## Faster shard transfers on node recovery

We now offer a streamlined approach to [data synchronization between shards](/documentation/guides/distributed_deployment/#shard-transfer-method) during node upgrades or recovery processes. Traditional methods used to transfer the entire dataset, but our new `wal_delta` method focuses solely on transmitting the difference between two existing shards. By leveraging the Write-Ahead Log (WAL) of both shards, this method selectively transmits missed operations to the target shard, ensuring data consistency. 

In some cases, where transfers can take hours, this update **reduces transfers down to a few minutes.**

The advantages of this approach are twofold: 
1. **It is faster** since only the differential data is transmitted, avoiding the transfer of redundant information. 
2. It upholds robust **ordering guarantees**, crucial for applications reliant on strict sequencing. 

For more details on how this works, check out the [shard transfer documentation](/documentation/guides/distributed_deployment/#shard-transfer-method).

> **Note:** There are limitations to consider. First, this method only works with existing shards. Second, while the WALs typically retain recent operations, their capacity is finite, potentially impeding the transfer process if exceeded. Nevertheless, for scenarios like rapid node restarts or upgrades, where the WAL content remains manageable, WAL delta transfer is an efficient solution.

Overall, this is a great optional optimization measure and serves as the **auto-recovery default for shard transfers**. It's safe to use everywhere because it'll automatically fall back to streaming records transfer if no difference can be resolved. By minimizing data redundancy and expediting transfer processes, it alleviates the strain on the cluster during recovery phases, enabling faster node catch-up.

## Native support for uint8 embeddings

Our latest version introduces [support for uint8 embeddings within Qdrant collections](/documentation/concepts/collections/#vector-datatypes). This feature supports embeddings provided by companies in a pre-quantized format. Unlike previous iterations where indirect support was available via [quantization methods](/documentation/guides/quantization/), this update empowers users with direct integration capabilities. 

In the case of `uint8`, elements within the vector are represented as unsigned 8-bit integers, encompassing values ranging from 0 to 255. Using these embeddings gives you a **4x memory saving and about a 30% speed-up in search**, while keeping 99.99% of the response quality. As opposed to the original quantization method, with this feature you can spare disk usage if you directly implement pre-quantized embeddings.

The configuration is simple. To create a collection with uint8 embeddings, simply add the following `datatype`:

```bash
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 1024,
      "distance": "Dot",
      "datatype": "uint8"
    }
}
```

> **Note:** When using Quantization to optimize vector search, you can use this feature to `rescore` binary vectors against new byte vectors. With double the speedup, you will be able to achieve a better result than if you rescored with float vectors. With each byte vector quantized at the binary level, the result will deliver unparalleled efficiency and savings. To learn more about this optimization method, read our [Quantization docs](/documentation/guides/quantization/).

## Minor improvements and new features

- Greatly improve write performance while creating a snapshot of a large collection - [#3420](https://github.com/qdrant/qdrant/pull/3420), [#3938](https://github.com/qdrant/qdrant/pull/3938)
- Report pending optimizations awaiting an update operation in collection info - [#3962](https://github.com/qdrant/qdrant/pull/3962), [#3971](https://github.com/qdrant/qdrant/pull/3971)
- Improve `indexed_only` reliability on proxy shards - [#3998](https://github.com/qdrant/qdrant/pull/3998)
- Make shard diff transfer fall back to streaming records - [#3798](https://github.com/qdrant/qdrant/pull/3798)
- Cancel shard transfers when the shard is deleted - [#3784](https://github.com/qdrant/qdrant/pull/3784)
- Improve sparse vectors search performance by another 7% - [#4037](https://github.com/qdrant/qdrant/pull/4037)
- Build Qdrant with a single codegen unit to allow better compile-time optimizations - [#3982](https://github.com/qdrant/qdrant/pull/3982)
- Remove `vectors_count` from collection info because it is unreliable. **Check if you use this field before upgrading** - [#4052](https://github.com/qdrant/qdrant/pull/4052)
- Remove shard transfer method field from abort shard transfer operation - [#3803](https://github.com/qdrant/qdrant/pull/3803)
