---
title: "Where It Runs"
short_description: "Module 4 of the Beginner Course: local, Docker, self-hosted, and Qdrant Cloud compared."
description: "Deployment mode is independent of your design decisions. Compare the modes that run Qdrant as a server, and choose by ownership and isolation."
weight: 7
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# Where It Runs

Deployment mode is independent of the design decisions in this module. Choose based on how much you want to run yourself and how isolated the data needs to be. Four modes run Qdrant as a server:

- **Managed Cloud** runs it for you, with upgrades, backups, and replication handled.
- **[Hybrid Cloud](/documentation/hybrid-cloud/)** runs in your own Kubernetes cluster, managed from the Qdrant Cloud console, with the data staying in your network.
- **[Private Cloud](/documentation/private-cloud/)** runs in your own Kubernetes cluster with no connection to that console, and can run fully air-gapped.
- **Docker** means you run and operate the container, on your own machine or your own infrastructure.

Both Kubernetes modes require you to operate a cluster, so choose one only when a data requirement rules out Managed Cloud.

Two more run inside a process instead of as a server. Local mode runs inside your Python program for notebooks and tests. Edge embeds one self-contained shard inside an application on a device, the way SQLite embeds a database. Use it for offline or very low-latency search. [Deploy Qdrant](/documentation/deploy-intro/) links the setup guide for each mode.

![Six Qdrant deployment modes. Four run as a server, shaded from light to dark by how much you operate them: Managed Cloud, Hybrid Cloud, Private Cloud, and Docker. Local mode and Edge are grouped separately because they run inside a process instead.](/courses/beginners/module-4/deployment.png)
