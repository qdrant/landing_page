---
title: Optimization
weight: 125
partition: deploy
---

# Optimization

Qdrant gives you fine-grained control over how vectors are stored, indexed, and searched so you can tune performance to match your workload. The core trade-off is between three resources:

- **Memory** — keeping data in RAM for fast access versus offloading to disk to reduce cost
- **Search speed** — throughput (requests per second) versus latency (time per request)
- **Precision** — approximate nearest-neighbor accuracy versus exact results

## In This Section

- [**Optimize Performance**](/documentation/optimization/optimize/) — Practical configuration strategies for three common scenarios: high-speed search with low memory, high precision with low memory, and high precision with high speed. Also covers how to tune for latency versus throughput.

- [**Optimizer**](/documentation/optimization/optimizer/) — How Qdrant's background optimizer works, including the Vacuum, Merge, and Indexing optimizers. Covers configuration parameters, the `prevent_unoptimized` mode for heavy write workloads, and how to monitor optimization progress.
