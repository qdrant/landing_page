---
title: Quick Start in Cloud
weight: 10
---

## Create cluster

To start working with the Qdrant cloud platform, you have to create at least one cluster. You can do so on the clusters overview section by clicking the “Create” button.
You will need to choose the initial configuration for your cluster as the next step. 


* Define the name of your cluster. 
* Choose the cloud platform provider. During the beta phase, only the AWS platform will be available for cluster deployment. GCP and Azure cloud providers will be added soon. If you have special requirements, [let us know](mailto:cloud@qdrant.io).
* Choose the data center region. During the beta phase, only the us-east data center location will be choosable in the selection. Other cloud regions can be activated on demand. [Let us know](mailto:cloud@qdrant.io) if you have latency concerns or other topology-related requirements.
* Choose the memory size for a node. 2GB to 64GB options are available. Please refer to the [Capacity and Sizing](https://qdrant.tech/documentation/cloud/capacity/) section to make the right choice here. If you need an even higher capacity per node, [let us know](mailto:cloud@qdrant.io), we can provide machines of any size.
* Choose the number CPU’s per node. 0.5 to 16 CPU options are available, whereas the maximal and minimal number of CPU’s is coupled to the chosen memory size. 
* And finally, choose the number of nodes you want the cluster to be deployed on. Each node is automatically attached with a disc space offering enough space for your data if you decide to put the metadata or even the index on the disc storage.
* Your cluster will be reachable on port 443 and 6333 (Rest endpoint) and 6334 (Grpc)


### Free tier

Every account is eligible for one free tier cluster.
Just choose the name, use the default configuration with 1GB memory and 0.5 CPU, and you are good to go.
You can use this cluster for testing purposes. The capacity should be enough to serve up to 1M vectors of 768dim, but [it depends…](https://qdrant.tech/documentation/cloud/capacity/). 

## Authentication

Have you created your first Qdrant cloud cluster?
Alright, now you want to access it from within your application.
Jump to the “Access” section, there, you will see a list of all available API keys.
Create a new one for your newly created cluster by choosing the name from the cluster name from the select menu.

You can also create a key that provides access to several clusters.
The secret key is only shown once after creation and if you lose it, you will need to create a new one. We recommend rotating the keys from time to time anyway.

The API key needs to be present in the request header each time you make a request to the Qdrant cloud cluster via Rest or gRPC interface.
All official Qdrant clients for Python, Go, and Rust are supporting the API key parameter. 

<!---
Examples with clients
-->


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
