---
title: "Welcome to Qdrant 1.8.0!"
draft: false
slug: qdrant-1.8.x 
short_description: "Look at what's new in Qdrant 1.8.0!"
description: "Sparse vector performance, Text index loading optimization, Text immutability, Dynamic CPU saturation" 
preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
title_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
small_preview_image: /blog/qdrant-1.8.x/qdrant-1.8.0.png
date: 2024-02-26T11:12:00-08:00
author: Mike Jang
featured: false 
tags:
  - vector search
  - new features
  - sparse vector performance
  - dymamic CPU saturation
  - text immutability
  - text loading optimization
weight: 0 # Change this weight to change order of posts
---

[Qdrant 1.8.0 is out!](https://github.com/qdrant/qdrant/releases/tag/v1.8.0).
This time around, we have focused on Qdrant's internals. Our goal was to optimize performance, so that your existing setup can run faster and conserve resources. 

- **Faster search with sparse vectors:** Hybrid search is even faster than before!
- **Faster indexing via CPU resource management:** Now you can allocate dedicated CPU threads to indexing. 
- **Better indexing performance for text data:** Text indexing is more efficient on the backend.

## Faster search with sparse vectors

Search throughput is now up to 16 times faster for sparse vectors. If you are using our hybrid search, this means that Qdrant can now handle up to sixteen times as many queries. This improvement comes from extensive backend optimizations aimed at increasing efficiency and capacity. Our goal was to make sure that you can handle up to 10M vectors in a realistic scenario.

What this means for your setup:

- **Query Speed:** The time it takes to run a search query has been significantly reduced. 
- **Search Capacity:** Qdrant can now handle a much larger volume of search requests.
- **User Experience:** Results will appear faster, leading to a smoother experience for the user.
- **Scalability:** You can easily accomodate rapidly growing users or an expanding dataset.

### Sparse vectors benchmark

Performance results are publicly available for you to test. Qdrant's R&D developed a dedicated [open-source benchmarking tool](https://github.com/qdrant/sparse-vectors-benchmark) just to test sparse vector performance.

A real-life simulation of sparse vector queries was run against the [NeurIPS 2023 dataset](https://big-ann-benchmarks.com/neurips23.html). All tests were done on an 8 CPU machine on Azure. 

Latency (y-axis) has dropped significantly for queries. You can see the before/after here:

![dropping latency](/blog/qdrant-1.8.x/benchmark.png)
**Figure 1:** Dropping latency in sparse vector search queries across versions 1.7-1.8.

The colors within the scatter plot show the frequency of the results. Frequency is highest where the red dots are. This tells us that latency for sparse vectors queries dropped by a factor of 16. Therefore, the time it takes to retrieve an answer with Qdrant is that much shorter. 

This performance increase can have a dramatic effect on hybrid search implementations. [Read more about how to set this up.](https://qdrant.tech/articles/sparse-vectors/)

FYI, sparse vectors were released in [Qdrant v.1.7.0](https://qdrant.tech/articles/qdrant-1.7.x/#sparse-vectors). They are stored using a different index, so first check out the documentation if you want to try an implementation.

## CPU Resource Management

Indexing is Qdrant’s most resource-intensive process. Now you can account for this by allocating compute use specifically to indexing. You can assign a number CPU resources towards indexing and leave the rest for search. As a result, indexes will build faster, and search quality will remain unaffected.

This isn't mandatory, as Qdrant is by default tuned to strike the right balance between indexing and search. However, if you wish to define specific CPU usage, you will need to do so from `config.yaml`.

This version introduces a `optimizer_cpu_budget` parameter to control the maximum number of CPUs used for indexing. 

> Read more about `config.yaml` in the [Configuration document](https://qdrant.tech/documentation/guides/configuration/).

```yaml
    optimizer_cpu_budget: 0
   # CPU budget, how many CPUs (threads) to allocate for an optimization job.
```
- If left at 0, Qdrant will keep 1 or more CPUs unallocated - depending on CPU size.
- If the setting is positive, Qdrant will use this exact number of CPUs for indexing.
- If the setting is negative, Qdrant will subtract this number of CPUs from the available CPUs for indexing.

For most users, the default `optimizer_cpu_budget` setting will work well. We only recommend you use this if your indexing load is significant.

![CPU management](/blog/qdrant-1.8.x/cpu-management.png)
**Figure 2:** Allocating additional resources towards indexing.

Our backend leverages dynamic CPU saturation to increase indexing speed. For that reason, there will be absolutely no impact on search query performance.

This configuration can be done at any time, but it requires a restart of Qdrant. Changing it affects both existing and new collections. Note that it cannot be changed on Qdrant Cloud, because users don't have access to the configuration.

## Better indexing for text data

In order to minimize your RAM expenditure, we have developed a new way to index specific types of data. Please keep in mind that this is a backend improvement, and you won't need to configure anything. 

> Going forward, if you are indexing immutable text fields, we estimate a 10% reduction in RAM loads. Our benchmark result is based on a system that uses 64GB of RAM. If you are using less than that, indexing might be faster than 10%.

Immutable text fields are static and do not change once they are added to Qdrant. These entries usually represent some type of an attribute, description or a tag. Vectors associated with them can be indexed more efficiently, since you don’t need to re-index them anymore. Conversely, mutable fields are dynamic and can be modified after their initial creation. Please keep in mind that they will continue to require additional RAM.

This approach ensures stability in the vector search index, with faster and more consistent operations. We achieved this by setting up a field index which helps minimize what is stored. To improve search performance we have also optimized the way we load documents for searches with a text field index. Now our backend loads documents mostly sequentially and in increasing order.


## Minor improvements and new features

Beyond these enhancements, Qdrant v1.8.0 adds and improves several features:

<!-- Requires merging https://github.com/qdrant/landing_page/pull/631 -->
1. You can now use Scroll API to [order points by payload key](/documentation/concepts/points/#order-points-by-a-payload-key).
2. We have implemented [date / time support for the payload index](https://github.com/qdrant/qdrant/issues/3320). 
Prior to this, if users wanted to search for specific data / time range, Qdrant had to convert dates to UNIX timestamps.
3. Added `/exists` to the `/collections/{collection_name}` endpoint for a true/false response to verify if a collection is there ([PR#3472](https://github.com/qdrant/qdrant/pull/3472)).
4. Included `min_should` match feature for a condition to be `true` ([PR#3331](https://github.com/qdrant/qdrant/pull/3466/)).
5. Improved `set_payload` API, adding the ability to modify nested fields ([PR#3548](https://github.com/qdrant/qdrant/pull/3548).

## Release notes
<!-- The link won't work until we create v1.8.0 release notes -->

For more information, see [our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.8.0). 
Qdrant is an open source project. We welcome your contributions; raise [issues](https://github.com/qdrant/qdrant/issues), or contribute via [pull requests](https://github.com/qdrant/qdrant/pulls)!
