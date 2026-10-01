---
label: Where it helps less
title: Filterable HNSW across deployment modes
description: Not sure whether this fits your workload? Talk to us and we'll tell you honestly.
cols:
  - id: managed-cloud
    name: Managed Cloud
  - id: hybrid-cloud
    name: Hybrid Cloud
  - id: private-cloud
    name: Private Cloud
features:
  - name: Filter Execution Strategy
    managed-cloud: The index is also used to accurately estimate the filter cardinality, which helps the query planning choose a search strategy.
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
  - name: HNSW Index Configuration
    managed-cloud: To rebuild an HNSW index, make a small change to its HNSW configuration, for example by bumping efconstruct by 1.
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
  - name: Memory Layout and On-Disk Options
    managed-cloud: 'High Precision + Low Memory: Store vectors and HNSW index on disk.'
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
  - name: Recall and Accuracy Under Filtering
    managed-cloud: This index is built for a specific field and type, and is used for quick point requests by the corresponding filtering condition.
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
  - name: Payload Index Design for Filtering
    managed-cloud: In simpler terms, a vector index speeds up vector search, and payload indexes speed up filtering.
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
  - name: Scale and Performance Limits
    managed-cloud: This improves search accuracy at the cost of performance.
    hybrid-cloud: Same as Managed Cloud
    private-cloud: Same as Managed Cloud
button:
  text: Read the filterable-hnsw docs →
  url: https://qdrant.tech/documentation/ops-optimization/optimize/#fine-tuning-search-parameters
sitemapExclude: true
---
