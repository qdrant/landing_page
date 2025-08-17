---
title: Index Optimization
weight: 4
---

{{< date >}} Day 2 {{< /date >}}

# Performance Tuning

Apply your HNSW knowledge by tuning different index configurations and measuring their performance impact.

## Project Overview

In this hands-on project, you'll:

- Create collections with different HNSW parameters
- Benchmark search speed vs accuracy trade-offs
- Measure memory usage across configurations
- Test filtered search performance
- Document optimal settings for your use case

## Your Mission

1. **Set up multiple collections** with different HNSW configurations
2. **Load the same dataset** into each collection
3. **Run benchmark queries** and measure performance
4. **Test filtering scenarios** with complex conditions
5. **Analyze the results** and identify optimal configurations

## Deliverables

- Performance comparison report
- Recommendations for different use cases
- Memory usage analysis
- Filtered search benchmarks

## Getting Started

Use the provided benchmark scripts and modify HNSW parameters like:
- `max_connections` (M parameter)
- `construction_ef` (efConstruction)
- `search_ef` (ef parameter)

*Estimated time: 45-60 minutes*

## Success Criteria

- [ ] Successfully benchmark at least 3 different HNSW configurations
- [ ] Measure and compare search latency
- [ ] Test accuracy vs speed trade-offs
- [ ] Document findings with clear recommendations 