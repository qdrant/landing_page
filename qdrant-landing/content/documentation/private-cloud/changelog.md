---
title: Changelog
weight: 5
---

# Changelog

## 1.5.1 (2025-03-04)

* Correctly scale down clusters that have TLS with self-signed certificates configured
* Various performance improvements and stability fixes

## 1.5.0 (2025-02-21)

* Added support for P2P TLS configuration
* Faster node removal on scale down
* Various performance improvements and stability fixes

## 1.4.0 (2025-01-23)

* Support deleting peers on horizontal scale down, even if they are already offline
* Support removing partially deleted peers

## 1.3.0 (2025-01-17)

* Support for re-sharding with Qdrant >= 1.13.0

## 1.2.0 (2025-01-16)

* Performance and stability improvements

## 1.1.0 (2024-12-03)

* Activate cluster-manager for automatic shard replication

## 1.0.0 (2024-11-11)

* Initial release
