---
title: Operations
weight: 215
partition: qdrant
---

# Operations

Everything you need to deploy, configure, and run Qdrant in production. These pages cover installation, capacity planning, distributed setups, security, monitoring, performance optimization, and troubleshooting.

## Capacity Planning

[Capacity Planning](/documentation/operations/capacity-planning/) helps you estimate memory and storage requirements based on your vector dimensions, quantization settings, and dataset size.

## Installation

[Installation](/documentation/operations/installation/) covers how to run Qdrant using Docker, from packages, or from source, including basic configuration options.

## Snapshots

[Snapshots](/documentation/operations/snapshots/) describe how to back up and restore collections at a point in time, for individual nodes or the full cluster.

## Usage Statistics

[Usage Statistics](/documentation/operations/usage-statistics/) explains the anonymized telemetry Qdrant collects and how to opt out.

## Monitoring & Telemetry

[Monitoring](/documentation/operations/monitoring/) covers Qdrant's metrics endpoint, Prometheus integration, and health-check APIs for observability.

## Security

[Security](/documentation/operations/security/) explains how to enable API key authentication and TLS to secure your Qdrant instance.

## Troubleshooting

[Troubleshooting](/documentation/operations/common-errors/) lists common errors and their solutions to help diagnose issues quickly.

## Configuration

[Configuration](/documentation/operations/configuration/) documents all available Qdrant configuration file settings and environment variable overrides.

## Administration

[Administration](/documentation/operations/administration/) covers runtime administration tools, including recovery mode and collection locking.

## Distributed Deployment

[Distributed Deployment](/documentation/operations/distributed_deployment/) explains how to run Qdrant as a multi-node cluster, including sharding, replication, and consensus.

## Running with GPU

[Running with GPU](/documentation/operations/running-with-GPU/) describes how to enable GPU-accelerated indexing using dedicated Qdrant Docker images for NVIDIA and AMD GPUs.

## Optimize Performance

[Optimize Performance](/documentation/operations/optimize/) walks through three main strategies for tuning Qdrant for high speed, low memory, or high precision workloads.

## Optimizer

[Optimizer](/documentation/operations/optimizer/) describes the background optimizer process that rebuilds segments to improve search performance over time.
