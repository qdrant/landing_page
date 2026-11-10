---
title: Multitenancy
short_description: "Give each tenant its own collection on Qdrant Serverless, where a space holds far more collections than a cluster."
description: "Set up multitenancy on Qdrant Serverless with one collection per tenant, and the schema and size limits to plan for."
weight: 40
aliases:
  - ../tutorials/multiple-partitions
  - /tutorials/multiple-partitions/
# This file replaces content/documentation/manage-data/multitenancy.md in the
# serverless role, through the content-serverless mount in config.toml.
---

# Configure Multitenancy

Many applications serve multiple users, customers, or organizations ("tenants") from a shared deployment. Each tenant's data must stay isolated: when a tenant searches, they should only see their own data.

Qdrant Serverless keeps tenants apart with one collection per tenant.

## One Collection per Tenant

A space holds far more collections than a dedicated cluster, so there is no need to pack many tenants into a shared collection. Give each tenant its own collection, and keep each one within the soft limit of around 1 million vectors.

Tenant isolation then comes from the collection boundary itself. A query names one collection, so it can only return that tenant's points, with no filter to write and no filter to get wrong.

## Declare the Schema Up Front

Create each tenant's collection with its full schema, including every payload index you filter by. A collection cannot be changed after it is created, so adding an index later means creating a new collection, uploading the points again, and deleting the old one. See [Collections](/documentation/manage-data/collections/).

## What Serverless Does Not Use

Payload partitioning, user-defined sharding, and tiered multitenancy are not available on Qdrant Serverless. Each of them tunes how data is sharded and indexed, which the platform manages for you. There are no HNSW parameters, quantization settings, or segment options to set per tenant: a vector takes one precision tier, and the platform decides the rest.
