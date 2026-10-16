---
title: Qdrant Cloud API
short_description: "Automate Qdrant Cloud with the gRPC and REST/JSON management API: provision clusters, backups, auth, and Hybrid Cloud resources."
description: "Use the Qdrant Cloud API over gRPC or REST/JSON to automate clusters, backups, authentication, and Hybrid Cloud environments programmatically."
weight: 245
partition: deploy
aliases:
  - /documentation/qdrant-cloud-api/
---
# Qdrant Cloud API: Powerful gRPC and Flexible REST/JSON Interfaces

**Note:** This is not the Qdrant REST or gRPC API of the database itself. For database APIs & SDKs, see our list of [interfaces](/documentation/interfaces/)

## Introduction

The Qdrant Cloud API lets you automate the Qdrant Cloud platform. You can use this API to manage your accounts, clusters, backup schedules, authentication methods, hybrid cloud environments, and more.

To cater to diverse integration needs, the Qdrant Cloud API offers two primary interaction models:

* **gRPC API**: For high-performance, low-latency, and type-safe communication. This is the recommended way for backend services and applications requiring maximum efficiency. The API is defined using Protocol Buffers.
* **REST/JSON API**: A conventional HTTP/1.1 (and HTTP/2) interface with JSON payloads. This API is provided via a gRPC Gateway, translating RESTful calls into gRPC messages, offering ease of use for web clients, scripts, and broader tool compatibility.

You can find the API definitions and generated client libraries in our Qdrant Cloud Public API [GitHub repository](https://github.com/qdrant/qdrant-cloud-public-api).
**Note:** The API is split into multiple services to make it easier to use.

### Qdrant Cloud API Endpoints

* **gRPC Endpoint**: grpc.cloud.qdrant.io:443
* **REST/JSON Endpoint**: https://api.cloud.qdrant.io

### Authentication

Most of the Qdrant Cloud API requests must be authenticated. Authentication is handled via API keys (so-called Cloud Management Keys), which should be passed in the Authorization header.
**Cloud Management Keys**: `Authorization: apikey <YOUR_CLOUD_MANAGEMENT_KEY>`

Replace `<YOUR_CLOUD_MANAGEMENT_KEY>` with a key created in the Qdrant Cloud Console.

You can create a Cloud Management Keys in the Cloud Console UI. Go to **Access Management** > **Cloud Management Keys**.
![Authentication](/documentation/cloud/authentication.png)

**Note:** Ensure that the API key is kept secure and not exposed in public repositories or logs.  Once authenticated, the API allows you to manage clusters, backup schedules, and perform other operations available to your account.

<aside role="alert">
    A Cloud Management Key is <strong>not</strong> deleted or revoked when the user who created it is removed or deleted from the account. The key keeps working with whatever permissions it was granted, so it can still be used to manage the account even after its creator no longer has access. Revoke any Cloud Management Keys tied to a user before or when removing them from the account.
</aside>

Each method requires RBAC permissions, such as `read:clusters` to list clusters. A key can only call methods that its permissions allow. See the [permission reference](/documentation/cloud-rbac/permission-reference/).

### First Request

List the clusters in an account:

```sh
curl "https://api.cloud.qdrant.io/api/cluster/v1/accounts/<ACCOUNT_ID>/clusters" \
  -H "Authorization: apikey <YOUR_CLOUD_MANAGEMENT_KEY>"
```

### Services

The API is split into services. These are the ones you use most:

| Service | Manages |
|---|---|
| `ClusterService` | Clusters, including restarts, suspending, and Qdrant releases |
| `DatabaseApiKeyService` (v2) | Database API keys for a cluster. Version 1 is deprecated |
| `BackupService` | Backups, backup schedules, and restores |
| `BookingService` | Packages (node sizes), storage tiers, inference models, and price quotes |
| `PlatformService` | Cloud providers and regions |
| `AuthService` | Cloud Management Keys |
| `IAMService` | Roles, users, and permissions |
| `HybridCloudService` | Hybrid Cloud environments |
| `MonitoringService` | Cluster metrics, logs, and events |

### Samples

For a complete workflow with `curl`, see [Automate Qdrant Cloud](/documentation/cloud-automation/). For samples with `grpcurl` or the provided SDKs, see the [Qdrant Cloud Public API](https://github.com/qdrant/qdrant-cloud-public-api) repository.

## Terraform Provider

Qdrant Cloud also provides a Terraform provider to manage your Qdrant Cloud resources. [Learn more](/documentation/cloud-tools/terraform/).
