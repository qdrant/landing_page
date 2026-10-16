---
title: Connect to a Cluster
short_description: "Connect to a Qdrant Cloud cluster: endpoint format, REST and gRPC ports, node-specific endpoints, the Cluster UI, IP allowlists, and connection troubleshooting."
description: "Find your Qdrant Cloud cluster endpoint, choose between REST and gRPC ports, use node-specific endpoints for metrics and snapshots, restrict access by IP, and troubleshoot connections."
weight: 15
---

# Connecting to Qdrant Cloud Clusters

Once you have [created a cluster](/documentation/cloud/create-cluster/) and an [API key](/documentation/cloud/authentication/), you can reach it through the REST API, the gRPC API, or the integrated Cluster UI.

## Endpoints and Ports

Each cluster has one cluster endpoint, shown on the Cluster Detail page. It has the form:

```text
<cluster-id>.<region>.<provider>.cloud.qdrant.io
```

| Protocol | URL | Port |
|---|---|---|
| REST | `https://<endpoint>` | `6333` or `443` |
| gRPC | `<endpoint>` with TLS enabled | `6334` |

Always use TLS. In the official clients, enable it with the `https` option (`https=True` in .NET, `UseTLS: true` in Go, `true` in the Java `QdrantGrpcClient` builder) or an `https://` URL. Pass the API key with every request. See [Authenticate With a Key](/documentation/cloud/authentication/#authenticate-with-a-key) for samples in every language.

![Cluster cluster endpoint](/documentation/cloud/cloud-endpoint.png)

Traffic to the cluster endpoint is load balanced across all healthy nodes, and every node can handle every search and write request. It does not matter which node you land on.

## Node-Specific Endpoints

Each node also has its own endpoint, formed by prefixing the cluster endpoint with `node-<N>-`, starting at `node-0-`. You can copy them from the Cluster Detail page.

![Cluster node endpoints](/documentation/cloud/cloud-node-endpoints.png)

Use the cluster endpoint for everything except the operations that must reach a specific node:

| Operation | Endpoint |
|---|---|
| Search, upserts, collection management, `/telemetry` | Cluster endpoint |
| `/sys_metrics` | Cluster endpoint, queried once per cluster |
| `/metrics` | Each node endpoint, so that you scrape every node. See [Monitoring](/documentation/cloud/cluster-monitoring/#qdrant-database-metrics-and-telemetry) |
| Snapshots on a multi-node cluster | Each node endpoint. See [Backups](/documentation/cloud/backups/#backups-with-a-snapshot) |
| Audit log download | A node endpoint. See [Audit Logging](/documentation/cloud/configure-cluster/#audit-logging) |
| Manual shard management | Node endpoints |

## Cluster UI

Open the [Cluster UI](/documentation/web-ui/) from the Cluster Details page in the Qdrant Cloud Console. Authentication is automatic if your Cloud user has the [`read:cluster_data` or `write:cluster_data` permission](/documentation/cloud-rbac/permission-reference/). Without the correct permissions, the UI prompts you for an [API key](/documentation/cloud/authentication/).

![Cluster Cluster UI](/documentation/cloud/cloud-db-dashboard.png)

The Overview tab also contains direct links to explore Qdrant tutorials and sample datasets.

![Cluster Cluster UI Tutorials](/documentation/cloud/cloud-db-deeplinks.png)

## Restrict Access by IP Range

By default, any client that holds a valid key can connect from any network. To allow only trusted networks, set **Client IP Restrictions** in the cluster configuration on the Cluster Detail page. Only the ranges you list can reach the cluster. See [Client IP Restrictions](/documentation/cloud/configure-cluster/#client-ip-restrictions) for the setting.

For traffic that never crosses the public internet, Premium clusters support [private network connectivity](/documentation/cloud-premium/#private-network-connectivity).

## Troubleshooting Connections

| Symptom | Check |
|---|---|
| The request times out or the connection is refused | The port matches the protocol (`6333` or `443` for REST, `6334` for gRPC). Your client's network is inside the [allowed IP ranges](#restrict-access-by-ip-range). |
| gRPC fails to connect but REST works | TLS is enabled on the gRPC client, and the port is `6334`. |
| `401 Unauthorized` | The request carries a key. The key is a complete Database API key for this cluster, not a Cloud Management Key. |
| `403 Forbidden` | The key has not expired. Its permission covers the operation and the collection. A key created moments ago can return `403`, so retry. |

For the exact error messages, see [Troubleshooting](/documentation/common-errors/#unauthorized-and-forbidden-http-401-and-403).
