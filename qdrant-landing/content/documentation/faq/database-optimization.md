---
title: Database Optimization
weight: 3
---

## Database Optimization Strategies

### How do I reduce memory usage?

Quantization retains the original vector, but you can reduce the memory usage. Read more about leveraging the [Quantization](../../guides/quantization/) feature.

### How do I tune search accuracy while controlling for memory usage?

Accuracy tuning tips show you how to adjust quantile parameters and rescoring. Get some helpful tips [here](../../guides/quantization/#quantization-tips)

### How do I measure memory requirements?

Read more about the minimal RAM required to serve vectors with Qdrant. Read more about [Memory Consumption](../../../articles/memory-consumption/).

### How do I optimize speed search while retaining low memory use?

Use Vector Quantization or disable rescoring. Both will reduce disk reads. Read more about [optimizing Qdrant](../../tutorials/optimize).

### How do I avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consequent versions. You would need to upgrade versions one at a time 1.1 -> 1.2 then 1.2 -> 1.3 then 1.3 -> 1.4.

### Do you guarantee compatibility across versions?
In case your version is older, we guarantee only compatibility between two consecutive minor versions.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

### My database fails and memory usage is high. 

Measuring memory consumption with htop or other tools won't provide accurate numbers. Test by limiting memory instead and see when it fails.

