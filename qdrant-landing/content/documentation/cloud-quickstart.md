---
title: Cloud Quickstart
short_description: "Spin up a free Qdrant Cloud cluster, connect with the official SDKs, and run your first semantic search in minutes."
description: "Create a free Qdrant Cloud cluster, install the client SDK, and run your first semantic search using built-in inference for vector embeddings."
weight: 110
partition: develop
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
  - cloud-quickstart
  - cloud/quickstart-cloud/
  - /documentation/cloud-quickstart/
---

# Quick Start with Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/xvWIssi_cjQ?si=CLhFrUDpQlNog9mz&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

Learn how to set up Qdrant Cloud and perform your first semantic search in just a few minutes. We'll use a sample dataset of menu items embedded with the `sentence-transformers/all-MiniLM-L6-v2` model via [Cloud Inference](/documentation/inference/). This is one of the free embedding models available on Qdrant Cloud. For a list of the available free and paid models, refer to the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

## 0. Get Started with a Coding Agent

We recommend copying the following into your agent to get started quickly and directly:

{{< prompt "start-building" >}}

If you use the prompt, your agent creates the cluster, installs the client, and connects to Qdrant Cloud for you, so you can skip to [Step 4](#4-create-our-collection).

## 1. Create a Cloud Cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or Github credentials.
2. Under **Create a Free Cluster**, enter a cluster name and select your preferred cloud provider and region. Click **Create Free Cluster**.
3. Copy your **API key** when prompted - you'll need it to connect. Store it somewhere safe as it won't be displayed again.

For detailed cluster setup instructions, see the [Cloud documentation](/documentation/deploy-intro/).

### Create a Cluster With `qcloud` CLI

To install `qcloud`, refer to [Installation](/documentation/cloud-automation/cloud-cli/#installation).

Use the [`qcloud` CLI](/documentation/cloud-automation/cloud-cli/) to create the cluster and its Database API key. The `--wait` flag returns when the cluster is healthy and the key is active.

```sh
# Authenticate
qcloud auth login

# Create a free cluster and wait until it is healthy
qcloud cluster create \
  --cloud-provider aws --cloud-region eu-central-1 \
  --package free2 --name my-cluster --wait

# Create a Database API key. The key is shown only once.
qcloud cluster key create <CLUSTER_ID> --name my-key --wait
```

To find the cluster URL for [Step 3](#3-connect-to-qdrant-cloud), run `qcloud cluster describe <CLUSTER_ID>` and copy the `Endpoint`.

### Create a Cluster With the Cloud API

The [Cloud API](/documentation/cloud-automation/cloud-api/) authenticates with a Cloud Management Key. Refer to [Before You Start](/documentation/cloud-automation/#before-you-start) for how to create one and find your account ID.

```sh
export API=https://api.cloud.qdrant.io
export AUTH="Authorization: apikey <CLOUD_MANAGEMENT_KEY>"
export ACCOUNT_ID=<ACCOUNT_ID>

# 1. Find the ID of the free package in your region
curl -G "$API/api/booking/v1/accounts/$ACCOUNT_ID/packages" \
  --data-urlencode "cloudProviderId=aws" \
  --data-urlencode "cloudProviderRegionId=eu-central-1" \
  -H "$AUTH"

# 2. Create the cluster
curl -X POST "$API/api/cluster/v1/accounts/$ACCOUNT_ID/clusters" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "cluster": {
      "name": "my-cluster",
      "cloudProviderId": "aws",
      "cloudProviderRegionId": "eu-central-1",
      "configuration": {
        "numberOfNodes": 1,
        "packageId": "<FREE_PACKAGE_ID>"
      }
    }
  }'

# 3. Create a Database API key. The key is shown only once.
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

The cluster takes some time to provision. Poll `GET /api/cluster/v1/accounts/$ACCOUNT_ID/clusters/<CLUSTER_ID>` until its `state` shows that it is healthy. The cluster URL is in that response.

## 2. Install the Qdrant Client

Once you have a cluster, the fastest way to get started is to use our official SDKs which provide a convenient interface for working with Qdrant in your preferred programming language.

{{< code-snippet path="/documentation/headless/snippets/install-client/" >}}

## 3. Connect to Qdrant Cloud

Import the qdrant client and create a connection to your Qdrant Cloud cluster using your cluster URL and API key.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/connect/" >}}

## 4. Create our collection

We will use some sample menu items to demonstrate how to create a collection and add data to it. Each menu item has a name, description, price, and category. First, we need to create a collection in Qdrant to store our menu items.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/create-collection/" >}}

## 5. Populate the collection

Next, we will populate the collection with menu items. Each item will be represented as a point in the collection with its associated metadata. Instead of generating embeddings locally, we pass a `Document` object with the text and model name, and Qdrant Cloud Inference handles the embedding automatically.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/upload-points/" >}}

## 6. Search the Menu Items

Now we can search the menu item dataset! We'll use the same `sentence-transformers/all-MiniLM-L6-v2` model in Cloud Inference to embed our query text, then find the best dishes matching that embedding.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/search/" >}}

## That's Vector Search!

You've just performed semantic search on real menu item data. The query "vegetarian dishes" returned similar menu items based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/search/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/manage-data/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-lp-overview/)
- Install the [Qdrant Advisor skill](/documentation/agentic-tools/skills/#the-qdrant-advisor) so your coding agent gets current Qdrant guidance as you build
- Run through the [Production Checklist](/documentation/production-checklist/) before deploying to production