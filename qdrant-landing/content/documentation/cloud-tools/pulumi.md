---
title: Pulumi
aliases:
  - /documentation/infrastructure/pulumi/
---

![Pulumi Logo](/documentation/platforms/pulumi/pulumi-logo.png)

Pulumi is an open source infrastructure as code tool for creating, deploying, and managing cloud infrastructure.

A Qdrant SDK in any of Pulumi's supported languages can be generated based on the [Qdrant Terraform Provider](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest).

## Pre-requisites

1. A [Pulumi Installation](https://www.pulumi.com/docs/install/).
2. An [API key](/documentation/qdrant-cloud-api/#authentication-connecting-to-cloud-api) to access the Qdrant cloud API.

## Setup

- Create a Pulumi project in any of the [supported languages](https://www.pulumi.com/docs/languages-sdks/) by running

```bash
mkdir qdrant-pulumi && cd qdrant-pulumi
pulumi new "<LANGUAGE>" -y
```

- Generate a Pulumi SDK for Qdrant by running the following in your Pulumi project directory.

```bash
pulumi package add terraform-provider registry.terraform.io/qdrant/qdrant-cloud
```

- Set the Qdrant cloud API as a config value.

```bash
pulumi config set qdrant-cloud:apiKey "<QDRANT_CLOUD_API_KEY>" --secret
```

## Example Usage

The following example creates a new Qdrant cluster in Google Cloud Platform (GCP) and returns the URL of the cluster.

```python
import pulumi
import pulumi_qdrant_cloud as qdrant_cloud

all_packages = qdrant_cloud.index.getBookingPackages.get_booking_packages(cloud_provider="gcp",
    cloud_region="us-east4")
desired_package = [pkg for pkg in all_packages["packages"] if pkg["resourceConfiguration"][0]["cpu"] == "16000m" and pkg["resourceConfiguration"][0]["ram"] == "64Gi"]
example = qdrant_cloud.AccountsCluster("example",
    name="tf-example-cluster",
    cloud_provider=all_packages["cloudProvider"],
    cloud_region=all_packages["cloudRegion"],
    configuration={
        "number_of_nodes": 1,
        "database_configuration": {
            "service": {
                "jwt_rbac": True,
            },
        },
        "node_configuration": {
            "package_id": desired_package[0]["id"],
        },
    })
example_accounts_database_api_key_v2 = qdrant_cloud.AccountsDatabaseApiKeyV2("example",
    cluster_id=example.id,
    name="example-key")
pulumi.export("url", example.url)
pulumi.export("key", example_accounts_database_api_key_v2.key)

```

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as qdrant_cloud from "@pulumi/qdrant-cloud";

const allPackages = qdrant_cloud.index.getBookingPackages.getBookingPackages({
    cloudProvider: "gcp",
    cloudRegion: "us-east4",
});
const desiredPackage = allPackages.packages.filter(pkg => pkg.resourceConfiguration[0].cpu == "16000m" && pkg.resourceConfiguration[0].ram == "64Gi");
const example = new qdrant_cloud.AccountsCluster("example", {
    name: "tf-example-cluster",
    cloudProvider: allPackages.cloudProvider,
    cloudRegion: allPackages.cloudRegion,
    configuration: {
        numberOfNodes: 1,
        databaseConfiguration: {
            service: {
                jwtRbac: true,
            },
        },
        nodeConfiguration: {
            packageId: desiredPackage[0].id,
        },
    },
});
const exampleAccountsDatabaseApiKeyV2 = new qdrant_cloud.AccountsDatabaseApiKeyV2("example", {
    clusterId: example.id,
    name: "example-key",
});
export const url = example.url;
export const key = exampleAccountsDatabaseApiKeyV2.key;
```

## Further Reading

The provider documentation contains more details on the available resources and data sources, including additional examples:

- [Provider Documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs)
- [Pulumi Quickstart](https://www.pulumi.com/docs/get-started/)
