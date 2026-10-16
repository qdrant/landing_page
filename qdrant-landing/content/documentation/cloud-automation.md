---
title: Automate Qdrant Cloud
short_description: "Choose between the Cloud API, the qcloud CLI, Terraform, and Pulumi, and see the same cluster and key workflow in each."
description: "Automate Qdrant Cloud with the qcloud CLI, the Cloud API, Terraform, or Pulumi: prerequisites, the same create-cluster and create-key workflow in each tool, and a map of common operations."
weight: 242
partition: deploy
---

# Automating Qdrant Cloud

Everything you can do in the Cloud Console can be scripted. This page helps you choose a tool, shows the same workflow in each one, and maps common operations across them. All tools authenticate with a Cloud Management Key and act on a Cloud account.

## Choose a Tool

| Tool | Use it for | Interface | Read more |
|---|---|---|---|
| `qcloud` CLI | Terminal sessions, shell scripts, and CI jobs. Waits for readiness with `--wait`, and prints JSON with `--json` | gRPC API, at `grpc.cloud.qdrant.io:443` | [Cloud CLI](/documentation/cloud-cli/) |
| Cloud API | Services, custom tooling, and any language with an HTTP or gRPC client | REST at `https://api.cloud.qdrant.io`, gRPC at `grpc.cloud.qdrant.io:443` | [Cloud API](/documentation/cloud-api/) |
| Terraform | Declarative, version-controlled infrastructure with plan and apply | The [Qdrant Cloud provider](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest) | [Terraform](/documentation/cloud-tools/terraform/) |
| Pulumi | The same resources, defined in a general-purpose language | An SDK generated from the Terraform provider | [Pulumi](/documentation/cloud-tools/pulumi/) |

## Before You Start

1. **Create a Cloud Management Key.** In the Cloud Console, go to **Access Management** > **Cloud Management Keys**. Creating one needs the `write:management_keys` permission. See [Authentication](/documentation/cloud/authentication/) for how it differs from a Database API key.
2. **Find your Account ID.** It is on the account **Settings** page. See [Account Setup](/documentation/cloud-account-setup/#account-settings).
3. **Check the permissions.** The workflow on this page needs `write:clusters` and `write:api_keys` for the account that the key acts on. See the [permission reference](/documentation/cloud-rbac/permission-reference/).

<aside role="alert">
    A Cloud Management Key is <strong>not</strong> revoked when the user who created it is removed from the account. Keep keys in a secret store, use one key per pipeline, and revoke a user's keys when they leave. See <a href="/documentation/cloud/authentication/#when-a-user-leaves">When a User Leaves</a>.
</aside>

## Create a Cluster and a Key

The workflow is the same in every tool: create a cluster, then create a Database API key for it.

### qcloud CLI

Put the key in an environment variable instead of the command line, so that it stays out of your shell history:

```sh
export QDRANT_CLOUD_API_KEY=<CLOUD_MANAGEMENT_KEY>
export QDRANT_CLOUD_ACCOUNT_ID=<ACCOUNT_ID>

# Create a three-node cluster and wait until it is healthy
qcloud cluster create \
  --cloud-provider aws --cloud-region us-east-1 \
  --cpu 2 --ram 8Gi --disk 50Gi --nodes 3 \
  --name my-cluster --wait

# Create a Database API key that expires at the end of that day (UTC)
qcloud cluster key create <CLUSTER_ID> --name my-key --expires 2027-06-30 --wait
```

List the available providers, regions, and packages with `qcloud cloud-provider list`, `qcloud cloud-region list --cloud-provider aws`, and `qcloud package list`.

### Cloud API

Every request carries the key in the `Authorization` header. The requests find a package, create a cluster, and create a key.

```sh
export API=https://api.cloud.qdrant.io
export AUTH="Authorization: apikey <CLOUD_MANAGEMENT_KEY>"
export ACCOUNT_ID=<ACCOUNT_ID>

# 1. Find the package ID for the node size you want
curl -G "$API/api/booking/v1/accounts/$ACCOUNT_ID/packages" \
  --data-urlencode "cloudProviderId=aws" \
  --data-urlencode "cloudProviderRegionId=us-east-1" \
  -H "$AUTH"

# 2. Create the cluster
curl -X POST "$API/api/cluster/v1/accounts/$ACCOUNT_ID/clusters" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "cluster": {
      "name": "my-cluster",
      "cloudProviderId": "aws",
      "cloudProviderRegionId": "us-east-1",
      "configuration": {
        "numberOfNodes": 3,
        "packageId": "<PACKAGE_ID>"
      }
    }
  }'

# 3. Create a Database API key with manage access (v2 of the key API)
curl -X POST "$API/api/cluster/auth/v2/accounts/$ACCOUNT_ID/database-api-keys" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "databaseApiKey": {
      "clusterId": "<CLUSTER_ID>",
      "name": "my-key",
      "accessRules": [
        { "globalAccess": { "accessType": "GLOBAL_ACCESS_RULE_ACCESS_TYPE_MANAGE" } }
      ]
    }
  }'
```

The cluster response contains the cluster `id`. The key response contains the `key`, which is shown only once. The cluster takes some time to provision, so poll `GET /api/cluster/v1/accounts/$ACCOUNT_ID/clusters/<CLUSTER_ID>` and check its `state` before you use it.

To restrict a key to collections, use `collectionAccess` rules with the collection name and `COLLECTION_ACCESS_RULE_ACCESS_TYPE_READ_ONLY` or `COLLECTION_ACCESS_RULE_ACCESS_TYPE_READ_WRITE`.

### Terraform

The [Terraform page](/documentation/cloud-tools/terraform/) creates a cluster and a Database API key. The cluster resource is `qdrant-cloud_accounts_cluster`, and the key resource is `qdrant-cloud_accounts_database_api_key_v2`.

### Pulumi

The Pulumi SDK is generated from the Terraform provider, so each resource has the same name in the language's casing. For example, `qdrant-cloud_accounts_cluster` is `AccountsCluster` and `qdrant-cloud_accounts_database_api_key_v2` is `AccountsDatabaseApiKeyV2`. The [Pulumi page](/documentation/cloud-tools/pulumi/) creates a cluster and a key in Python and TypeScript.

## Common Operations

API paths are relative to `/api/cluster/v1/accounts/<ACCOUNT_ID>`.

| Task | `qcloud` command | Cloud API request | Permission |
|---|---|---|---|
| List clusters | `qcloud cluster list` | `GET /clusters` | `read:clusters` |
| Describe a cluster | `qcloud cluster describe <CLUSTER_ID>` | `GET /clusters/<CLUSTER_ID>` | `read:clusters` |
| Resize nodes, add nodes, or add disk | `qcloud cluster scale <CLUSTER_ID>` | `PUT /clusters/<CLUSTER_ID>` | `write:clusters` |
| Change settings, including the Qdrant version | `qcloud cluster update <CLUSTER_ID>` | `PUT /clusters/<CLUSTER_ID>` | `write:clusters` |
| List Qdrant versions | `qcloud cluster version list` | `GET /releases` | `read:clusters` |
| Restart a cluster | `qcloud cluster restart <CLUSTER_ID>` | `POST /clusters/<CLUSTER_ID>/restart` | `write:clusters` |
| Suspend or unsuspend a cluster | `qcloud cluster suspend` and `unsuspend` | `POST /clusters/<CLUSTER_ID>/suspend` and `/unsuspend` | `write:clusters` |
| Create a cluster from a backup | `qcloud cluster create-from-backup --backup-id <BACKUP_ID> --name <NAME>` | `POST /backups/<BACKUP_ID>/clusters` | `restore:backups` and `write:clusters` |
| Delete a cluster | `qcloud cluster delete <CLUSTER_ID>` | `DELETE /clusters/<CLUSTER_ID>` | `delete:clusters` |
| Read alerts and logs | `qcloud cluster alert list <CLUSTER_ID>` and `qcloud cluster logs <CLUSTER_ID>` | Not covered here | |

For backups, see [Backups](/documentation/cloud/backups/). For the Database API key endpoints, which live under `/api/cluster/auth/v2/accounts/<ACCOUNT_ID>/database-api-keys`, see [Authentication](/documentation/cloud/authentication/).

Version upgrades and database configuration changes made through `qcloud cluster update` trigger a rolling restart. Changes to allowed IP ranges, restart mode, rebalance strategy, disk performance tier, cost allocation label, and labels take effect without a restart.
