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

# Quick Start With Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/xvWIssi_cjQ?si=CLhFrUDpQlNog9mz&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

Learn how to set up a dedicated cluster on Qdrant Managed Cloud and perform your first semantic search in just a few minutes. We'll use a sample dataset of menu items embedded with the `sentence-transformers/all-MiniLM-L6-v2` model via [Cloud Inference](/documentation/inference/). This is one of the free embedding models available on Qdrant Cloud. For a list of the available free and paid models, refer to the Inference tab of the Cluster Detail page in the Qdrant Cloud Console.

## 0. Get Started With a Coding Agent

We recommend copying the following into your agent to get started quickly and directly:

{{< prompt "start-building" >}}

If you use the prompt, your agent creates the cluster, installs the client, and connects to Qdrant Cloud for you, so you can skip to [Step 4](#4-create-our-collection).

## 1. Create a Dedicated Cluster on Managed Cloud

You have two options to create a cluster:

- With a user interface, in the Cloud Console
- In a terminal, with the [Qdrant Cloud command-line interface (CLI)](/documentation/cloud-automation/cloud-cli/), `qcloud`

After creating a cluster, store a Database API key and the cluster URL. You will need them next.

### Create a Cluster With the Cloud Console

1. Sign up for a [Cloud account](https://cloud.qdrant.io/signup). You can register with your email, Google, or GitHub credentials.
1. In the [Cloud Console](https://cloud.qdrant.io/), under **Create a Free Cluster**, enter a cluster name and select your preferred cloud provider and region. Click **Create Free Cluster**.
1. Copy your **API key** when prompted. You will need it to connect. Store it somewhere safe as it won't be displayed again.
1. You will need the cluster URL later. Open your cluster in the Cloud Console and copy the cluster endpoint from the Cluster Detail page. Refer to [Endpoints and Ports](/documentation/cloud/cluster-access/#endpoints-and-ports).

For detailed cluster setup instructions, see the [Cloud documentation](/documentation/deploy-intro/).

### Create a Cluster With the Qdrant Cloud CLI

Before you start, [install `qcloud`](/documentation/cloud-automation/cloud-cli/#installation).

1. Log in. A browser window opens, where you can sign in or sign up for a Cloud account. On the consent page, choose the account to use and allow manage access.

   ```sh
   qcloud auth login
   ```

1. Create a free cluster in the AWS `eu-central-1` region. The `free2` package is the free tier, and the `--wait` flag returns when the cluster is healthy.

   ```sh
   qcloud cluster create \
     --cloud-provider aws --cloud-region eu-central-1 \
     --package free2 --name my-cluster --wait
   ```

1. Create the Database API key for the new cluster, using its cluster ID. The key is shown only once, so store it somewhere safe. The `--wait` flag returns when the key is active.

   ```sh
   qcloud cluster key create <CLUSTER_ID> --name my-key --wait
   ```

1. You will need the cluster URL later. Retrieve it by running the following command and copying the `Endpoint`.

   ```sh
   qcloud cluster describe <CLUSTER_ID>
   ```

## 2. Install the Qdrant Client

Once you have a cluster, the fastest way to get started is to use our official SDKs which provide a convenient interface for working with Qdrant in your preferred programming language.

{{< code-snippet path="/documentation/headless/snippets/install-client/" >}}

## 3. Connect to Qdrant Cloud

Import the qdrant client and create a connection to your Qdrant Cloud cluster using your cluster URL and API key.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/connect/" >}}

## 4. Create Our Collection

We will use some sample menu items to demonstrate how to create a collection and add data to it. Each menu item has a name, description, price, and category. First, we need to create a collection in Qdrant to store our menu items.

{{< code-snippet path="/documentation/headless/snippets/cloud-quickstart/create-collection/" >}}

## 5. Populate the Collection

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