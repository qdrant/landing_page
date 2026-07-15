---
title: Configuration
short_description: "Configure and administer Qdrant with guides on config files, environment variables, runtime administration, telemetry, and GPU support."
description: "Customize Qdrant with configuration files, environment variables, runtime administration tools, anonymized telemetry controls, and GPU-accelerated indexing."
weight: 120
partition: deploy
---

# Configuration

These pages cover the settings and runtime options available for customizing and administering a Qdrant deployment.

## Configuration

[Configuration](/documentation/ops-configuration/configuration/) describes how to customize Qdrant's behavior using config files and environment variables, covering storage paths, network interfaces, performance parameters, and feature flags.

## Administration

[Administration](/documentation/ops-configuration/administration/) covers runtime administration tools that let you modify instance behavior without restarting — including recovery mode for resolving out-of-memory situations.

## Memory Tiers

[Memory Tiers](/documentation/ops-configuration/memory-tiers/) explains how the `memory` parameter (`cold`, `cached`, `pinned`) controls RAM residency for vectors, indexes, quantized data, and payloads.

## Usage Statistics

[Usage Statistics](/documentation/ops-configuration/usage-statistics/) explains what anonymized telemetry the open-source Qdrant image collects, why it's collected, and how to opt out.

## Running with GPU

[Running with GPU](/documentation/ops-configuration/running-with-gpu/) explains how to enable GPU-accelerated vector indexing using dedicated Docker images for NVIDIA and AMD hardware, available from Qdrant v1.13.0.
