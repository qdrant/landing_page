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

The following example creates a new Qdrant cluster in Amazon Web Services (AWS) and returns the URL of the cluster.

```terraform
// see: https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs/guides/getting-started
// Setup Terraform, including the qdrant-cloud providers
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    qdrant-cloud = {
      source  = "qdrant/qdrant-cloud"
      version = ">=1.1.0"
    }
  }
}

// Add the provider to specify some provider wide settings
provider "qdrant-cloud" {
  api_key    = "<QDRANT_CLOUD_MANAGEMENT_KEY>"  // API Key generated in Qdrant Cloud (required)
  account_id = "<QDRANT_CLOUD_ACCOUNT_ID>"      // The default account ID you want to use in Qdrant Cloud (can be overriden on resource level)
}

// Get the cluster package
// see https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs/guides/getting-started#available-cloud-providers-and-regions
data "qdrant-cloud_booking_packages" "all_packages" {
  cloud_provider = "aws"
  cloud_region   = "us-west-2"
}

locals {
  desired_package = [
    for pkg in data.qdrant-cloud_booking_packages.all_packages.packages : pkg
    if pkg.resource_configuration[0].cpu == "500m" && pkg.resource_configuration[0].ram == "2Gi"
  ]
}

// Create a cluster (for the sake of having an ID, see below)
resource "qdrant-cloud_accounts_cluster" "example" {
  name           = "tf-example-cluster"
  cloud_provider = data.qdrant-cloud_booking_packages.all_packages.cloud_provider
  cloud_region   = data.qdrant-cloud_booking_packages.all_packages.cloud_region
  configuration {
    number_of_nodes = 1
    database_configuration {
      service {
        jwt_rbac = true
      }
    }
    node_configuration {
      package_id = local.desired_package[0].id
    }
  }
}

// Create an V2 Database Key, which refers to the cluster provided above
resource "qdrant-cloud_accounts_database_api_key_v2" "example" {
  cluster_id   = qdrant-cloud_accounts_cluster.example.id
  name         = "example-key"
}

// Output some of the cluster info
output "cluster_id" {
  value = qdrant-cloud_accounts_cluster.example.id
}

output "cluster_version" {
  value = qdrant-cloud_accounts_cluster.example.version
}

output "url" {
  value = qdrant-cloud_accounts_cluster.example.url
}

// Output the Database API Key (which can be used to access the database cluster)
output "key" {
  value       = qdrant-cloud_accounts_database_api_key_v2.example.key
  description = "Key is available only once, after creation."
}
```

## Further Reading

The provider documentation contains more details on the available resources and data sources, including additional examples:

- [Provider Documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs)
- [Terraform Quickstart](https://developer.hashicorp.com/terraform/tutorials)
