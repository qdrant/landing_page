---
title: Automate Hybrid Cloud
short_description: "Create and bootstrap Qdrant Hybrid Cloud environments with the qcloud CLI, Terraform, or the Cloud API, and then create clusters in them without the Console."
description: "Automate Qdrant Hybrid Cloud: create a Hybrid Cloud environment, bootstrap your Kubernetes cluster, and create clusters with the qcloud CLI, the Terraform provider, or the Cloud API."
weight: 35
---

# Automating Hybrid Cloud

You can create Hybrid Cloud environments and clusters without the Console. This page shows how with the [`qcloud` CLI](/documentation/cloud-cli/), [Terraform](/documentation/cloud-tools/terraform/), and the [Cloud API](/documentation/cloud-api/). All of them authenticate with a [Cloud Management Key](/documentation/cloud-api/#authentication). Hybrid Cloud access must be enabled for your account by the Qdrant sales team.

The workflow has three steps:

1. Create the Hybrid Cloud environment.
2. Bootstrap your Kubernetes cluster into it, by running the generated commands against the cluster. They install the Operator and the Agent, as described in [Setup](/documentation/hybrid-cloud/hybrid-cloud-setup/).
3. Create Qdrant clusters in the environment.

## qcloud CLI

```sh
# 1. Create the environment
qcloud hybrid create --name my-hybrid-env --namespace qdrant-hybrid

# 2. Generate the bootstrap commands and run them against your Kubernetes cluster
qcloud hybrid bootstrap <ENV_ID> | bash
```

The namespace cannot be changed after bootstrapping. Optional flags set the default database and snapshot storage classes (`--database-storage-class`, `--snapshot-storage-class`), the Kubernetes cluster domain (`--cluster-domain`), and the log level of the components (`--log-level`).

Each run of `qcloud hybrid bootstrap` creates new Qdrant Cloud access tokens and registry credentials, so run it only for a Kubernetes cluster that is not registered to the environment yet. The credentials are printed to stderr, and you should treat them as secrets.

To create a cluster in the environment, set the cloud provider to `hybrid` and the cloud region to the environment that you created with `qcloud hybrid`. Hybrid Cloud has no predefined regions. The list from `qcloud cloud-region list --cloud-provider hybrid` contains your own Hybrid Cloud environments:

```sh
qcloud cluster create \
  --cloud-provider hybrid --cloud-region my-hybrid-env \
  --cpu 2 --ram 8Gi --service-type load-balancer --wait
```

Hybrid Cloud clusters have extra flags for the settings in [Create a Cluster](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/), such as `--node-selector`, `--toleration`, `--database-storage-class`, `--snapshot-storage-class`, `--enable-tls`, and `--api-key-secret`.

Manage environments with these commands:

```sh
qcloud hybrid list
qcloud hybrid describe <ENV_ID>
qcloud hybrid update <ENV_ID> --log-level debug
qcloud hybrid delete <ENV_ID>
```

## Terraform

The `qdrant-cloud_accounts_hybrid_cloud_environment` resource creates an environment. Its `bootstrap_commands` attribute holds the commands to run against your Kubernetes cluster.

```terraform
resource "qdrant-cloud_accounts_hybrid_cloud_environment" "example" {
  name = "example-hc-env"

  configuration {
    // Namespace for the Qdrant components in your Kubernetes cluster
    namespace = "qdrant-hc"
  }
}
```

The [resource documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs/resources/accounts_hybrid_cloud_environment) shows how to write the bootstrap commands to a script file. The commands contain credentials, so keep the file private. For the provider setup, see [Terraform](/documentation/cloud-tools/terraform/).

## Cloud API

The environment endpoints are under `/api/hybrid/v1/accounts/<ACCOUNT_ID>`:

| Operation | Request | Permission |
|---|---|---|
| Create an environment | `POST /hybrid-cloud-environments` | `write:hybrid_cloud_environments` |
| List environments | `GET /hybrid-cloud-environments` | `read:hybrid_cloud_environments` and `write:clusters` |
| Get an environment | `GET /hybrid-cloud-environments/<ENV_ID>` | `read:hybrid_cloud_environments` and `write:clusters` |
| Update an environment | `PUT /hybrid-cloud-environments/<ENV_ID>` | `write:hybrid_cloud_environments` |
| Delete an environment | `DELETE /hybrid-cloud-environments/<ENV_ID>` | `delete:hybrid_cloud_environments` |
| Generate the bootstrap commands | `POST /hybrid-cloud-environments/<ENV_ID>/bootstrap-commands` | `write:hybrid_cloud_environments` and `write:management_keys` |

Send the key in the `Authorization: apikey <CLOUD_MANAGEMENT_KEY>` header. For the permissions, see the [permission reference](/documentation/cloud-rbac/permission-reference/).
