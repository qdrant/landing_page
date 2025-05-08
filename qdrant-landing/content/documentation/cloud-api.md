---
title: Qdrant Cloud API
weight: 27
partition: cloud
aliases:
  - /documentation/qdrant-cloud-api/
---
# Qdrant Cloud API

The Qdrant Cloud API lets you manage Cloud accounts and their respective Qdrant clusters. You can use this API to manage your clusters, authentication methods, and cloud configurations.

| REST API      | Documentation                                                                        |
| -------- | ------------------------------------------------------------------------------------ |
| v.0.1.0 | [OpenAPI Specification](https://cloud.qdrant.io/pa/v1/docs)                       |

**Note:** This is not the Qdrant REST API. For core product APIs & SDKs, see our list of [interfaces](/documentation/interfaces/)

## Authentication: Connecting to Cloud API
To interact with the Qdrant Cloud API, you must authenticate using an API key. Each request to the API must include the API key in the **Authorization** header. The API key acts as a bearer token and grants access to your account’s resources.

You can create a Cloud API key in the Cloud Console UI. Go to **Access Management** > **Qdrant Cloud API Keys**.
![Authentication](/documentation/cloud/authentication.png)

**Note:** Ensure that the API key is kept secure and not exposed in public repositories or logs.  Once authenticated, the API allows you to manage clusters, collections, and perform other operations available to your account.

## Sample API Request

Here's an example of a basic request to **list all clusters** in your Qdrant Cloud account:

```bash
curl -X 'GET' \
  'https://cloud.qdrant.io/pa/v1/accounts/<YOUR_ACCOUNT_ID>/clusters' \
  -H 'accept: application/json' \
  -H 'Authorization: apikey <YOUR_API_KEY>'
```

This request will return a list of clusters associated with your account in JSON format.

## Cluster Management
Use these endpoints to create and manage your Qdrant database clusters. The API supports fine-grained control over cluster resources (CPU, RAM, disk), node configurations, tolerations, and other operational characteristics across all cloud providers (AWS, GCP, Azure) and their respective regions in Qdrant Cloud, as well as Hybrid Cloud.
   - **Get Cluster by ID**: Retrieve detailed information about a specific cluster using the cluster ID and associated account ID.
   - **Delete Cluster**: Remove a cluster, with optional deletion of backups.
   - **Update Cluster**: Apply modifications to a cluster's configuration.
   - **List Clusters**: Get all clusters associated with a specific account, filtered by region or other criteria.
   - **Create Cluster**: Add new clusters to the account with configurable parameters such as nodes, cloud provider, and regions.
   - **Get Booking**: Manage hosting across various cloud providers (AWS, GCP, Azure) and their respective regions.

## Cluster Authentication Management
Use these endpoints to manage your cluster API keys.
   - **List API Keys**: Retrieve all API keys associated with an account.
   - **Create API Key**: Generate a new API key for programmatic access.
   - **Delete API Key**: Revoke access by deleting a specific API key.
   - **Update API Key**: Modify attributes of an existing API key.

## Terraform Provider

Qdrant Cloud also provides a Terraform provider to manage your Qdrant Cloud resources. [Learn more](/documentation/infrastructure/terraform/).
