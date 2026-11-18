---
title: Quotas and Limits
short_description: "Account, space, collection, write, and search limits for Qdrant Serverless."
description: "Reference of Qdrant Serverless quotas and limits: spaces per account, collection size cap, vector and payload index limits, request and payload sizes, and search limits."
weight: 50
---

# Quotas and Limits

Spaces share capacity with other workloads, so Serverless enforces stricter limits than a dedicated cluster. Requests that exceed a limit are rejected.

## Account and Space Quotas

| Quota | Limit |
|---|---|
| Spaces per account | A fixed maximum per account, which can be raised on request. |
| Collections per space | Far more than a dedicated cluster supports. |
| Vectors per collection | Soft limit of around 1 million |
| Collection size | Set by the collection size cap on the space, 2 GiB by default. Once a collection reaches the cap, writes are rejected and searches keep working. |

## Collection Limits

These apply when you create a collection.

| Limit | Maximum |
|---|---|
| Dense vector dimensions | 4096 |
| Multivector dimensions | 512 |
| Dense vectors per collection | 10 |
| Sparse vectors per collection | 10 |
| Payload indexes per collection | 10 |
| Payload index field path | 128 bytes |
| Collection name | 255 characters: letters, numbers, periods, hyphens, and underscores. Can't start with a period or a hyphen. |

## Write Limits

| Limit | Maximum |
|---|---|
| Request size | 32 MiB |
| Payload per point | 32 KiB, including payload merged in by a set payload request |
| Array length in an indexed payload field | 1024 elements |
| Sparse vector entries | 4096 |
| Multivector rows per point | 128 |

## Search Limits

| Limit | Maximum |
|---|---|
| Results per request | 1000, including offset and prefetch limits |
| Prefetch stages | 32, nested up to 4 levels deep |
| Filter conditions | 64, nested up to 4 levels deep |
| Queries per batch | 64 |

Searches that would scan the whole collection are rejected:

- Filtering on a field that has no compatible payload index. Declare the index when you create the collection.
- Exact search, with `exact` set.
