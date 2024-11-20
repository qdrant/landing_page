---
title: Terraform
aliases:
  - /documentation/infrastructure/terraform/
---

![Terraform Logo](/documentation/platforms/terraform/terraform.png)

HashiCorp Terraform is an infrastructure as code tool that lets you define both cloud and on-prem resources in human-readable configuration files that you can version, reuse, and share. You can then use a consistent workflow to provision and manage all of your infrastructure throughout its lifecycle.

With the [Qdrant Terraform Provider](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest), you can manage the Qdrant cloud lifecycle leveraging all the goodness of Terraform.

## Pre-requisites

To use the Qdrant Terraform Provider, you'll need:

1. A [Terraform installation](https://developer.hashicorp.com/terraform/install).
2. An [API key](/documentation/qdrant-cloud-api/#authentication-connecting-to-cloud-api) to access the Qdrant cloud API.

## Example Usage

The following example creates a new Qdrant cluster in Google Cloud Platform (GCP) and returns the URL of the cluster.

```terraform
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    qdrant-cloud = {
      source  = "qdrant/qdrant-cloud"
      version = ">=1.1.0"
    }
  }
}

provider "qdrant-cloud" {
  api_key    = "<QDRANT_CLOUD_API_KEY>"
  account_id = "QDRANT_ACCOUNT_ID>" // Account ID from cloud.qdrant.io/accounts/<QDRANT_ACCOUNT_ID>/ (can be overriden on resource level)
}

resource "qdrant-cloud_accounts_cluster" "example" {
  name           = "tf-example-cluster"
  cloud_provider = "gcp"
  cloud_region   = "us-east4"
  configuration {
    number_of_nodes = 1
    node_configuration {
       package_id = "7c939d96-d671-4051-aa16-3b8b7130fa42"
    }
  }
}

output "url" {
  value = qdrant-cloud_accounts_cluster.example.url
}
```

The provider includes the following resources and data-sources to work with:

## Resources

- `qdrant-cloud_accounts_cluster` - Create clusters on Qdrant cloud - [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/resources/accounts_cluster.md)

- `qdrant-cloud_accounts_auth_key` - Create API keys for Qdrant cloud clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/resources/accounts_auth_key.md)

## Data Sources

- `qdrant-cloud_accounts_auth_keys` - List API keys for Qdrant clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_auth_keys.md)

- `qdrant-cloud_accounts_cluster` - Get Cluster Information. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_cluster.md)

- `qdrant-cloud_accounts_clusters` - List Qdrant clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_clusters.md)

- `qdrant-cloud_booking_packages` - Get detailed information about the packages/subscriptions available. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/booking_packages.md)

## Further Reading

- [Provider Documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs)
- [Terraform Quickstart](https://developer.hashicorp.com/terraform/tutorials)
