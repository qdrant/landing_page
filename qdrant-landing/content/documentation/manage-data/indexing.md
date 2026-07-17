---
title: Indexing
short_description: "Combine HNSW vector indexes with payload indexes in Qdrant for fast filtered search across structured fields."
description: "Configure HNSW vector indexes and payload indexes in Qdrant to accelerate similarity search with filters on structured fields and high-cardinality metadata."
weight: 30
aliases:
  - ../indexing
---

# Indexing

A key feature of Qdrant is the effective combination of vector and traditional indexes. It is essential to have this because for vector search to work effectively with filters, having a vector index only is not enough. In simpler terms, a vector index speeds up vector search, and payload indexes speed up filtering.

The indexes in the segments exist independently, but the parameters of the indexes themselves are configured for the whole collection.

Not all segments automatically have indexes.
Their necessity is determined by the [optimizer](/documentation/ops-optimization/optimizer/) settings and depends, as a rule, on the number of stored points.

## Payload Index

Payload index in Qdrant is similar to the index in conventional document-oriented databases.
This index is built for a specific field and type, and is used for quick point requests by the corresponding filtering condition. The index is also used to accurately estimate the filter cardinality, which helps the [query planning](/documentation/search/search/#query-planning) choose a search strategy.

Creating an index requires additional computational resources and memory, so choosing fields to be indexed is essential. Qdrant does not make this choice but grants it to the user.

The following field types support payload indexing:

* `keyword` - for [keyword](/documentation/manage-data/payload/#keyword) payload, affects [Match](/documentation/search/filtering/#match) filtering conditions. Can optionally enable [prefix matching](#keyword-index).
* `integer` - for [integer](/documentation/manage-data/payload/#integer) payload, affects [Match](/documentation/search/filtering/#match) and [Range](/documentation/search/filtering/#range) filtering conditions.
* `float` - for [float](/documentation/manage-data/payload/#float) payload, affects [Range](/documentation/search/filtering/#range) filtering conditions.
* `bool` - for [bool](/documentation/manage-data/payload/#bool) payload, affects [Match](/documentation/search/filtering/#match) filtering conditions (available as of v1.4.0).
* `geo` - for [geo](/documentation/manage-data/payload/#geo) payload, affects [Geo Bounding Box](/documentation/search/filtering/#geo-bounding-box) and [Geo Radius](/documentation/search/filtering/#geo-radius) filtering conditions.
* `datetime` - for [datetime](/documentation/manage-data/payload/#datetime) payload, affects [Range](/documentation/search/filtering/#range) filtering conditions (available as of v1.8.0).
* `text` - a special kind of index, available for [keyword](/documentation/manage-data/payload/#keyword) / string payloads, affects [Full Text search](/documentation/search/filtering/#full-text-match) filtering conditions. Read more about [text index configuration](#full-text-index)
* `uuid` - a special type of index, similar to `keyword`, but optimized for [UUID values](/documentation/manage-data/payload/#uuid).
Affects [Match](/documentation/search/filtering/#match) filtering conditions. (available as of v1.11.0)

Payload indexes occupy additional memory and disk space, so it is recommended to only apply payload indexes for those fields that are used in filtering conditions.
If you need to filter by many fields and the memory limits do not allow for indexing all of them, it is recommended to choose the field that limits the search result the most.
As a rule, the more different values a payload value has, the more efficiently the index will be used.

### Create a Payload Index

To create a payload index for a field:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/simple-keyword/" >}}

You can use dot notation to specify a nested field for indexing. Similar to specifying [nested filters](/documentation/search/filtering/#nested-key).

**Payload indexes should be created before ingesting data.** [Qdrant's filterable HNSW index](#filterable-hnsw-index) only benefits from additional filter-aware edges when it is generated after the payload indexes have been created. If you create a payload index after data has already been ingested, you need to [rebuild the HNSW index](#rebuild-the-hnsw-index) to take advantage of the new payload indexes.

### Block Queries That Filter on Unindexed Fields

Queries that filter on unindexed fields are not only slower; they can also unnecessarily consume cluster resources, negatively impacting the latency of other search queries. To prevent that, Qdrant provides an option to block queries that filter on unindexed fields. This gives you:

- Fail-fast behavior: Queries that would degrade performance are rejected at the API boundary, surfacing misconfigured indexes as errors rather than latency spikes.
- Performance guarantees: Every query that succeeds is backed by an index, preventing accidental filters on unindexed fields from reaching production.
- Operational visibility: Without strict mode, a missing index might go unnoticed for a long time because queries still return results, albeit slowly.


To block queries that filter on unindexed fields, enable [strict mode](/documentation/ops-configuration/administration/#strict-mode) and set `unindexed_filtering_retrieve` to `false`. Qdrant will then return an error if a search query attempts to filter on an unindexed field. On Qdrant Cloud, these settings are applied to all collections by default.

For more information, refer to [Disable Retrieving via Non Indexed Payload](/documentation/ops-configuration/administration/#disable-retrieving-via-non-indexed-payload).

### Parameterized Index

Beyond selecting the field type, you can set parameters on a payload index to fine-tune how it is stored and which filtering conditions it can serve. The available parameters depend on the field type, and are described in the subsections below.

#### Integer Index

*Available as of v1.8.0*

The parameterized variant of the `integer` index allows you to fine-tune indexing and search performance.

Parameterized `integer` indexes use the following flags:

- `lookup`: enables support for direct lookup using
 [Match](/documentation/search/filtering/#match) filters.
- `range`: enables support for
 [Range](/documentation/search/filtering/#range) filters.

The `integer` index assumes both `lookup` and `range` are `true` by default.
To configure a parameterized index, set only one of these filters to `true`:

| `lookup` | `range` | Result                      |
|----------|---------|-----------------------------|
| `true` | `true` | Default behavior for integer indices       |
| `true` | `false` | Parameterized integer index |
| `false` | `true` | Parameterized integer index |
| `false` | `false` | No integer index            |

Setting `lookup` or `range` to `false` may help to tune and reduce memory usage
in large collections. We encourage you to try out if setting either to `false`
improves memory usage. If you don't see an improvement or if you're not sure
what kind of payload filters you're using, use the regular `integer` index.

Note: If you set `"range": false` and still use a range filter, it may lead to
significant performance issues. The same is true for the lookup parameter and
its respective filters.

For example, the following code sets up a parameterized integer index which
supports only range filters:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/integer-with-params/" >}}

#### Keyword Index

*Available as of v1.19.0*

By default, a `keyword` index only supports exact [Match](/documentation/search/filtering/#match) conditions. Set the `prefix` flag to `true` to additionally enable prefix matching, so that you can filter for keyword values that start with a given string using the [Prefix Match](/documentation/search/filtering/#prefix-match) condition.

This is useful for prefix filtering over identifier-like values such as URLs, paths, or SKUs, and for building filter-value autocompletion (for example, combining a facet request with a prefix filter on the same field). A `text` index is not a good fit for these cases: tokenization breaks identifiers apart, and a `text` schema loses exact keyword matching.

<aside role="alert">
    This is unrelated to the full-text <code>prefix</code> <a href="#tokenizers">tokenizer</a>. The tokenizer builds prefixes of the individual words of a <code>text</code> index, while this flag enables prefix matching over whole <code>keyword</code> values.
</aside>

To enable prefix matching, set the `prefix` flag to `true` when creating a keyword index:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/keyword-with-prefix/" >}}

Enabling `prefix` builds a dedicated index structure, so prefix filters on the field are served by the index and are as fast as other indexed filters. Matching is byte-wise (hence, for valid UTF-8, character-wise) and case-sensitive, consistent with exact keyword matching.

The `prefix` flag can be enabled on a new index. Enabling it on an existing keyword index triggers a full rebuild of the index, because the schema is incompatible with the previous one.

When [strict mode](/documentation/ops-configuration/administration/#strict-mode) is enabled with `unindexed_filtering_retrieve` or `unindexed_filtering_update` set to `false`, a prefix condition on a field that does not have a prefix-enabled keyword index is rejected.

#### On-Disk Payload Index

*Available as of v1.11.0*

By default all payload-related structures are stored in memory. In this way, the vector index can quickly access payload values during search.
As latency in this case is critical, it is recommended to keep hot payload indexes in memory.

There are, however, cases when payload indexes are too large or rarely used. In those cases, it is possible to store payload indexes on disk.

<aside role="alert">
 On-disk payload index might affect cold requests latency, as it requires additional disk I/O operations.
</aside>

To configure on-disk payload index, you can use the following index parameters:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/keyword-on-disk/" >}}

Payload index on-disk is supported for the following types:

* `keyword`
* `integer`
* `float`
* `datetime`
* `uuid`
* `text`
* `geo`

The list will be extended in future versions.

#### Tenant Index

*Available as of v1.11.0*

Many vector search use-cases require multitenancy. In a multi-tenant scenario the collection is expected to contain multiple subsets of data, where each subset belongs to a different tenant.

Qdrant supports efficient multi-tenant search by enabling [special configuration](/documentation/manage-data/multitenancy/) vector index, which disables global search and only builds sub-indexes for each tenant.

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

#### Principal Index

*Available as of v1.11.0*

Similar to the tenant index, the principal index is used to optimize storage for faster search, assuming that the search request is primarily filtered by the principal field.

A good example of a use case for the principal index is time-related data, where each point is associated with a timestamp. In this case, the principal index can be used to optimize storage for faster search with time-based filters.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/integer-is-principal/" >}}

Principal optimization is supported for following types:

* `integer`
* `float`
* `datetime`

## Full-Text Index

Qdrant supports full-text search for string payload.
Full-text index allows you to filter points by the presence of a word or a phrase in the payload field.

Full-text index configuration is a bit more complex than other indexes, as you can specify the tokenization parameters.
Tokenization is the process of splitting a string into tokens, which are then indexed in the inverted index.

See [Full Text match](/documentation/search/filtering/#full-text-match) for examples of querying with a full-text index.

To create a full-text index, you can use the following:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/simple-full-text/" >}}

### Tokenizers

Tokenizers are algorithms used to split text into smaller units called tokens, which are then indexed and searched in a full-text index.
In the context of Qdrant, tokenizers determine how string payloads are broken down for efficient searching and filtering.
The choice of tokenizer affects how queries match the indexed text, supporting different languages, word boundaries, and search behaviours such as prefix or phrase matching.

Available tokenizers are:

* `word` (default) - splits the string into words, separated by spaces, punctuation marks, and special characters.
* `whitespace` - splits the string into words, separated by spaces.
* `prefix` - splits the string into words, separated by spaces, punctuation marks, and special characters, and then creates a prefix index for each word. For example: `hello` will be indexed as `h`, `he`, `hel`, `hell`, `hello`.
* `multilingual` - a special type of tokenizer based on multiple packages like [charabia](https://github.com/meilisearch/charabia) and [vaporetto](https://github.com/daac-tools/vaporetto) to deliver fast and accurate tokenization for a large variety of languages. It allows proper tokenization and lemmatization for multiple languages, including those with non-Latin alphabets and non-space delimiters. See the [charabia documentation](https://github.com/meilisearch/charabia) for a full list of supported languages and normalization options. Note: For the Japanese language, Qdrant relies on the `vaporetto` project, which has much less overhead compared to `charabia`, while maintaining comparable performance.

### Lowercasing

By default, full-text search in Qdrant is case-insensitive. For example, users can search for the lowercase term `tv` and find text fields containing the uppercase word `TV`. Case-insensitivity is achieved by converting both the words in the index and the query terms to lowercase.

Lowercasing is enabled by default. To use case-sensitive full-text search, configure a full-text index with `lowercase` set to `false`.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/lowercase-full-text/" >}}

### ASCII Folding

*Available as of v1.16.0*

When enabled, ASCII folding converts Unicode characters into their corresponding ASCII equivalents, for example, by removing diacritics. For instance, the character `ã` is changed into `a`, `ç` becomes `c`, and `é` is converted to `e`.

Because ASCII folding is applied to both the words in the index and the query terms, it increases recall. For example, users can search for `cafe` and also find text fields containing the word `café`.

ASCII folding is not enabled by default. To enable it, configure a full-text index with `ascii_folding` set to `true`.

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/asciifolding-full-text/" >}}

### Stemmer

A **stemmer** is an algorithm used in text processing to reduce words to their root or base form, known as the "stem." For example, the words "running", "runner and "runs" can all be reduced to the stem "run." 
When configuring a full-text index in Qdrant, you can specify a stemmer to be used for a particular language. This enables the index to recognize and match different inflections or derivations of a word.

Qdrant provides an implementation of [Snowball stemmer](https://snowballstem.org/), a widely used and performant variant for some of the most popular languages.
For the list of supported languages, please visit the [rust-stemmers repository](https://github.com/qdrant/rust-stemmers).

For full-text indices, stemming is not enabled by default. To enable it, configure the `snowball` stemmer with the desired language:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/stemmer-full-text/" >}}

### Stopwords

Stopwords are common words (such as "the", "is", "at", "which", and "on") that are often filtered out during text processing because they carry little meaningful information for search and retrieval tasks.

In Qdrant, you can specify a list of stopwords to be ignored during full-text indexing and search. This helps simplify search queries and improves relevance.

You can configure stopwords based on predefined languages, as well as extend existing stopword lists with custom words.

For full-text indices, stopword removal is not enabled by default. To enable it, configure the `stopwords` parameter with the desired languages and any custom stopwords:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/stopwords-full-text/" >}}

### Phrase Search

Phrase search in Qdrant allows you to find documents or points where a specific sequence of words appears together, in the same order, within a text payload field.
This is useful when you want to match exact phrases rather than individual words scattered throughout the text.

When using a full-text index with phrase search enabled, you can perform phrase search by enclosing the desired phrase in double quotes in your filter query.
For example, searching for `"machine learning"` will only return results where the words "machine" and "learning" appear together as a phrase, not just anywhere in the text.

For efficient phrase search, Qdrant requires building an additional data structure, so it needs to be configured during the creation of the full-text index:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/phrase-full-text/" >}}

See [Phrase Match](/documentation/search/filtering/#phrase-match) for examples of querying phrases with a full-text index.


## Vector Index

A vector index is a data structure built on vectors through a specific mathematical model.
Through the vector index, we can efficiently query several vectors similar to the target vector.

Qdrant currently only uses HNSW as a dense vector index.

[HNSW](https://arxiv.org/abs/1603.09320) (Hierarchical Navigable Small World Graph) is a graph-based indexing algorithm. It builds a multi-layer navigation structure for an image according to certain rules. In this structure, the upper layers are more sparse and the distances between nodes are farther. The lower layers are denser and the distances between nodes are closer. The search starts from the uppermost layer, finds the node closest to the target in this layer, and then enters the next layer to begin another search. After multiple iterations, it can quickly approach the target position.

In order to improve performance, HNSW limits the maximum degree of nodes on each layer of the graph to `m`. In addition, you can use `ef_construct` (when building an index) or `ef` (when searching targets) to specify a search range.

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
    # Minimal size threshold (in KiloBytes) below which full-scan is preferred over HNSW search.
    # This measures the total size of vectors being queried against.
    # When the maximum estimated amount of points that a condition satisfies is smaller than
    # `full_scan_threshold_kb`, the query planner will use full-scan search instead of HNSW index
    # traversal for better performance.
    # Note: 1Kb = 1 vector of size 256
    full_scan_threshold: 10000

```

And so in the process of creating a [collection](/documentation/manage-data/collections/). The `ef` parameter is configured during [the search](/documentation/search/search/) and by default is equal to `ef_construct`.

HNSW is chosen for several reasons.
First, HNSW is well-compatible with the modification that allows Qdrant to use filters during a search.
Second, it is one of the most accurate and fastest algorithms, according to [public benchmarks](https://github.com/erikbern/ann-benchmarks).

*Available as of v1.1.1*

The HNSW parameters can also be configured on a collection and named vector
level by setting [`hnsw_config`](/documentation/manage-data/indexing/#vector-index) to fine-tune search
performance.

### Filterable HNSW Index

Separately, a payload index and a vector index cannot completely address the challenges of filtered search.

In the case of high-selectivity (weak) filters, you can use the HNSW index as it is.
In the case of low-selectivity (strict) filters, you can use the payload index and do a complete rescore.
However, for cases in the middle, this approach does not work well.
On one hand, we cannot apply a full scan on too many vectors.
On the other hand, the HNSW graph starts to fall apart when using filters that are too strict.

![HNSW fail](/docs/precision_by_m.png)

<!-- ![hnsw graph](/docs/graph.gif) -->

Qdrant solves this problem by extending the HNSW graph with additional edges based on indexed payload values.
Extra edges allow you to efficiently search for nearby vectors using the HNSW index and apply filters as you search in the graph.
You can find more information on this approach in our [article](/articles/filterable-hnsw/).

<aside role="status">For the HNSW graph to be optimized for filtered search, it's highly recommended to create all payload indices immediately after collection creation, before ingesting data. Extra edges for the HNSW graph can only be generated after payload index creation.</aside>

### The ACORN Search Algorithm

*Available as of v1.16.0*

In some cases, the additional edges built for Qdrant's filterable HNSW may not be sufficient.
These extra edges are added for each payload index separately, but not for every possible combination of payload indices.
As a result, a combination of two or more strict filters might still lead to disconnected graph components.
The same can happen when there are a large number of soft-deleted points in the graph.
In such cases, use the [ACORN Search Algorithm](/documentation/search/search/#acorn-search-algorithm).
When using ACORN, during graph traversal, it explores not just direct neighbors (first hop), but also neighbors of neighbors (second hop) when direct neighbors are filtered out. This improves search accuracy at the cost of performance.

### Disable the Creation of Extra Edges for Payload Fields

*Available as of v1.17.0*

Not all payload indices may be intended for use with dense vector search. For example, when a collection contains both dense and sparse vectors, some payload fields may only be used to filter sparse vector searches. Since sparse vector search does not use the HNSW index, it is unnecessary to build extra edges in the HNSW graph for these fields. Creating extra edges adds indexing latency and increases the size of the HNSW graph, which consumes memory as well as disk space, so you may want to disable it for fields that do not require it. 

You can disable the creation of extra edges for an indexed payload field by setting `enable_hnsw` to `false` when configuring a payload index:

{{< code-snippet path="/documentation/headless/snippets/create-payload-index/disable-hnsw/" >}}

### Rebuild the HNSW Index

<aside role="alert">
Rebuilding the HNSW index is resource-intensive and can take a long time. Avoid it when possible.
</aside>

There may be cases when you need to rebuild the HNSW index, for example, when you create a new payload index and want to take advantage of filter-aware edges in the HNSW graph. To rebuild an HNSW index, make a small change to its HNSW configuration, for example by bumping `ef_construct` by `1`. This forces the optimizer to re-index all segments.

First, retrieve the current value of `ef_construct`:

{{< code-snippet path="/documentation/headless/snippets/update-collection/increment-ef-construct/" block="get-current-value" >}}

Next, update the collection with the value of `ef_construct` incremented by `1`:

{{< code-snippet path="/documentation/headless/snippets/update-collection/increment-ef-construct/" block="update-collection" >}}

Don’t immediately revert the value of `ef_construct` to its original value. Keep it set to the new value.

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

Unlike a dense vector index, a sparse vector index does not require a predefined vector size. It automatically adjusts to the size of the vectors added to the collection.

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
