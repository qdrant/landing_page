---
title: Optimization
short_description: "Tune Qdrant for high-speed search, high precision, or low memory usage, and troubleshoot read-write contention under continuous write load."
description: "Optimize Qdrant for speed, precision, or memory efficiency, understand how the background optimizer rebuilds segments, and troubleshoot read-write contention under continuous ingestion."
weight: 125
partition: deploy
---

# Optimization

These pages cover strategies and internal mechanisms for improving search performance, reducing memory usage, managing how Qdrant organizes data on disk, and troubleshooting read-write contention.

## Optimize Performance

[Optimize Performance](/documentation/ops-optimization/optimize/) walks through three main optimization scenarios — high-speed search, high-precision search, and low memory usage — and the configuration choices that achieve each one.

## Optimizer

[Optimizer](/documentation/ops-optimization/optimizer/) explains how Qdrant's background optimizer rebuilds segments to keep data structures efficient, including the vacuum, merge, and indexing stages and the thresholds that trigger them.

## Troubleshoot Read-Write Contention

[Troubleshoot Read-Write Contention](/documentation/ops-optimization/read-write-contention/) walks through a step-by-step set of configuration changes to reduce contention between the background optimizer and search queries under continuous write load.
