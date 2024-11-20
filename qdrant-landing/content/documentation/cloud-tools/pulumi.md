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

- You can now import the SDK as:

```python
import pulumi_qdrant_cloud as qdrant_cloud
```

```typescript
import * as qdrantCloud from "qdrant-cloud";
```

```java
import com.pulumi.qdrantcloud.*;
```

## Usage

The provider includes the following data-sources and resources to work with:

### Data Sources

- `qdrant-cloud_booking_packages` - Get IDs and detailed information about the packages/subscriptions available. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/booking_packages.md)

```python
qdrant_cloud.get_booking_packages(cloud_provider="aws", cloud_region="us-west-2")
```

```typescript
qdrantCloud.getBookingPackages({
    cloudProvider: "aws",
    cloudRegion: "us-west-2"
})
```

```java
import com.pulumi.qdrantcloud.inputs.GetBookingPackagesArgs;

QdrantcloudFunctions.getBookingPackages(GetBookingPackagesArgs.builder()
        .cloudProvider("aws")
        .cloudRegion("us-west-2")
        .build());
```

- `qdrant-cloud_accounts_auth_keys` - List API keys for Qdrant clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_auth_keys.md)

```python
qdrant_cloud.get_accounts_auth_keys(account_id="<ACCOUNT_ID>")
```

```typescript
qdrantCloud.getAccountsAuthKeys({
    accountId: "<ACCOUNT_ID>"
})
```

```java
import com.pulumi.qdrantcloud.inputs.GetAccountsAuthKeysArgs;

QdrantcloudFunctions.getAccountsAuthKeys(GetAccountsAuthKeysArgs.builder()
        .accountId("<ACCOUNT_ID>")
        .build());
```

- `qdrant-cloud_accounts_cluster` - Get Cluster Information. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_cluster.md)

```python
qdrant_cloud.get_accounts_cluster(
    account_id="<ACCOUNT_ID>",
    id="<CLUSTER_ID>",
)
```

```typescript
qdrantCloud.getAccountsCluster({
    accountId: "<ACCOUNT_ID>",
    id: "<CLUSTER_ID>"
})
```

```java
import com.pulumi.qdrantcloud.inputs.GetAccountsClusterArgs;

QdrantcloudFunctions.getAccountsCluster(GetAccountsClusterArgs
        .builder()
        .accountId("<ACCOUNT_ID>")
        .id("<CLUSTER_ID>")
        .build());
```

- `qdrant-cloud_accounts_clusters` - List Qdrant clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/data-sources/accounts_clusters.md)

```python
qdrant_cloud.get_accounts_clusters(account_id="<ACCOUNT_ID>")
```

```typescript
qdrantCloud.getAccountsClusters({
    accountId: "<ACCOUNT_ID>"
})
```

```java
import com.pulumi.qdrantcloud.inputs.GetAccountsClustersArgs;

QdrantcloudFunctions.getAccountsClusters(
        GetAccountsClustersArgs.builder().accountId("<ACCOUNT_ID>").build());
```

### Resources

- `qdrant-cloud_accounts_cluster` - Create clusters on Qdrant cloud - [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/resources/accounts_cluster.md)

```python
qdrant_cloud.AccountsCluster(
    resource_name="pl-example-cluster-resource",
    name="pl-example-cluster",
    cloud_provider="gcp",
    cloud_region="us-east4",
    configuration=qdrant_cloud.AccountsClusterConfigurationArgs(
        number_of_nodes=1,
        node_configuration=qdrant_cloud.AccountsClusterConfigurationNodeConfigurationArgs(
            package_id="3920d1eb-d3eb-4117-9578-b12d89bb1c5d"
        ),
    ),
    account_id="<ACCOUNT_ID>",
)
```

```typescript
new qdrantCloud.AccountsCluster("pl-example-cluster-resource", {
    cloudProvider: "gcp",
    cloudRegion: "us-east4",
    configuration: {
        numberOfNodes: 1,
        nodeConfiguration: {
            packageId: "3920d1eb-d3eb-4117-9578-b12d89bb1c5d"
        }
    },
    accountId: "<ACCOUNT_ID>"
})
```

```java
import com.pulumi.qdrantcloud.AccountsClusterArgs;
import com.pulumi.qdrantcloud.inputs.AccountsClusterConfigurationArgs;
import com.pulumi.qdrantcloud.inputs.AccountsClusterConfigurationNodeConfigurationArgs;

new AccountsCluster("pl-example-cluster-resource", AccountsClusterArgs.builder()
        .name("pl-example-cluster")
        .cloudProvider("gcp")
        .cloudRegion("us-east4")
        .configuration(AccountsClusterConfigurationArgs.builder()
                .numberOfNodes(1.0)
                .nodeConfiguration(AccountsClusterConfigurationNodeConfigurationArgs.builder()
                        .packageId("3920d1eb-d3eb-4117-9578-b12d89bb1c5d")
                        .build())
                .build())
        .accountId("<ACCOUNT_ID>")
        .build());
```

- `qdrant-cloud_accounts_auth_key` - Create API keys for Qdrant cloud clusters. [Reference](https://github.com/qdrant/terraform-provider-qdrant-cloud/blob/main/docs/resources/accounts_auth_key.md)

```python
qdrant_cloud.AccountsAuthKey(
    resource_name="pl-example-key-resource",
    cluster_ids=["<CLUSTER_ID>"],
)
```

```typescript
new qdrantCloud.AccountsAuthKey("pl-example-cluster-resource", {
    clusterIds: ["<CLUSTER_ID>", "<CLUSTER_ID_2>"]
})
```

```java
import com.pulumi.qdrantcloud.AccountsAuthKey;
import com.pulumi.qdrantcloud.AccountsAuthKeyArgs;

new AccountsAuthKey("pl-example-key-resource", AccountsAuthKeyArgs.builder()
        .clusterIds("<CLUSTER_ID>", "<CLUSTER_ID_2>")
        .build());
```

## Further Reading

- [Provider Documentation](https://registry.terraform.io/providers/qdrant/qdrant-cloud/latest/docs)
- [Pulumi Quickstart](https://www.pulumi.com/docs/get-started/)
