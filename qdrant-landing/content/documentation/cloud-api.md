---
title: Qdrant Cloud API
weight: 27
partition: cloud
aliases:
  - /documentation/qdrant-cloud-api/
---
# Qdrant Cloud API: Powerful gRPC and Flexible REST/JSON Interfaces

**Note:** This is not the Qdrant REST or gPRC API of the database itself. For core product APIs & SDKs, see our list of [interfaces](/documentation/interfaces/)

## Introduction

The Qdrant Cloud API lets you manage Cloud accounts and their respective Qdrant clusters. You can use this API to manage your clusters, backup schedules, authentication methods, hybrid cloud environments, and and many more.

To cater to diverse integration needs, the Qdrant Cloud API offers two primary interaction models:

**gRPC API**: For high-performance, low-latency, and type-safe communication. This is the recommended way for backend services and applications requiring maximum efficiency. The API is defined using Protocol Buffers.
**REST/JSON API**: A conventional HTTP/1.1 (and HTTP/2) interface with JSON payloads. This API is provided via a gRPC Gateway, translating RESTful calls into gRPC messages, offering ease of use for web clients, scripts, and broader tool compatibility.

You can find the API definitions and generated client libraries in our Qdrant Cloud Public API [GitHub repository](https://github.com/qdrant/qdrant-cloud-public-api).
**Note:** The API is splitted into multiple services to make it easier to use.

### Qdrant Cloud API Endpoints

**gRPC Endpoint**: grpc.cloud.qdrant.io:443
**REST/JSON Endpoint**: https://api.cloud.qdrant.io

### Authentication

Most of the Qdrant Cloud API requests must be authenticated. Authentication is handled via API keys (so called management keys), which should be passed in the Authorization header.
**Management Keys**: `Authorization: apikey <YOUR_MANAGEMENT_KEY>`
Replace <YOUR_MANAGEMENT_KEY> with the actual API key obtained from your Qdrant Cloud dashboard or generated programmatically.

You can create a Cloud API key in the Cloud Console UI. Go to **Access Management** > **Qdrant Cloud API Keys**.
![Authentication](/documentation/cloud/authentication.png)

**Note:** Ensure that the API key is kept secure and not exposed in public repositories or logs.  Once authenticated, the API allows you to manage clusters, backup schedules, and perform other operations available to your account.

### Samples

For samples how to use the API, with a tool (like grpcurl, curl or any of the provided SDKs), please see the [Qdrant Cloud Public API](https://github.com/qdrant/qdrant-cloud-public-api) repository.

## Terraform Provider

Qdrant Cloud also provides a Terraform provider to manage your Qdrant Cloud resources. [Learn more](/documentation/infrastructure/terraform/).

## Deprecated OpenAPI specification

We still support our deprecated OpenAPI endpoint, but this is scheduled to be removed later this year (Q4 of 2025).
We do _NOT_ recommend to use this endpoint anymore and use the replacement as described above.

| REST API      | Documentation                                                                        |
| -------- | ------------------------------------------------------------------------------------ |
| v.0.1.0 | [OpenAPI Specification](https://cloud.qdrant.io/pa/v1/docs)                       |

### Sample API Request (Deprecated)

Here's an example of a basic request to **list all clusters** in your Qdrant Cloud account:

```bash
curl -X 'GET' \
  'https://cloud.qdrant.io/pa/v1/accounts/<YOUR_ACCOUNT_ID>/clusters' \
  -H 'accept: application/json' \
  -H 'Authorization: apikey <YOUR_MANAGEMENT_KEY>'
```

This request will return a list of clusters associated with your account in JSON format.

### Cluster Management (Deprecated)

Use these endpoints to create and manage your Qdrant database clusters. The API supports fine-grained control over cluster resources (CPU, RAM, disk), node configurations, tolerations, and other operational characteristics across all cloud providers (AWS, GCP, Azure) and their respective regions in Qdrant Cloud, as well as Hybrid Cloud.

- **Get Cluster by ID**: Retrieve detailed information about a specific cluster using the cluster ID and associated account ID.
- **Delete Cluster**: Remove a cluster, with optional deletion of backups.
- **Update Cluster**: Apply modifications to a cluster's configuration.
- **List Clusters**: Get all clusters associated with a specific account, filtered by region or other criteria.
- **Create Cluster**: Add new clusters to the account with configurable parameters such as nodes, cloud provider, and regions.
- **Get Booking**: Manage hosting across various cloud providers (AWS, GCP, Azure) and their respective regions.

### Cluster Authentication Management (Deprecated)

Use these endpoints to manage your cluster API keys (the newer v2 format isn't supported).

- **List API Keys**: Retrieve all API keys associated with an account.
- **Create API Key**: Generate a new API key for programmatic access.
- **Delete API Key**: Revoke access by deleting a specific API key.
- **Update API Key**: Modify attributes of an existing API key.

