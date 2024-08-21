---
title: Cloud API Reference
weight: 100
---
# Qdrant Cloud API 

The Qdrant Cloud API lets you manage Cloud accounts and their respective Qdrant clusters. You can use this API to manage your clusters, authentication methods, and cloud configurations. 

| REST API      | Documentation                                                                        |
| -------- | ------------------------------------------------------------------------------------ |
| v.0.1.0 | [OpenAPI Specification](https://cloud.qdrant.io/pa/v1/docs)                       |

## Cluster Management  
In addition to basic CRUD operations, the API supports fine-grained control over cluster resources (CPU, RAM, disk), node configurations, tolerations, and other operational characteristics.
   - **Get Cluster by ID**: Retrieve detailed information about a specific cluster using the cluster ID and associated account ID.
   - **Delete Cluster**: Remove a cluster, with optional deletion of backups.
   - **Update Cluster**: Apply modifications to a cluster's configuration.
   - **List Clusters**: Get all clusters associated with a specific account, filtered by region or other criteria.
   - **Create Cluster**: Add new clusters to the account with configurable parameters such as nodes, cloud provider, and regions.

## Authentication Management
Use these endpoints to manage your cluster API keys.
   - **List API Keys**: Retrieve all API keys associated with an account.
   - **Create API Key**: Generate a new API key for programmatic access.
   - **Delete API Key**: Revoke access by deleting a specific API key.
   - **Update API Key**: Modify attributes of an existing API key.

## Booking Packages
You can manage available service packages across various cloud providers (AWS, GCP, Azure) and their respective regions. Use these endpoints to customize your deployments based on specific needs. 
