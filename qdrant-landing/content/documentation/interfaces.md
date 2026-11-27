---
title: API & SDKs
short_description: "Connect to Qdrant dedicated clusters, Serverless spaces, and Qdrant Edge through REST, gRPC, official client SDKs, and the Edge libraries."
description: "Connect to Qdrant with REST or gRPC APIs and official client libraries for Python, JavaScript, Rust, Go, Java, and .NET, on dedicated clusters and Serverless, or embed Qdrant Edge in Python and Rust applications."
weight: 230
partition: develop
---

# Interfaces

How you connect to Qdrant depends on how you deploy it:

- **[Dedicated clusters](#dedicated-clusters)**, whether self-hosted or in Managed Cloud, Hybrid Cloud, or Private Cloud, have a REST API and a gRPC API. Official client libraries are available for Python, JavaScript/TypeScript, Rust, Go, .NET, and Java.
- **[Serverless](#serverless)** spaces also have REST and gRPC APIs, served from a single endpoint. Each official client library includes a separate Serverless client.
- **[Qdrant Edge](#edge)** runs inside your application process, so it has no network API. You use it through a Python or Rust library.

## Dedicated Clusters

Dedicated clusters share one API, whether you run them [self-hosted](/documentation/installation/), in [Managed Cloud](/documentation/cloud/), in [Hybrid Cloud](/documentation/hybrid-cloud/), or in [Private Cloud](/documentation/private-cloud/).

### Client Libraries

Qdrant maintains these official client libraries:

|Client Repository|Installation|Client|Version|
|-|-|-|-|
|**[Python](https://github.com/qdrant/qdrant-client)**|`pip install qdrant-client[fastembed]`|`QdrantClient`, or `AsyncQdrantClient` for async|[Latest Release](https://github.com/qdrant/qdrant-client/releases)|
|**[JavaScript / Typescript](https://github.com/qdrant/qdrant-js)**|`npm install @qdrant/js-client-rest`|`QdrantClient`|[Latest Release](https://github.com/qdrant/qdrant-js/releases)|
|**[Rust](https://github.com/qdrant/rust-client)**|`cargo add qdrant-client`|`Qdrant`|[Latest Release](https://github.com/qdrant/rust-client/releases)|
|**[Go](https://github.com/qdrant/go-client)**|`go get github.com/qdrant/go-client`|`qdrant.NewClient`|[Latest Release](https://github.com/qdrant/go-client/releases)|
|**[.NET](https://github.com/qdrant/qdrant-dotnet)**|`dotnet add package Qdrant.Client`|`QdrantClient`|[Latest Release](https://github.com/qdrant/qdrant-dotnet/releases)|
|**[Java](https://github.com/qdrant/java-client)**|[Available on Maven Central](https://central.sonatype.com/artifact/io.qdrant/client)|`QdrantClient`|[Latest Release](https://github.com/qdrant/java-client/releases)|

If your language isn't listed, use the REST API directly, or generate a client from the [OpenAPI](https://github.com/qdrant/qdrant/blob/master/docs/redoc/master/openapi.json) or [protobuf](https://github.com/qdrant/qdrant/tree/master/lib/api/src/grpc/proto) definitions.

### API Reference

Qdrant offers a REST API and a gRPC API. If you're new to Qdrant or working on a prototype, start with the REST API.

| API      | Documentation                                                                        |
| -------- | ------------------------------------------------------------------------------------ |
| REST API | [OpenAPI Specification](https://api.qdrant.tech/api-reference)                       |
| gRPC API | [gRPC protobuf definitions](https://github.com/qdrant/qdrant/tree/master/lib/api/src/grpc/proto) |

### gRPC Interface

The gRPC methods follow the same principles as REST. For each REST endpoint, there is a corresponding gRPC method.

gRPC is a binary protocol, so it's faster than REST but harder to debug. Use gRPC once you're familiar with Qdrant and want to optimize the performance of your application.

By default, REST listens on port 6333 and gRPC on port 6334. On a self-hosted instance, the [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) sets the gRPC port:

```yaml
service:
  grpc_port: 6334
```

<aside role="status">If you decide to use gRPC, you must expose the port when starting Qdrant.</aside>

Running the service inside of Docker will look like this:

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

## Serverless

A Serverless space has a single endpoint that serves both REST and gRPC over HTTPS on port 443.

Most queries work the same way as on a dedicated cluster, but collection management uses its own API. See [Manage Collections](/documentation/serverless/collections/) and [API Differences](#api-differences).

### Serverless Client Libraries

The official client libraries include a separate client for Serverless. Install the same package as for a dedicated cluster, then create the Serverless client:

|Client Repository|Installation|Client|Version|
|-|-|-|-|
|**[Python](https://github.com/qdrant/qdrant-client)**|`pip install qdrant-client[fastembed]`|`QdrantServerless`, or `AsyncQdrantServerless` for async|[Latest Release](https://github.com/qdrant/qdrant-client/releases)|
|**[Rust](https://github.com/qdrant/rust-client)**|`cargo add qdrant-client`|`QdrantServerless`|[Latest Release](https://github.com/qdrant/rust-client/releases)|
|**[Go](https://github.com/qdrant/go-client)**|`go get github.com/qdrant/go-client`|`serverless.NewClient`|[Latest Release](https://github.com/qdrant/go-client/releases)|
|**[.NET](https://github.com/qdrant/qdrant-dotnet)**|`dotnet add package Qdrant.Client`|`QdrantServerlessClient`|[Latest Release](https://github.com/qdrant/qdrant-dotnet/releases)|
|**[Java](https://github.com/qdrant/java-client)**|[Available on Maven Central](https://central.sonatype.com/artifact/io.qdrant/client)|`QdrantServerlessClient`|[Latest Release](https://github.com/qdrant/java-client/releases)|

To connect to a space, see [Connect to a Space](/documentation/serverless/connect/).

## Edge

[Qdrant Edge](/documentation/edge/) runs inside your application process, so there is no server to connect to and no REST or gRPC interface. You call it through a library:

| Language | Package | Installation |
| :--- | :--- | :--- |
| Python | [`qdrant-edge-py`](https://pypi.org/project/qdrant-edge-py/) | `pip install qdrant-edge-py` |
| Rust | [`qdrant-edge`](https://crates.io/crates/qdrant-edge) | `cargo add qdrant-edge` |

Both libraries expose an `EdgeShard` type with methods to manage and query data. To get started, see the [Edge Quickstart](/documentation/edge/edge-quickstart/). For all methods, see the [Edge API](/documentation/edge/edge-api/) reference.

## API Differences

Dedicated clusters, Serverless, and Edge share the same query API, but some features and behaviors differ. Check these differences when you move an application from one deployment type to another.

| Feature | Dedicated Clusters | Serverless | Edge |
| :--- | :--- | :--- | :--- |
| Collections | Yes | Yes | No, one Edge Shard per dataset |
| Collection aliases | Yes | No | No |
| Change a schema after creation | Yes | No | Yes |
| Update and delete by filter | Yes | No | Yes |
| Lookups | Yes | No | No |
| Read consistency and shard selection | Yes | Not applicable | Not applicable |
| Snapshots | Create and restore | No, use managed backups | Restore only |

### Collection Management

On a dedicated cluster, the collections API configures vectors, payload indexes, HNSW, quantization, sharding, and replication. You can change most of these settings after you create the collection. See [Collections](/documentation/manage-data/collections/).

Serverless has its own collections API. You declare dense and sparse vectors with a precision tier for each, and payload indexes. You can't change a collection after you create it: to change its schema, create a new collection and upload your points again. See [Manage Collections](/documentation/serverless/collections/).

Edge has no collections. An Edge Shard holds one dataset, and you configure its vectors when you create it. You can add and remove named vectors and payload indexes later. See [Updating Data](/documentation/edge/edge-api/updating-data/).

### Update and Delete by Filter

Dedicated clusters and Edge support [update by filter](/documentation/manage-data/points/#conditional-updates) and [delete points by filter](/documentation/manage-data/points/#delete-points-by-filter). Serverless only supports updating and deleting by point ID, and rejects updates and deletes by filter.

### Updates

Write requests to dedicated clusters and Serverless support a [`wait` parameter](/documentation/manage-data/points/#awaiting-result) that determines when the request returns: right after the update is received, or only after it's applied. What `wait=true` guarantees differs per deployment type.

On a dedicated cluster, `wait=true` returns once the update is visible in searches. With `wait=false`, the request returns as soon as the update is in the write-ahead log. If [`prevent_unoptimized`](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments) is enabled, `wait=true` returns only after the optimizer has indexed all deferred points in the shard, which can take a long time under a heavy write load.

On Serverless, `wait=true` returns once the update is applied and visible in searches. Under a heavy write load, Serverless defers new points until they're indexed. `wait=true` doesn't wait for that, so a deferred point can be missing from searches, or still show its previous version, after the request returns. With `wait=false`, the request returns as soon as the update is stored. See [Delayed Update Visibility](/documentation/serverless/#delayed-update-visibility).

Edge has no `wait` parameter: an update returns once Edge has applied it. If `prevent_unoptimized` is enabled, deferred points stay hidden until you call `optimize()`.

The client libraries don't all use the same default for `wait`:

| Client | Dedicated Clusters | Serverless |
| :--- | :--- | :--- |
| Python | `true` | `false` |
| JavaScript/TypeScript | `true` | - |
| Rust | `false` | `false` |
| Go | `false` | `false` |
| .NET | `true` | `true` |
| Java | `true` | `true` |
| REST and gRPC APIs | `false` | `false` |

As a best practice, set `wait` explicitly, so your application behaves the same on every deployment type.

### Lookups

On a dedicated cluster, a query can read vectors from another collection with `lookup_from`, and grouped results can include points from another collection with `with_lookup`. See [Lookup Vectors From Another Collection](/documentation/search/explore/#lookup-vectors-from-another-collection) and [Lookup in Groups](/documentation/search/search/#lookup-in-groups). Serverless and Edge don't support lookups.

### Multitenancy

On a dedicated cluster, you can partition tenants by payload, give each tenant its own shard, or combine both. See [Multitenancy](/documentation/manage-data/multitenancy/).

On Serverless, give each tenant its own collection. See [Multitenancy: One Collection per Tenant](/documentation/serverless/collections/#multitenancy-one-collection-per-tenant).

On Edge, partition tenants by payload within one Edge Shard, or use one Edge Shard per tenant or device.
