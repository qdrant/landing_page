---
title: How To
weight: 130
---


This section contains a collection of how-to guides and tutorials for different use cases of Qdrant.

## Optimize qdrant

Different use cases have different requirements for balancing between memory, speed, and precision.
Qdrant is designed to be flexible and customizable so you can tune it to your needs.

![Trafeoff](/docs/tradeoff.png)

Let's look deeper into each of those possible optimization scenarios.

### Prefer low memory footprint with high speed search

The main way to achieve high speed search with low memory footprint is to keep vectors on disk while at the same time minimizing the number of disk reads.

Vector quantization is one way to achieve this. Quantization converts vectors into a more compact representation, which can be stored in memory and used for search. With smaller vectors you can cache more in RAM and reduce the number of disk reads.

To configure in-memory quantization, with on-disk original vectors, you need to create a collection with the following configuration:

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "memmap_threshold": 20000
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "always_ram": true
        }
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            always_ram=True,
        ),
    ),
)
```

`mmmap_threshold` will ensure that vectors will be stored on disk, while `always_ram` will ensure that quantized vectors will be stored in RAM.

Optionally, you can disable rescoring with search `params`, which will reduce the number of disk reads even further, but potentially slightly decrease the precision.

```http
POST /collections/{collection_name}/points/search

{
    "params": {
        "quantization": {
            "rescore": false
        }
    },
    "vector": [0.2, 0.1, 0.9, 0.7],
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    search_params=models.SearchParams(
        quantization=models.QuantizationSearchParams(
            rescore=False
        )
    )
)
```

### Prefer high precision with low memory footprint

In case you need high precision, but don't have enough RAM to store vectors in memory, you can enable on-disk vectors and HNSW index.

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "memmap_threshold": 20000
    },
    "hnsw_config": {
        "on_disk": true
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
    hnsw_config=models.HnswConfigDiff(on_disk=True)
)
```

In this scenario you can increase the precision of the search by increasing the `ef` and `m` parameters of the HNSW index, even with limited RAM.

```json
...
"hnsw_config": {
    "m": 64,
    "ef_construct": 512,
    "on_disk": true
}
...
```

The disk IOPS is a critical factor in this scenario, it will determine how fast you can perform search.
You can use [fio](https://gist.github.com/superboum/aaa45d305700a7873a8ebbab1abddf2b) to measure disk IOPS.

### Prefer high precision with high speed search

For high speed and high precision search it is critical to keep as much data in RAM as possible.
By default, Qdrant follows this approach, but you can tune it to your needs.

Is is possible to achieve high search speed and tunable accuracy by applying quantization with re-scoring.

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "memmap_threshold": 20000
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "always_ram": true
        }
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            always_ram=True,
        ),
    ),
)
```

There are also some search-time parameters you can use to tune the search accuracy and speed:

```http
POST /collections/{collection_name}/points/search

{
    "params": {
        "hnsw_ef": 128,
        "exact": false
    },
    "vector": [0.2, 0.1, 0.9, 0.7],
    "limit": 3
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.search(
    collection_name="{collection_name}",
    search_params=models.SearchParams(
        hnsw_ef=128,
        exact=False
    ),
    query_vector=[0.2, 0.1, 0.9, 0.7],
    limit=3,
)
```

- `hnsw_ef` - controls the number of neighbors to visit during search. The higher the value, the more accurate and slower the search will be. Recommended range is 32-512.
- `exact` - if set to `true`, will perform exact search, which will be slower, but more accurate. You can use it to compare results of the search with different `hnsw_ef` values versus the ground truth.

### Latency vs Throughput

- There are two main approaches to measure the speed of search:
  - latency of the request - the time from the moment request is submitted to the moment a response is received
  - throughput - the number of requests per second the system can handle

Those approaches are not mutually exclusive, but in some cases it might be preferable to optimize for one or another.

To prefer minimizing latency, you can set up Qdrant to use as many cores as possible for a single request\.
You can do this by setting the number of segments in the collection to be equal to the number of cores in the system. In this case, each segment will be processed in parallel, and the final result will be obtained faster.

```http

PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "default_segment_number": 16
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(default_segment_number=16),
)
```

To prefer throughput, you can set up Qdrant to use as many cores as possible for processing multiple requests in parallel.
To do that, you can configure qdrant to use minimal number of segments, which is usually 2.
Large segments benefit from the size of the index and overall smaller number of vector comparisons required to find the nearest neighbors. But at the same time require more time to build index.

```http

PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "default_segment_number": 2
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(default_segment_number=2),
)
```

## Serve vectors for many independent users

This is a common use case when you want to provide vector search for multiple independent partitions.
These partitions may be divided by users, organizations, or other criteria.
However, for simplicity, we will refer to them as users.

Each user should have only access to their own vectors and should not be able to view the vectors of other users.

There are several ways to achieve this in Qdrant:

- Use multiple collections, one for each user. This approach is the most flexible, but creating numerous collections may result in resource overhead. It is only recommended to separate users into multiple collections if you have a limited number of users and need to ensure that they do not affect each other in any way, including performance-wise.

- Use a single collection with payload-based partitioning. This approach is more efficient for a large number of users but requires some additional preparations.

In a simple case, it is sufficient to add a `group_id` field to each vector in the collection and use a filter along with `group_id` to filter vectors for each user.

```http
PUT /collections/{collection_name}/points

{
    "points": [
        {
            "id": 1,
            "payload": {"group_id": "user_1"},
            "vector": [0.9, 0.1, 0.1]
        },
        {
            "id": 2,
            "payload": {"group_id": "user_1"},
            "vector": [0.1, 0.9, 0.1]
        },
        {
            "id": 3,
            "payload": {"group_id": "user_2"},
            "vector": [0.1, 0.1, 0.9]
        },
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={"group_id": "user_1"},
            vector=[0.1, 0.9, 0.1],
        ),
        models.PointStruct(
            id=3,
            payload={"group_id": "user_2"},
            vector=[0.1, 0.1, 0.9],
        ),
    ]
)
```

And search with `group_id` filter:

```http
POST /collections/{collection_name}/points/search

{
    "filter": {
        "must": [
            {
                "key": "group_id",
                "match": {
                    "value": "user_1"
                }
            }
        ]
    },
    "vector": [0.1, 0.1, 0.9],
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.search(
    collection_name="{collection_name}",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="group_id",
                match=models.MatchValue(
                    value="user_1",
                ),
            )
        ]
    ),
    query_vector=[0.1, 0.1, 0.9],
    limit=10,
)
```

However, the speed of indexation may become a bottleneck in this case, as each user's vector will be indexed into the same collection. To avoid this bottleneck, consider _bypassing the construction of a global vector index_ for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.

To implement this approach, you should:

- Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
- set `m` in hnsw config to 0. This will disable building global index for the whole collection
- Create keyword payload index for `group_id` field.

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {
        "payload_m": 16,
        "m": 0
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HNSWConfigDiff(
        payload_m=16,
        m=0,
    ),
)
```

Create payload index for `group_id` field:

```http
PUT /collections/{collection_name}/index

{
    "field_name": "group_id",
    "field_schema": "keyword"
}
```

```python
client.create_payload_index(
  collection_name="{collection_name}", 
  field_name="group_id", 
  field_schema=models.PayloadSchemaType.KEYWORD
)
```

## Bulk upload a large number of vectors

Uploading a large-scale dataset fast might be a challenge, but Qdrant has a few tricks to help you with that.

The first important detail about data uploading is that the bottleneck is usually located on the client side, not on the server side.
This means that if you are uploading a large dataset, you should prefer a high-performance client library.

We recommend using our [Rust client library](https://github.com/qdrant/rust-client) for this purpose, as it is the fastest client library available for Qdrant.

If you are not using Rust, you might want to consider parallelizing your upload process.

### Disable indexing during upload

In case you are doing an initial upload of a large dataset, you might want to disable indexing during upload.
It will enable to avoid unnecessary indexing of vectors, which will be overwritten by the next batch.

To disable indexing during upload, set `indexing_threshold` to `0`:

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "indexing_threshold": 0
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(
        indexing_threshold=0,
    ),
)
```

After upload is done, you can enable indexing by setting `indexing_threshold` to a desired value (default is 20000):

```http
PATCH /collections/{collection_name}

{
    "optimizers_config": {
        "indexing_threshold": 20000
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.update_collection(
    collection_name="{collection_name}",
    optimizer_config=models.OptimizersConfigDiff(
        indexing_threshold=20000
    )
)
```

### Parallel upload into multiple shards

In Qdrant, each collection is split into shards. Each shard has a separate Write-Ahead-Log (WAL), which is responsible for ordering operations.
By creating multiple shards, you can parallelize upload of a large dataset. From 2 to 4 shards per one machine is a reasonable number.

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "shard_number": 2
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    shard_number=2,
)
```

## Choose optimizer parameters

The optimizer is a fundamental architecture component of Qdrant.
It is responsible for indexing, merging, vacuuming, and quantizing segments of the collection.

The optimizer allows to combine dynamic updates of any record in the collection with the ability to perform efficient bulk updates. It is especially important for building efficient indexes, which require knowledge of various statistics and distributions before they can be built.

The parameters which affect the most the optimizer's behavior are:

```yaml
# Target amount of segments optimizer will try to keep.
# Real amount of segments may vary depending on multiple parameters:
#  - Amount of stored points
#  - Current write RPS
#
# It is recommended to select default number of segments as a factor of the number of search threads,
# so that each segment would be handled evenly by one of the threads.
# If `default_segment_number = 0`, will be automatically selected by the number of available CPUs
default_segment_number: 0

# Do not create segments larger this size (in KiloBytes).
# Large segments might require disproportionately long indexation times,
# therefore it makes sense to limit the size of segments.
#
# If indexation speed have more priority for your - make this parameter lower.
# If search speed is more important - make this parameter higher.
# Note: 1Kb = 1 vector of size 256
# If not set, will be automatically selected considering the number of available CPUs.
max_segment_size_kb: null

# Maximum size (in kilobytes) of vectors to store in-memory per segment.
# Segments larger than this threshold will be stored as read-only memmaped file.
# Memmap storage is disabled by default, to enable it, set this threshold to a reasonable value.
# To disable memmap storage, set this to `0`.
# Note: 1Kb = 1 vector of size 256
memmap_threshold_kb: null

# Maximum size (in kilobytes) of vectors allowed for plain index, exceeding this threshold will enable vector indexing
# Default value is 20,000, based on <https://github.com/google-research/google-research/blob/master/scann/docs/algorithms.md>.
# To disable vector indexing, set to `0`.
# Note: 1kB = 1 vector of size 256.
indexing_threshold_kb: 20000
```

Those parameters are working as a conditional statement, which is evaluated for each segment after each update.
If the condition is true, the segment will be scheduled for optimization.

The values of those parameters will affect how Qdrant handles updates of the data.

- If you have enough RAM and CPU, it is fine to go with default values - Qdrant will index all vectors as fast as possible.
- If you have a limited amount of RAM, you can set `memmap_threshold_kb=20000` to the same value as `indexing_threshold_kb`. This ensures that all vectors will be stored on disk during the optimization iteration running the indexation.
- If you are doing bulk updates, you can set `indexing_threshold_kb=0` (or some very large value) to **disable** indexing during bulk updates. It will speed up the process significantly, but will require re-setting the parameter after bulk updates are finished.

Depending on your collection, you might not have enough vectors per segment to start building the index.
E.g. if you have 100k vecotrs and 8 segments, one for each CPU core, each segment will have only 12.5k vectors, which is not enough to build index.
In this case, you can set `indexing_threshold_kb=5000` to start building index even for small segments.



<!--- ## Implement search-as-you-type functionality -->



<!--- ## Move data between clusters -->

## Solve some common errors

### Too many files open (OS error 24)

Each collection segment needs some files to be open. At some point you may encounter the following errors in your server log:

```
Error: Too many files open (OS error 24)
```

In such a case you may need to increase the limit of the open files. It might be done, for example, while you launch the Docker container:

```bash
docker run --ulimit nofile=10000:10000 qdrant/qdrant:latest
```

The command above will set both soft and hard limits to `10000`.

If you are not using Docker, the following command will change the limit for the current user session:

```bash
ulimit -n 10000
```

Please note, the command should be executed before you run Qdrant server.