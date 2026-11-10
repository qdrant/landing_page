---
title: Precision Tiers
short_description: "Pick one precision tier per vector on Qdrant Serverless, instead of tuning quantization and index parameters yourself."
description: "Understand precision tiers on Qdrant Serverless: what each tier covers, how to choose one by measuring, and why it is fixed when you create the collection."
weight: 35
aliases:
  - quantization
# Serverless only. There is no Qdrant Server counterpart: the server equivalent
# is content/documentation/manage-data/quantization.md, which is excluded from
# this role. This file reaches the serverless site through the
# content-serverless mount in config.toml.
---

# Precision Tiers

Qdrant Serverless has no HNSW parameters, quantization settings, or storage options to tune. Each vector takes one setting instead: its precision tier. The platform maps that tier onto a datatype, a quantization method, and a memory tier configuration, and owns those choices from then on.

## The Available Tiers

Four tiers are available, from the most precise to the most compact:

- **Full**
- **High**, the default
- **Medium**
- **Low**

The exact configuration behind each tier is not published, and it can change as the platform improves. Treat a tier as a position on a scale rather than as a fixed set of parameters.

## Choosing a Tier

Because the tiers are not published as parameters, pick one by measuring rather than by reasoning about the configuration. Benchmark the candidate tiers against your own data and your own queries, and compare the recall you get with the recall your application needs.

Start at **High**. It is the default, and it is the right answer often enough that moving away from it should follow a measurement rather than precede one. Move to **Full** when the measurement shows you need the precision, and to **Medium** or **Low** when it shows you can afford to give some up.

A tier is set per vector, so a collection with a dense vector and a sparse vector can use a different tier for each.

## Set the Tier When You Create the Collection

A collection cannot be changed after it is created, so each vector's precision tier is fixed for the life of that collection. Choose it when you declare the collection's schema, alongside the vector's size, distance metric, and payload indexes. See [Collections](/documentation/manage-data/collections/).

To change a tier, create a new collection with the configuration you want, upload your points again, and delete the old one.

## What the Platform Owns

Precision tiers are one part of a wider split. Qdrant Serverless owns:

- Quantization and memory tiering
- HNSW index parameters
- Optimizer scheduling and segment layout
- Scaling, up and down
- Sharding and replication

You decide:

- Which spaces and collections to create
- Each collection's vector schema
- The precision tier for each vector
- Which payload fields to index
