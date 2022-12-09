---
title: Cluster scaling
weight: 30
---


The amount of data is always growing and at some point you might need to upgrade the capacity of your cluster.
There are different options for how it can be done.

## Vertical scaling

Vertical scaling, also known as vertical expansion, is the process of increasing the capacity of a cluster by adding more resources, such as memory, storage, or processing power.

You can start with a minimal cluster configuration of 2GB of RAM and resize it up to 64GB of RAM (or even more if desired) over the time step by step with the growing amount of data in your application.
If your cluster consists of several nodes each node will need to be scaled to the same size.
Please note that vertical cluster scaling will require a short downtime period to restart your cluster.
In order to avoid downtime you can make use of the data replication option.
During the beta phase, vertical scaling is available on demand and will be added as self service on the Cloud dashboard after the testing phase. 

## Horizontal scaling

Vertical scaling can be an effective way to improve the performance of a cluster and extend the capacity, but it has some limitations.
The main disadvantage of vertical scaling is that there are limits to how much a cluster can be expanded.
At some point, adding more resources to a cluster can become impractical or cost-prohibitive.
In such cases, horizontal scaling may be a more effective solution.
Horizontal scaling, also known as horizontal expansion, is the process of increasing the capacity of a cluster by adding more nodes and distributing the load and data among them. 
The horizontal scaling at Qdrant starts on the collection level.
You have to choose the number of shards you want to distribute your collection around while creating the collection.
Please refer to the [sharding documentation](../../distributed_deployment/#sharding) section for details.


Important: The number of shards means the maximum amount of nodes you can add to your cluster. On the beginning, all the shards can reside on one node.
With the growing amount of data you can add nodes to your cluster and move shards to the dedicated nodes using the [cluster setup API](../../distributed_deployment/#cluster-scaling). 

We, the Qdrant team, will be glad to consult you on an optimal strategy for scaling.
[Let us know](mailto:cloud@qdrant.io) your needs and decide together on a proper solution. We plan to introduce an autoscalling functionality. Since it is one of most desired features, it has a high priority on our Cloud roadmap.
