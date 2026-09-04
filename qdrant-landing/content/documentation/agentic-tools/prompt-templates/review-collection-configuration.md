---
title: "Review a Collection Configuration Before Launch"
short_description: "Hand your agent a collection configuration and workload profile, and get a go or no-go checklist covering indexing, quantization, replication, and filter readiness."
description: "A Qdrant prompt template for pre-launch collection review. Produces a prioritized checklist of blockers and recommendations across payload indexing, quantization, replication, sharding, and search parameters, based on your actual configuration."
weight: 10
partition: develop
category: review-and-audit
output_contract: checklist
tags:
  - review
  - production-readiness
  - payload-index
template_version: 1
variables:
  - name: COLLECTION_CONFIG
    required: true
    description: "The full configuration of the collection you're about to launch."
    source: "curl -s $QDRANT_URL/collections/COLLECTION | jq .result"
    placeholder: "vectors: {size: 1024, distance: Cosine}, optimizers_config: {...}"
  - name: WORKLOAD_PROFILE
    required: true
    description: "Point count, expected QPS, latency target, and the filters your queries actually use."
    placeholder: "12M points, ~300 QPS peak, p95 target 100 ms, filters on tenant_id and created_at"
  - name: DEPLOYMENT_TARGET
    required: false
    description: "Node count, RAM and disk per node, and whether this is Qdrant Cloud, Hybrid Cloud, or self-hosted."
    placeholder: "3 nodes, 32 GB RAM each, self-hosted on Kubernetes"
  - name: LAUNCH_CONSTRAINTS
    required: false
    description: "Anything that limits your options, such as a fixed memory budget or a no-downtime requirement."
    placeholder: "cannot exceed 32 GB per node; no downtime during cutover"
draws_on:
  skills:
    - qdrant-performance-optimization/search-speed-optimization
    - qdrant-performance-optimization/memory-usage-optimization
    - qdrant-sizing
    - qdrant-multitenancy
  docs:
    - /documentation/production-checklist/
    - /documentation/manage-data/indexing/
    - /documentation/manage-data/quantization/
---

# Review a Collection Configuration Before Launch

A collection that works in staging can fail in production for reasons that never surface in a test suite: a filter field with no payload index, a replication factor of 1 on a cluster you expect to survive a node loss, or a quantization setting that quietly costs you recall. This template hands your agent the actual configuration and the workload it is about to take, and asks for a prioritized verdict rather than general advice.

Use it once the configuration is settled but before real traffic arrives. For a collection that's already live and misbehaving, the [agent skills](/documentation/agentic-tools/skills/) are the better starting point, because they're organized around symptoms.

## The Template

Fill in the variables, then copy the prompt into your coding assistant.

{{< prompt-template >}}
You are reviewing a Qdrant collection configuration before it takes production traffic. Report findings only. Do not explain how Qdrant works.

Collection configuration:
{{COLLECTION_CONFIG}}

Workload profile:
{{WORKLOAD_PROFILE}}

Deployment target:
{{DEPLOYMENT_TARGET}}

Launch constraints:
{{LAUNCH_CONSTRAINTS}}

Check each of the following against the configuration and workload above. For each one, decide whether it's a blocker, a recommendation, or already correct.

1. Payload indexes. Every field used in a filter needs an index whose type matches how it's filtered. Flag filter fields with no index, and flag indexes on fields too low in cardinality to be selective. If the workload is multitenant, check whether is_tenant is set on the partitioning field.
2. Vector index parameters. Check m and ef_construct against the point count and latency target. For a multitenant collection, check whether m is set to 0 with payload_m set instead, so the global index isn't built.
3. Quantization. Decide whether the memory budget requires it. If quantization is already configured, check that rescore and oversampling are set consistently with the recall the workload needs, and say what recall loss to expect.
4. Memory and disk. Estimate resident memory for vectors, payload indexes, and the vector index, then compare against the deployment target. State the assumptions behind the estimate.
5. Replication and sharding. Check the replication factor against the stated failure tolerance, and the shard count against node count and expected growth. Flag a shard count that can't be changed later without a full reindex.
6. Optimizer and write path. Check indexing_threshold, memmap_threshold, and default_segment_number against the ingestion pattern, and say whether the initial bulk load should use different settings from steady state.
7. Consistency and durability. Check write_consistency_factor and the on-disk settings against the durability the workload requires.

Then look for anything that's wrong but not on this list.

Output a table with columns: Area, Severity, Finding, Action. Use severity values Blocker, Recommended, or OK. Sort blockers first. Omit rows that are OK unless there are no blockers at all.

After the table, output the exact API or client calls needed to resolve every blocker, in the order they should be applied. Note which of them require a collection recreation rather than an update.

End with one line: ship or do not ship.
{{< /prompt-template >}}

## What Good Output Looks Like

The table should be short and specific, with severities you can act on and no restatement of the configuration you supplied.

```text
| Area           | Severity    | Finding                              | Action                    |
|----------------|-------------|--------------------------------------|---------------------------|
| Payload index  | Blocker     | tenant_id filtered, no index         | create keyword index      |
| Sharding       | Blocker     | 1 shard, 12M points, growth expected | recreate with 4 shards    |
| Vector index   | Recommended | m=16 global on multitenant set       | m=0, payload_m=16         |

Blocker resolution, in order:
  1. client.create_payload_index(..., field_schema=models.KeywordIndexParams(
         type="keyword", is_tenant=True))          # update, no downtime
  2. Shard count change requires recreation.        # plan a cutover

Do not ship.
```

## Related

- [Production Checklist](/documentation/production-checklist/) covers the same ground as prose you read yourself.
- The `qdrant-sizing` and `qdrant-performance-optimization` [agent skills](/documentation/agentic-tools/skills/) own the reasoning behind the memory and latency findings.
