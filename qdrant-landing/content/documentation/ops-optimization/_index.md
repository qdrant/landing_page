---
title: Optimization
short_description: "Tune Qdrant for high-speed search, high precision, or low memory usage and learn how the background optimizer reorganizes segments."
description: "Optimize Qdrant for speed, precision, or memory efficiency, and understand how the background optimizer rebuilds segments to keep performance steady."
weight: 125
partition: deploy
---

# Optimization

These pages cover strategies and internal mechanisms for improving search performance, reducing memory usage, and managing how Qdrant organizes data on disk.

## Optimize Performance

[Optimize Performance](/documentation/ops-optimization/optimize/) walks through three main optimization scenarios — high-speed search, high-precision search, and low memory usage — and the configuration choices that achieve each one.

## Optimizer

[Optimizer](/documentation/ops-optimization/optimizer/) explains how Qdrant's background optimizer rebuilds segments to keep data structures efficient, including the vacuum, merge, and indexing stages and the thresholds that trigger them.
