---
title: Indexing
weight: 90
aliases:
  - ../indexing
---

# Indexing

A key feature of Qdrant is the effective combination of vector and traditional indexes. It is essential to have this because for vector search to work effectively with filters, having vector index only is not enough. In simpler terms, a vector index speeds up vector search, and payload indexes speed up filtering.

The indexes in the segments exist independently, but the parameters of the indexes themselves are configured for the whole collection.

Not all segments automatically have indexes.
Their necessity is determined by the [optimizer](/documentation/concepts/optimizer/) settings and depends, as a rule, on the number of stored points.

## Payload Index

Payload index in Qdrant is similar to the index in conventional document-oriented databases.
This index is built for a specific field and type, and is used for quick point requests by the corresponding filtering condition.

The index is also used to accurately estimate the filter cardinality, which helps the [query planning](/documentation/concepts/search/#query-planning) choose a search strategy.

Creating an index requires additional computational resources and memory, so choosing fields to be indexed is essential. Qdrant does not make this choice but grants it to the user.

To mark a field as indexable, you can use the following:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/simple-keyword/" >}}

You can use dot notation to specify a nested field for indexing. Similar to specifying [nested filters](/documentation/concepts/filtering/#nested-key).

Available field types are:

* `keyword` - for [keyword](/documentation/concepts/payload/#keyword) payload, affects [Match](/documentation/concepts/filtering/#match) filtering conditions.
* `integer` - for [integer](/documentation/concepts/payload/#integer) payload, affects [Match](/documentation/concepts/filtering/#match) and [Range](/documentation/concepts/filtering/#range) filtering conditions.
* `float` - for [float](/documentation/concepts/payload/#float) payload, affects [Range](/documentation/concepts/filtering/#range) filtering conditions.
* `bool` - for [bool](/documentation/concepts/payload/#bool) payload, affects [Match](/documentation/concepts/filtering/#match) filtering conditions (available as of v1.4.0).
* `geo` - for [geo](/documentation/concepts/payload/#geo) payload, affects [Geo Bounding Box](/documentation/concepts/filtering/#geo-bounding-box) and [Geo Radius](/documentation/concepts/filtering/#geo-radius) filtering conditions.
* `datetime` - for [datetime](/documentation/concepts/payload/#datetime) payload, affects [Range](/documentation/concepts/filtering/#range) filtering conditions (available as of v1.8.0).
* `text` - a special kind of index, available for [keyword](/documentation/concepts/payload/#keyword) / string payloads, affects [Full Text search](/documentation/concepts/filtering/#full-text-match) filtering conditions.
* `uuid` - a special type of index, similar to `keyword`, but optimized for [UUID values](/documentation/concepts/payload/#uuid).
Affects [Match](/documentation/concepts/filtering/#match) filtering conditions. (available as of v1.11.0)

Payload index may occupy some additional memory, so it is recommended to only use index for those fields that are used in filtering conditions.
If you need to filter by many fields and the memory limits does not allow to index all of them, it is recommended to choose the field that limits the search result the most.
As a rule, the more different values a payload value has, the more efficiently the index will be used.

### Full-text index

*Available as of v0.10.0*

Qdrant supports full-text search for string payload.
Full-text index allows you to filter points by the presence of a word or a phrase in the payload field.

Full-text index configuration is a bit more complex than other indexes, as you can specify the tokenization parameters.
Tokenization is the process of splitting a string into tokens, which are then indexed in the inverted index.

To create a full-text index, you can use the following:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/simple-full-text/" >}}

Available tokenizers are:

* `word` - splits the string into words, separated by spaces, punctuation marks, and special characters.
* `whitespace` - splits the string into words, separated by spaces.
* `prefix` - splits the string into words, separated by spaces, punctuation marks, and special characters, and then creates a prefix index for each word. For example: `hello` will be indexed as `h`, `he`, `hel`, `hell`, `hello`.
* `multilingual` - special type of tokenizer based on [charabia](https://github.com/meilisearch/charabia) package. It allows proper tokenization and lemmatization for multiple languages, including those with non-latin alphabets and non-space delimiters. See [charabia documentation](https://github.com/meilisearch/charabia) for full list of supported languages supported normalization options. In the default build configuration, qdrant does not include support for all languages, due to the increasing size of the resulting binary. Chinese, Japanese and Korean languages are not enabled by default, but can be enabled by building qdrant from source with `--features multiling-chinese,multiling-japanese,multiling-korean` flags. 

See [Full Text match](/documentation/concepts/filtering/#full-text-match) for examples of querying with full-text index.

### Parameterized index

*Available as of v1.8.0*

We've added a parameterized variant to the `integer` index, which allows
you to fine-tune indexing and search performance.

Both the regular and parameterized `integer` indexes use the following flags:

- `lookup`: enables support for direct lookup using
  [Match](/documentation/concepts/filtering/#match) filters.
- `range`: enables support for
  [Range](/documentation/concepts/filtering/#range) filters.

The regular `integer` index assumes both `lookup` and `range` are `true`. In
contrast, to configure a parameterized index, you would set only one of these
filters to `true`:

| `lookup` | `range` | Result                      |
|----------|---------|-----------------------------|
| `true`   | `true`  | Regular integer index       |
| `true`   | `false` | Parameterized integer index |
| `false`  | `true`  | Parameterized integer index |
| `false`  | `false` | No integer index            |

The parameterized index can enhance performance in collections with millions
of points. We encourage you to try it out. If it does not enhance performance
in your use case, you can always restore the regular `integer` index.

Note: If you set `"lookup": true` with a range filter, that may lead to
significant performance issues.

For example, the following code sets up a parameterized integer index which
supports only range filters:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/integer-with-params/" >}}

### On-disk payload index

*Available as of v1.11.0*

By default all payload-related structures are stored in memory. In this way, the vector index can quickly access payload values during search.
As latency in this case is critical, it is recommended to keep hot payload indexes in memory.

There are, however, cases when payload indexes are too large or rarely used. In those cases, it is possible to store payload indexes on disk.

<aside role="alert">
    On-disk payload index might affect cold requests latency, as it requires additional disk I/O operations.
</aside>

To configure on-disk payload index, you can use the following index parameters:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/keyword-on-disk/" >}}

Payload index on-disk is supported for following types:

* `keyword`
* `integer`
* `float`
* `datetime`
* `uuid`
* `text`
* `geo`

The list will be extended in future versions.

### Tenant Index

*Available as of v1.11.0*

Many vector search use-cases require multitenancy. In a multi-tenant scenario the collection is expected to contain multiple subsets of data, where each subset belongs to a different tenant. 

Qdrant supports efficient multi-tenant search by enabling [special configuration](/documentation/guides/multiple-partitions/) vector index, which disables global search and only builds sub-indexes for each tenant.

<aside role="note">
    In Qdrant, tenants are not necessarily non-overlapping. It is possible to have subsets of data that belong to multiple tenants.
</aside>

However, knowing that the collection contains multiple tenants unlocks more opportunities for optimization.
To optimize storage in Qdrant further, you can enable tenant indexing for payload fields.

This option will tell Qdrant which fields are used for tenant identification and will allow Qdrant to structure storage for faster search of tenant-specific data.
One example of such optimization is localizing tenant-specific data closer on disk, which will reduce the number of disk reads during search.

To enable tenant index for a field, you can use the following index parameters:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/keyword-is-tenant/" >}}

Tenant optimization is supported for the following datatypes:

* `keyword`
* `uuid`

### Principal Index

*Available as of v1.11.0*

Similar to the tenant index, the principal index is used to optimize storage for faster search, assuming that the search request is primarily filtered by the principal field.

A good example of a use case for the principal index is time-related data, where each point is associated with a timestamp. In this case, the principal index can be used to optimize storage for faster search with time-based filters.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/integer-is-principal/" >}}

Principal optimization is supported for following types:

* `integer`
* `float`
* `datetime`


## Vector Index

A vector index is a data structure built on vectors through a specific mathematical model.
Through the vector index, we can efficiently query several vectors similar to the target vector.

Qdrant currently only uses HNSW as a dense vector index.

[HNSW](https://arxiv.org/abs/1603.09320) (Hierarchical Navigable Small World Graph) is a graph-based indexing algorithm. It builds a multi-layer navigation structure for an image according to certain rules. In this structure, the upper layers are more sparse and the distances between nodes are farther. The lower layers are denser and the distances between nodes are closer. The search starts from the uppermost layer, finds the node closest to the target in this layer, and then enters the next layer to begin another search. After multiple iterations, it can quickly approach the target position.

In order to improve performance, HNSW limits the maximum degree of nodes on each layer of the graph to `m`. In addition, you can use `ef_construct` (when building index) or `ef` (when searching targets) to specify a search range.

The corresponding parameters could be configured in the configuration file:

```yaml
storage:
  # Default parameters of HNSW Index. Could be overridden for each collection or named vector individually
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

And so in the process of creating a [collection](/documentation/concepts/collections/). The `ef` parameter is configured during [the search](/documentation/concepts/search/) and by default is equal to `ef_construct`.

HNSW is chosen for several reasons.
First, HNSW is well-compatible with the modification that allows Qdrant to use filters during a search.
Second, it is one of the most accurate and fastest algorithms, according to [public benchmarks](https://github.com/erikbern/ann-benchmarks).

*Available as of v1.1.1*

The HNSW parameters can also be configured on a collection and named vector
level by setting [`hnsw_config`](/documentation/concepts/indexing/#vector-index) to fine-tune search
performance.

## Sparse Vector Index

*Available as of v1.7.0*

Sparse vectors in Qdrant are indexed with a special data structure, which is optimized for vectors that have a high proportion of zeroes. In some ways, this indexing method is similar to the inverted index, which is used in text search engines.

- A sparse vector index in Qdrant is exact, meaning it does not use any approximation algorithms.
- All sparse vectors added to the collection are immediately indexed in the mutable version of a sparse index.

With Qdrant, you can benefit from a more compact and efficient immutable sparse index, which is constructed during the same optimization process as the dense vector index.

This approach is particularly useful for collections storing both dense and sparse vectors.

To configure a sparse vector index, create a collection with the following parameters:

{{< code-snippet path="/documentation/headless/snippets/create-collection/sparse-vector-index-on-disk/" >}}`

The following parameters may affect performance:

- `on_disk: true` - The index is stored on disk, which lets you save memory. This may slow down search performance. 
- `on_disk: false` - The index is still persisted on disk, but it is also loaded into memory for faster search.

Unlike a dense vector index, a sparse vector index does not require a pre-defined vector size. It automatically adjusts to the size of the vectors added to the collection.

**Note:** A sparse vector index only supports dot-product similarity searches. It does not support other distance metrics.

### IDF Modifier

*Available as of v1.10.0*

For many search algorithms, it is important to consider how often an item occurs in a collection.
Intuitively speaking, the less frequently an item appears in a collection, the more important it is in a search. 

This is also known as the Inverse Document Frequency (IDF). It is used in text search engines to rank search results based on the rarity of a word in a collection.

IDF depends on the currently stored documents and therefore can't be pre-computed in the sparse vectors in streaming inference mode.
In order to support IDF in the sparse vector index, Qdrant provides an option to modify the sparse vector query with the IDF statistics automatically.

The only requirement is to enable the IDF modifier in the collection configuration:

{{< code-snippet path="/documentation/headless/snippets/create-collection/sparse-vector-idf/" >}}

Qdrant uses the following formula to calculate the IDF modifier:

$$
\text{IDF}(q_i) = \ln \left(\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5}+1\right)
$$

Where:

- `N` is the total number of documents in the collection.
- `n` is the number of documents containing non-zero values for the given vector element.

## Filtrable Index

Separately, a payload index and a vector index cannot solve the problem of search using the filter completely.

In the case of weak filters, you can use the HNSW index as it is. In the case of stringent filters, you can use the payload index and complete rescore.
However, for cases in the middle, this approach does not work well.

On the one hand, we cannot apply a full scan on too many vectors. On the other hand, the HNSW graph starts to fall apart when using too strict filters.

![HNSW fail](/docs/precision_by_m.png)

![hnsw graph](/docs/graph.gif)

You can find more information on why this happens in our [blog post](https://blog.vasnetsov.com/posts/categorical-hnsw/).
Qdrant solves this problem by extending the HNSW graph with additional edges based on the stored payload values.

Extra edges allow you to efficiently search for nearby vectors using the HNSW index and apply filters as you search in the graph.

This approach minimizes the overhead on condition checks since you only need to calculate the conditions for a small fraction of the points involved in the search.
