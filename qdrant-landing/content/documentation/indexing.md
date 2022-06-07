---
title: Indexing
weight: 30
---

A key feature of Qdrant is the effective combination of vector and traditional indices. It is essential to have this because for vector search to work effectively with filters, having vector index only is not enough.

The indexes in the segments exist independently, but the parameters of the indexes themselves are configured for the whole collection.

Not all segments automatically have indexes.
Their necessity is determined by the [optimizer](../optimizer) settings and depends, as a rule, on the number of stored points.


## Payload Index

Payload index in Qdrant is similar to the index in conventional document-oriented databases.
This index is built for a specific field and type and is used for quick point requests by the corresponding filtering condition.

The index is also used to accurately estimate the filter cardinality, which helps the [query planned](../search) choose a search strategy.

Creating an index requires additional computational resources and memory, so choosing fields to be indexed is essential. Qdrant does not make this choice but grants it to the user.

To mark a field as indexable, you can use the following:

```http
PUT /collections/{collection_name}/index

{
    "field_name": "name_of_the_field_to_index",
    "field_type": "keyword"
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.create_payload_index(collection_name="{collection_name}", 
                            field_name="name_of_the_field_to_index", 
                            field_type="keyword")
```

 Available field types are:

 * `keyword` - for [keyword](../payload/#keyword) payload, affects [Match](../filtering/#match) filtering conditions.
 * `integer` - for [integer](../payload/#integer) payload, affects [Match](../filtering/#match) and [Range](../filtering/#range) filtering conditions.
 * `float` - for [float](../payload/#float) payload, affects [Range](../filtering/#range) filtering conditions.
 * `geo` - for [geo](../payload/#geo) payload, affects [Geo Bounding Box](../filtering/#geo-bounding-box) and [Geo Radius](../filtering/#geo-radius) filtering conditions.

For indexing, it is recommended to choose the field that limits the search result the most.
As a rule, the more different values a payload value has, the more efficiently the index will be used.
You should not create an index for Boolean fields and fields with only a few possible values.


## Vector Index

A vector index is a data structure built on vectors through a specific mathematical model.
Through the vector index, we can efficiently query several vectors similar to the target vector.

Qdrant currently only uses HNSW as a vector index.

[HNSW](https://arxiv.org/abs/1603.09320) (Hierarchical Navigable Small World Graph) is a graph-based indexing algorithm. It builds a multi-layer navigation structure for an image according to certain rules. In this structure, the upper layers are more sparse and the distances between nodes are farther. The lower layers are denser and the distances between nodes are closer. The search starts from the uppermost layer, finds the node closest to the target in this layer, and then enters the next layer to begin another search. After multiple iterations, it can quickly approach the target position.

In order to improve performance, HNSW limits the maximum degree of nodes on each layer of the graph to `m`. In addition, you can use `ef_construct` (when building index) or `ef` (when searching targets) to specify a search range.

The corresponding parameters could be configured in the configuration file:

```yaml
storage:
  # Default parameters of HNSW Index. Could be override for each collection individually
  hnsw_index:
    # Number of edges per node in the index graph.
    # Larger the value - more accurate the search, more space required.
    m: 16
    # Number of neighbours to consider during the index building.
    # Larger the value - more accurate the search, more time required to build index.
    ef_construct: 100
    # Minimal size (in KiloBytes) of vectors for additional payload-based indexing.
    # If payload chunk is smaller than `full_scan_threshold_kb` additional indexing won't be used -
    # in this case full-scan search should be preferred by query planner and additional indexing is not required.
    # Note: 1Kb = 1 vector of size 256
    full_scan_threshold: 10000

```

And so in the process of creating a [collection](../collections). The `ef` parameter is configured during [the search](../search) and by default is equal to `ef_construct`.


HNSW is chosen for several reasons.
First, HNSW is well-compatible with the modification that allows Qdrant to use filters during a search.
Second, it is one of the most accurate and fastest algorithms, according to [public benchmarks](https://github.com/erikbern/ann-benchmarks).

## Filtrable Index

Separately, payload index and vector index cannot solve the problem of search using the filter completely.

In the case of weak filters, you can use the HNSW index as it is. In the case of stringent filters, you can use the payload index and complete rescore.
However, for cases in the middle, this approach does not work well.

On the one hand, we cannot apply a full scan on too many vectors. On the other hand, the HNSW graph starts to fall apart when using too strict filters.

![HNSW fail](/docs/precision_by_m.png)

![hnsw graph](/docs/graph.gif)


You can find more information on why this happens in our [blog post](https://blog.vasnetsov.com/posts/categorical-hnsw/).
Qdrant solves this problem by extending the HNSW graph with additional edges based on the stored payload values.

Extra edges allow you to efficiently search for nearby vectors using the HNSW index and apply filters as you search in the graph.

This approach minimizes the overhead on condition checks since you only need to calculate the conditions for a small fraction of the points involved in the search.

