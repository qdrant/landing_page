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
Their necessity is determined by the [optimizer](../optimizer/) settings and depends, as a rule, on the number of stored points.

## Payload Index

Payload index in Qdrant is similar to the index in conventional document-oriented databases.
This index is built for a specific field and type, and is used for quick point requests by the corresponding filtering condition.

The index is also used to accurately estimate the filter cardinality, which helps the [query planning](../search#query-planning) choose a search strategy.

Creating an index requires additional computational resources and memory, so choosing fields to be indexed is essential. Qdrant does not make this choice but grants it to the user.

To mark a field as indexable, you can use the following:

```http
PUT /collections/{collection_name}/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": "keyword"
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema="keyword",
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: "keyword",
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::FieldType};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        "{collection_name}",
        "name_of_the_field_to_index",
        FieldType::Keyword,
        None,
        None,
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "name_of_the_field_to_index",
        PayloadSchemaType.Keyword,
        null,
        null,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.CreatePayloadIndexAsync(collectionName: "{collection_name}", fieldName: "name_of_the_field_to_index");
```

Available field types are:

* `keyword` - for [keyword](../payload/#keyword) payload, affects [Match](../filtering/#match) filtering conditions.
* `integer` - for [integer](../payload/#integer) payload, affects [Match](../filtering/#match) and [Range](../filtering/#range) filtering conditions.
* `float` - for [float](../payload/#float) payload, affects [Range](../filtering/#range) filtering conditions.
* `bool` - for [bool](../payload/#bool) payload, affects [Match](../filtering/#match) filtering conditions (available as of v1.4.0).
* `geo` - for [geo](../payload/#geo) payload, affects [Geo Bounding Box](../filtering/#geo-bounding-box) and [Geo Radius](../filtering/#geo-radius) filtering conditions.
* `datetime` - for [datetime](../payload/#datetime) payload, affects [Range](../filtering/#range) filtering conditions (available as of v1.8.0).
* `text` - a special kind of index, available for [keyword](../payload/#keyword) / string payloads, affects [Full Text search](../filtering/#full-text-match) filtering conditions.

Payload index may occupy some additional memory, so it is recommended to only use index for those fields that are used in filtering conditions.
If you need to filter by many fields and the memory limits does not allow to index all of them, it is recommended to choose the field that limits the search result the most.
As a rule, the more different values a payload value has, the more efficiently the index will be used.

## Full-text index

*Available as of v0.10.0*

Qdrant supports full-text search for string payloads.
Full-text index allows you to filter points by the presence of a word or a phrase in the payload field.

Full-text index configuration is a bit more complex than other indexes, as you can specify the tokenization parameters.
Tokenization is the process of splitting a string into tokens, which are then indexed in the inverted index.

To create a full-text index, you can use the following:

```http
PUT /collections/{collection_name}/index
{
    "field_name": "name_of_the_field_to_index",
    "field_schema": {
        "type": "text",
        "tokenizer": "word",
        "min_token_len": 2,
        "max_token_len": 20,
        "lowercase": true
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        tokenizer=models.TokenizerType.WORD,
        min_token_len=2,
        max_token_len=15,
        lowercase=True,
    ),
)
```

```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: {
    type: "text",
    tokenizer: "word",
    min_token_len: 2,
    max_token_len: 15,
    lowercase: true,
  },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        payload_index_params::IndexParams, FieldType, PayloadIndexParams, TextIndexParams,
        TokenizerType,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        "{collection_name}",
        "name_of_the_field_to_index",
        FieldType::Text,
        Some(&PayloadIndexParams {
            index_params: Some(IndexParams::TextIndexParams(TextIndexParams {
                tokenizer: TokenizerType::Word as i32,
                min_token_len: Some(2),
                max_token_len: Some(10),
                lowercase: Some(true),
            })),
        }),
        None,
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.TextIndexParams;
import io.qdrant.client.grpc.Collections.TokenizerType;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "name_of_the_field_to_index",
        PayloadSchemaType.Text,
        PayloadIndexParams.newBuilder()
            .setTextIndexParams(
                TextIndexParams.newBuilder()
                    .setTokenizer(TokenizerType.Word)
                    .setMinTokenLen(2)
                    .setMaxTokenLen(10)
                    .setLowercase(true)
                    .build())
            .build(),
        null,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreatePayloadIndexAsync(
	collectionName: "{collection_name}",
	fieldName: "name_of_the_field_to_index",
	schemaType: PayloadSchemaType.Text,
	indexParams: new PayloadIndexParams
	{
		TextIndexParams = new TextIndexParams
		{
			Tokenizer = TokenizerType.Word,
			MinTokenLen = 2,
			MaxTokenLen = 10,
			Lowercase = true
		}
	}
);
```

Available tokenizers are:

* `word` - splits the string into words, separated by spaces, punctuation marks, and special characters.
* `whitespace` - splits the string into words, separated by spaces.
* `prefix` - splits the string into words, separated by spaces, punctuation marks, and special characters, and then creates a prefix index for each word. For example: `hello` will be indexed as `h`, `he`, `hel`, `hell`, `hello`.
* `multilingual` - special type of tokenizer based on [charabia](https://github.com/meilisearch/charabia) package. It allows proper tokenization and lemmatization for multiple languages, including those with non-latin alphabets and non-space delimiters. See [charabia documentation](https://github.com/meilisearch/charabia) for full list of supported languages supported normalization options. In the default build configuration, qdrant does not include support for all languages, due to the increasing size of the resulting binary. Chinese, Japanese and Korean languages are not enabled by default, but can be enabled by building qdrant from source with `--features multiling-chinese,multiling-japanese,multiling-korean` flags. 

See [Full Text match](../filtering/#full-text-match) for examples of querying with full-text index.

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

And so in the process of creating a [collection](../collections/). The `ef` parameter is configured during [the search](../search/) and by default is equal to `ef_construct`.

HNSW is chosen for several reasons.
First, HNSW is well-compatible with the modification that allows Qdrant to use filters during a search.
Second, it is one of the most accurate and fastest algorithms, according to [public benchmarks](https://github.com/erikbern/ann-benchmarks).

*Available as of v1.1.1*

The HNSW parameters can also be configured on a collection and named vector
level by setting [`hnsw_config`](../indexing/#vector-index) to fine-tune search
performance.

## Sparse Vector Index

*Available as of v1.7.0*

Qdrant supports a separate index for Sparse Vectors. Each data point in Qdrant can have both dense and sparse vectors. Therefore, you can still use the same collection for both vector types.  The indexing process is highly efficient, whereby an inverted index structure stores vectors for each non-zero dimension. This approach reduces memory usage and increases search speeds, particularly for high-dimensional data. 

During search, the index identifies vectors with non-zero values in query dimensions. They are scored using the dot product method. You may also use filtering to search through sparse vectors. Just as with dense vectors, filtering is done by payload.

**Optimization Methods**

The index resides in memory for appendable segments, ensuring fast search and update operations.
For immutable segments, the sparse index can either stay in memory or be mapped to disk with the `on_disk` flag.

To optimize your search, you should reduce the number of vectors that need to be scored. To do this, you need to switch your search from the payload index to the sparse vector index. The `full_scan_threshold` variable configures the switch. It specifies the threshold in terms of the number of matching vectors found by the query planner.

This sample configuration enables on-disk storage for immutable segments. It also sets a full scan threshold for queries inspecting less than 5000 vectors.

```
PUT /collections/{collection_name}
{
    "sparse_vectors": {
        "text": {
            "index": {
                "on_disk": true,
                "full_scan_threshold": 5000
            }
         },
    }
}
```

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
