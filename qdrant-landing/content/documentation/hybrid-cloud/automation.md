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

To create a cluster in the environment, set the cloud provider to `hybrid` and the cloud region to the ID of the environment that you created with `qcloud hybrid`. The ID is a UUID, not the name of the environment. Hybrid Cloud has no predefined regions. `qcloud hybrid list` shows your environments and their IDs:

```sh
qcloud cluster create \
  --cloud-provider hybrid --cloud-region <ENV_ID> \
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

The [resource documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs/resources/accounts_hybrid_cloud_environment) shows how to write the bootstrap commands to a script file. The commands contain credentials, so keep the file private. Run the script against your Kubernetes cluster, and wait until the environment is healthy before you create a cluster. Changing `bootstrap_commands_version` generates new commands and rotates the credentials, so you must run them against the cluster again. For the provider setup, see [Terraform](/documentation/cloud-tools/terraform/).

To create a cluster in the environment, set `cloud_provider` to `"hybrid"`, and set `cloud_region` to the ID of the environment. It is not a region name:

```terraform
data "qdrant-cloud_booking_packages" "hybrid" {
  cloud_provider = "hybrid"
  cloud_region   = qdrant-cloud_accounts_hybrid_cloud_environment.example.id
}

locals {
  desired_package = [
    for pkg in data.qdrant-cloud_booking_packages.hybrid.packages : pkg
    if pkg.resource_configuration[0].cpu == "2000m"
    && pkg.resource_configuration[0].ram == "8Gi"
  ]
}

resource "qdrant-cloud_accounts_cluster" "db" {
  name           = "my-hybrid-cluster"
  cloud_provider = "hybrid"
  cloud_region   = qdrant-cloud_accounts_hybrid_cloud_environment.example.id

  configuration {
    number_of_nodes = 1

    node_configuration {
      package_id = local.desired_package[0].id
    }
  }
}
```

If the package lookup does not fit your setup, list the packages with `qcloud package list --cloud-provider hybrid` and pass the package ID directly. The `configuration` block has options for Hybrid Cloud:

- `service_type`: `CLUSTER_SERVICE_TYPE_CLUSTER_IP` (the default), `CLUSTER_SERVICE_TYPE_LOAD_BALANCER`, or `CLUSTER_SERVICE_TYPE_NODE_PORT`
- `node_selector`, `tolerations`, `topology_spread_constraints`, `annotations`, `service_annotations`, and `pod_labels`
- `cluster_storage_configuration`, with `database_storage_class`, `snapshot_storage_class`, and `volume_snapshot_class` if they differ from the environment default

A new cluster is exposed only inside Kubernetes and has no API key. Before you use a load balancer or a node port, configure an API key. See [Create a Cluster](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#authentication-to-your-qdrant-clusters).

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
