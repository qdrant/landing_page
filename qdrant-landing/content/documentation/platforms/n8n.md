---
title: N8N
aliases: [ ../frameworks/n8n/ ]
---

# N8N

[N8N](https://n8n.io/) is an automation platform that allows you to build flexible workflows focused on deep data integration.

[Qdrant's official node](https://www.npmjs.com/package/n8n-nodes-qdrant) for n8n enables semantic search capabilities in your workflows.

## Prerequisites

1. A Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).
2. A running N8N instance. You can learn more about using the N8N cloud or self-hosting [here](https://docs.n8n.io/choose-n8n/).

## Setting up the node

- Select and install the official Qdrant node from the list of nodes in your workflow editor.

![Qdrant n8n node](/documentation/frameworks/n8n/node.png)

- Once installed, you can create a connection to Qdrant using your [credentials](/documentation/cloud/authentication/).

![Qdrant Credentials](/documentation/frameworks/n8n/credentials.png)

## Operations

The node supports the following operations:

### Collection Management

- [List Collections](https://api.qdrant.tech/v-1-14-x/api-reference/collections/get-collections) - List all collections in the Qdrant instance
- [Create Collection](https://api.qdrant.tech/v-1-14-x/api-reference/collections/create-collection) - Create a new collection with specified vector parameters
- [Update Collection](https://api.qdrant.tech/v-1-14-x/api-reference/collections/update-collection) - Update parameters of an existing collection
- [Get Collection](https://api.qdrant.tech/v-1-14-x/api-reference/collections/get-collection) - Get information about a specific collection
- [Collection Exists](https://api.qdrant.tech/v-1-14-x/api-reference/collections/collection-exists) - Check if a collection exists
- [Delete Collection](https://api.qdrant.tech/v-1-14-x/api-reference/collections/delete-collection) - Delete a collection

### Point Operations

- [Upsert Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/upsert-points) - Insert or update points in a collection
- [Retrieve Point](https://api.qdrant.tech/v-1-14-x/api-reference/points/get-point) - Get a single point by ID
- [Retrieve Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/get-points) - Get multiple points by their IDs
- [Delete Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/delete-points) - Remove points from a collection
- [Count Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/count-points) - Count points in a collection with optional filtering
- [Scroll Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/scroll-points) - Scroll through all points in a collection
- [Batch Update Points](https://api.qdrant.tech/v-1-14-x/api-reference/points/batch-update) - Perform multiple point operations in a single request

### Vector Operations

- [Update Vectors](https://api.qdrant.tech/v-1-14-x/api-reference/points/update-vectors) - Update vectors for existing points
- [Delete Vectors](https://api.qdrant.tech/v-1-14-x/api-reference/points/delete-vectors) - Remove vectors from points
- [Query Points](https://api.qdrant.tech/v-1-14-x/api-reference/search/query-points) - Search for similar vectors
- [Query Points In Batch](https://api.qdrant.tech/v-1-14-x/api-reference/search/query-batch-points) - Perform multiple vector searches in batch
- [Query Points Groups](https://api.qdrant.tech/v-1-14-x/api-reference/search/query-points-groups) - Group search results by payload field
- [Matrix Pairs](https://api.qdrant.tech/v-1-14-x/api-reference/search/matrix-pairs) - Calculate distance matrix between pairs of points
- [Matrix Offsets](https://api.qdrant.tech/v-1-14-x/api-reference/search/matrix-offsets) - Calculate distance matrix using offsets

### Payload Operations

- [Set Payload](https://api.qdrant.tech/v-1-14-x/api-reference/points/set-payload) - Set payload for points
- [Overwrite Payload](https://api.qdrant.tech/v-1-14-x/api-reference/points/overwrite-payload) - Replace entire payload for points
- [Delete Payload](https://api.qdrant.tech/v-1-14-x/api-reference/points/delete-payload) - Remove payload from points
- [Clear Payload](https://api.qdrant.tech/v-1-14-x/api-reference/points/clear-payload) - Clear all payload fields
- [Payload Facets](https://api.qdrant.tech/v-1-14-x/api-reference/points/facet) - Get payload field statistics
- [Create Payload Index](https://api.qdrant.tech/v-1-14-x/api-reference/indexes/create-field-index) - Create an index for payload fields
- [Delete Payload Index](https://api.qdrant.tech/v-1-14-x/api-reference/indexes/delete-field-index) - Remove a payload field index

## Further Reading

- [N8N Reference](https://docs.n8n.io).
- [Qdrant Node Source](https://github.com/qdrant/n8n-nodes-qdrant).
