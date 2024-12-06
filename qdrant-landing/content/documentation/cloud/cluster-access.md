---
title: Cluster Access
weight: 35
---

# Accessing Qdrant Cloud Clusters

Once you [created](/documentation/cloud/create-cluster/) a cluster, and set up an [API key](/documentation/cloud/authentication/), you can access your cluster through the integrated Web UI, the REST API and the GRPC API.

## Web UI

There is the convenient link on the cluster detail page in the Qdrant Cloud Console to access the [Web UI](/documentation/web-ui/) of your cluster.

![Cluster Web UI](/documentation/cloud/cloud-db-dashboard.png)

## API

The REST API is exposed on your cluster endpoint at port `6333`. The GRPC API is exposed on your cluster endpoint at port `6334`. When accessing the cluster endpoint, traffic is automatically load balanced across all healthy Qdrant nodes in the cluster. For all operations, but the few mentioned at [Node specific endpoints](#node-specific-endpoints), you should use the cluster endpoint. It does not matter which node in the cluster you land on. All nodes can handle all search and write requests.

![Cluster cluster endpoint](/documentation/cloud/cloud-endpoint.png)

Have a look at the [API reference](/documentation/interfaces/#api-reference) and the official [client libraries](/documentation/interfaces/#client-libraries)  for more information on how to interact with the Qdrant Cloud API.

## Node specific endpoints

Next to the cluster endpoint which loadbalances requests across all healthy Qdrant nodes, each node in the cluster has its own endpoint as well. This is mainly usefull for monitoring or manual shard management purpuses.

You can finde the node specific endpoints on the cluster detail page in the Qdrant Cloud Console.

![Cluster node endpoints](/documentation/cloud/cloud-node-endpoints.png)
