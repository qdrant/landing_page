---
title: Changelog
weight: 5
---

# Changelog

## 1.6.4 (2025-04-17)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.15.5 |
| operator version               | 2.3.4   |
| qdrant-cluster-manager version | v0.3.4  |

* Fix bug in operator Helm chart that caused role binding generation to fail when using `watch.namespaces`

## 1.6.3 (2025-03-28)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.15.0 |
| operator version               | 2.3.3   |
| qdrant-cluster-manager version | v0.3.4  |

* Performance and stability improvements for collection re-sharding

## 1.6.2 (2025-03-21)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.15.0 |
| operator version               | 2.3.2   |
| qdrant-cluster-manager version | v0.3.3  |

* Allow disabling NetworkPolicy management in Qdrant Cluster operator

## 1.6.1 (2025-03-14)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.14.2 |
| operator version               | 2.3.2   |
| qdrant-cluster-manager version | v0.3.3  |

* Add support for GPU instances
* Experimental support for automatic shard balancing

## 1.5.1 (2025-03-04)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.12.0 |
| operator version               | 2.1.26  |
| qdrant-cluster-manager version | v0.3.2  |

* Fix scaling down clusters that have TLS with self-signed certificates configured
* Various performance improvements and stability fixes

## 1.5.0 (2025-02-21)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.12.0 |
| operator version               | 2.1.26  |
| qdrant-cluster-manager version | v0.3.0  |

* Added support for P2P TLS configuration
* Faster node removal on scale down
* Various performance improvements and stability fixes

## 1.4.0 (2025-01-23)

|                                |        |
|--------------------------------|--------|
| qdrant-kubernetes-api version  | v1.8.0 |
| operator version               | 2.1.26 |
| qdrant-cluster-manager version | v0.3.0 |

* Support deleting peers on horizontal scale down, even if they are already offline
* Support removing partially deleted peers

## 1.3.0 (2025-01-17)

|                                |         |
|--------------------------------|---------|
| qdrant-kubernetes-api version  | v1.8.0  |
| operator version               | 2.1.21  |
| qdrant-cluster-manager version | v0.2.10 |

* Support for re-sharding with Qdrant >= 1.13.0

## 1.2.0 (2025-01-16)

|                                |        |
|--------------------------------|--------|
| qdrant-kubernetes-api version  | v1.8.0 |
| operator version               | 2.1.20 |
| qdrant-cluster-manager version | v0.2.9 |

* Performance and stability improvements

## 1.1.0 (2024-12-03)

| qdrant-kubernetes-api version | v1.6.4 |
| operator version | 2.1.10 |
| qdrant-cluster-manager version | v0.2.6 |

* Activate cluster-manager for automatic shard replication

## 1.0.0 (2024-11-11)

|                                |        |
|--------------------------------|--------|
| qdrant-kubernetes-api version  | v1.2.7 |
| operator version               | 0.1.3  |
| qdrant-cluster-manager version | v0.2.4 |

* Initial release
