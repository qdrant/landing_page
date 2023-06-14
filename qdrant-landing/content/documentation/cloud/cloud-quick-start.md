---
title: Quick Start in Cloud
weight: 10
---

# Getting stared with Qdrant Cloud

To use Qdrant Cloud, you will need to create at least one cluster. There are two ways to start:
1. Create a Free Tier cluster with 1 node and a default configuration (1GB RAM, 0.5 CPU and 20GB Disk).
2. Configure a custom cluster with additional nodes and more resources. **You will have to provide billing information.**

We recommend that you use the Free Tier cluster for testing purposes. The capacity should be enough to serve up to 1M vectors of 768dim. To calculate your needs, refer to [capacity planning](../cloud/capacity/). 

## Create a Free Tier cluster

1. Start in the **Overview** section of the Dashboard. 
2. Under **Set a Cluster Up** enter a **Cluster name**.
3. Click **Create Free Tier** and then **Continue**.
4. Under **Get an API Key**, select the cluster and click **Get API Key**.
5. Save the API key, as you won't be able to request it again. Click **Continue**. 

Now you can test cluster access. Your generated request should be similar to this one:

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.cloud.qdrant.io:6333 \
  --header 'api-key: <provide-your-own-key>'
```
6. Open Terminal and run the request. You should get a response that looks like this:

```bash
{"title":"qdrant - vector search engine","version":"1.1.0"}
```
> **Note:** The API key needs to be present in the request header every time you make a request via Rest or gRPC interface.

## Create a custom cluster

> **Prerequisite:** Please make sure you have provided billing information before creating a custom cluster. 

1. Start in the **Overview** section of the Dashboard. 
2. Under **Set a Cluster Up** scroll down and click **Create Custom Tier**.
3. A window will open. Enter a cluster **Name**.
4. In the Beta version, you can only deploy to AWS. We are currentl;y developing support GCP and Azure. 
5. Choose from one of five data center regions. If you have latency concerns or other topology-related requirements, [let us know](mailto:cloud@qdrant.io).
6. Configure RAM size for each node (2GB to 64GB). 
> Please read [Capacity and Sizing](https://qdrant.tech/documentation/cloud/capacity/) to make the right choice. If you need more capacity per node, [let us know](mailto:cloud@qdrant.io).
7. Choose the number of CPUs per node (0.5 core to 16 cores). The max/min number of CPUs is coupled to the chosen RAM size. 
8. Select the number of nodes you want the cluster to be deployed on. 
> Each node is automatically attached with a disc space offering enough space for your data if you decide to put the metadata or even the index on the disc storage.
9. Click **Create** and wait for your cluster to be provisioned.

Your cluster will be reachable on port 443 and 6333 (Rest endpoint) and 6334 (Grpc).

10. Follow **Step 6** from the above **Create a Free Tier cluster** instruction set to verify cluster access

## Create additional API keys

The API key is only shown once after creation. If you lose it, you will need to create a new one. 
However, we recommend rotating the keys from time to time.

1. To create more API keys, go to the **Access** section in the Dashboard.
2. The **Access Management** list will display all available API keys.
3. Click **Create** and choose a cluster name from the dropdown menu.
> **Note:** You can create a key that provides access to multiple clusters. Simply check off which cluster in the dropdown
4. Click **OK** and retrieve your API key. 

## Authentication via Python client

Now that you have created your first cluster and key, you might want to access Qdrant Cloud from within your application.
Our official Qdrant clients for Python, Go, and Rust all support the API key parameter. 

Sample Python code

```python
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    "xyz-example.eu-central.aws.staging-cloud.qdrant.io", 
    prefer_grpc=True,
    api_key="<<-provide-your-own-key->>",
)
```

```bash
curl \
  -X GET https://xyz-example.eu-central.aws.staging-cloud.qdrant.io:6333 \
  --header 'api-key: <provide-your-own-key>'
```
