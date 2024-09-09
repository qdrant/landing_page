---
title: Optimize Resources
weight: 11
aliases:
  - ../tutorials/optimize
---

# Optimize Qdrant

Different use cases have different requirements for balancing between memory, speed, and precision.
Qdrant is designed to be flexible and customizable so you can tune it to your needs.

![Trafeoff](/docs/tradeoff.png)

Let's look deeper into each of those possible optimization scenarios.

## Prefer low memory footprint with high speed search

The main way to achieve high speed search with low memory footprint is to keep vectors on disk while at the same time minimizing the number of disk reads.

Vector quantization is one way to achieve this. Quantization converts vectors into a more compact representation, which can be stored in memory and used for search. With smaller vectors you can cache more in RAM and reduce the number of disk reads.

To configure in-memory quantization, with on-disk original vectors, you need to create a collection with the following configuration:

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 768,
        "distance": "Cosine",
        "on_disk": true
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
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE, on_disk=True),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            always_ram=True,
        ),
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    on_disk: true,
  },
  quantization_config: {
    scalar: {
      type: "int8",
      always_ram: true,
    },
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, QuantizationType, ScalarQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .quantization_config(
                ScalarQuantizationBuilder::default()
                    .r#type(QuantizationType::Int8.into())
                    .always_ram(true),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .setOnDisk(true)
                            .build())
                    .build())
            .setQuantizationConfig(
                QuantizationConfig.newBuilder()
                    .setScalar(
                        ScalarQuantization.newBuilder()
                            .setType(QuantizationType.Int8)
                            .setAlwaysRam(true)
                            .build())
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine, OnDisk = true },
	quantizationConfig: new QuantizationConfig
	{
		Scalar = new ScalarQuantization { Type = QuantizationType.Int8, AlwaysRam = true }
	}
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
		OnDisk:   qdrant.PtrOf(true),
	}),
	QuantizationConfig: qdrant.NewQuantizationScalar(&qdrant.ScalarQuantization{
		Type:      qdrant.QuantizationType_Int8,
		AlwaysRam: qdrant.PtrOf(true),
	}),
})
```

`on_disk` will ensure that vectors will be stored on disk, while `always_ram` will ensure that quantized vectors will be stored in RAM.

Optionally, you can disable rescoring with search `params`, which will reduce the number of disk reads even further, but potentially slightly decrease the precision.

```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "params": {
        "quantization": {
            "rescore": false
        }
    },
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    search_params=models.SearchParams(
        quantization=models.QuantizationSearchParams(rescore=False)
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7],
    params: {
        quantization: {
            rescore: false,
        },
    },
});
```

```rust
use qdrant_client::qdrant::{
    QuantizationSearchParamsBuilder, QueryPointsBuilder, SearchParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .params(
                SearchParamsBuilder::default()
                    .quantization(QuantizationSearchParamsBuilder::default().rescore(false)),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QuantizationSearchParams;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SearchParams;

import static io.qdrant.client.QueryFactory.nearest;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setParams(
                        SearchParams.newBuilder()
                                .setQuantization(
                                        QuantizationSearchParams.newBuilder().setRescore(false).build())
                                .build())
                .setLimit(3)
                .build())
        .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	searchParams: new SearchParams
	{
		Quantization = new QuantizationSearchParams { Rescore = false }
	},
	limit: 3
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Params: &qdrant.SearchParams{
		Quantization: &qdrant.QuantizationSearchParams{
			Rescore: qdrant.PtrOf(true),
		},
	},
})
```

## Prefer high precision with low memory footprint

In case you need high precision, but don't have enough RAM to store vectors in memory, you can enable on-disk vectors and HNSW index.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "on_disk": true
    },
    "hnsw_config": {
        "on_disk": true
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE, on_disk=True),
    hnsw_config=models.HnswConfigDiff(on_disk=True),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    on_disk: true,
  },
  hnsw_config: {
    on_disk: true,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::{Qdrant, QdrantError};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).on_disk(true))
            .hnsw_config(HnswConfigDiffBuilder::default().on_disk(true)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .setOnDisk(true)
                            .build())
                    .build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setOnDisk(true).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine, OnDisk = true},
	hnswConfig: new HnswConfigDiff { OnDisk = true }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
		OnDisk:   qdrant.PtrOf(true),
	}),
	HnswConfig: &qdrant.HnswConfigDiff{
		OnDisk: qdrant.PtrOf(true),
	},
})
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

## Prefer high precision with high speed search

For high speed and high precision search it is critical to keep as much data in RAM as possible.
By default, Qdrant follows this approach, but you can tune it to your needs.

It is possible to achieve high search speed and tunable accuracy by applying quantization with re-scoring.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
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
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            always_ram=True,
        ),
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  quantization_config: {
    scalar: {
      type: "int8",
      always_ram: true,
    },
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, QuantizationType, ScalarQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .quantization_config(
                ScalarQuantizationBuilder::default()
                    .r#type(QuantizationType::Int8.into())
                    .always_ram(true),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setQuantizationConfig(
                QuantizationConfig.newBuilder()
                    .setScalar(
                        ScalarQuantization.newBuilder()
                            .setType(QuantizationType.Int8)
                            .setAlwaysRam(true)
                            .build())
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine},
	quantizationConfig: new QuantizationConfig
	{
		Scalar = new ScalarQuantization { Type = QuantizationType.Int8, AlwaysRam = true }
	}
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	QuantizationConfig: qdrant.NewQuantizationScalar(&qdrant.ScalarQuantization{
		Type:      qdrant.QuantizationType_Int8,
		AlwaysRam: qdrant.PtrOf(true),
	}),
})
```

There are also some search-time parameters you can use to tune the search accuracy and speed:

```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "params": {
        "hnsw_ef": 128,
        "exact": false
    },
    "limit": 3
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    search_params=models.SearchParams(hnsw_ef=128, exact=False),
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7],
    params: {
        hnsw_ef: 128,
        exact: false,
    },
    limit: 3,
});
```

```rust
use qdrant_client::qdrant::{QueryPointsBuilder, SearchParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .params(SearchParamsBuilder::default().hnsw_ef(128).exact(false)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SearchParams;

import static io.qdrant.client.QueryFactory.nearest;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setParams(SearchParams.newBuilder().setHnswEf(128).setExact(false).build())
                .setLimit(3)
                .build())
        .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	searchParams: new SearchParams { HnswEf = 128, Exact = false },
	limit: 3
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
	Params: &qdrant.SearchParams{
		HnswEf: qdrant.PtrOf(uint64(128)),
		Exact:  qdrant.PtrOf(false),
	},
})
```

- `hnsw_ef` - controls the number of neighbors to visit during search. The higher the value, the more accurate and slower the search will be. Recommended range is 32-512.
- `exact` - if set to `true`, will perform exact search, which will be slower, but more accurate. You can use it to compare results of the search with different `hnsw_ef` values versus the ground truth.

## Latency vs Throughput

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

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(default_segment_number=16),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  optimizers_config: {
    default_segment_number: 16,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, OptimizersConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .optimizers_config(
                OptimizersConfigDiffBuilder::default().default_segment_number(16),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder().setDefaultSegmentNumber(16).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	optimizersConfig: new OptimizersConfigDiff { DefaultSegmentNumber = 16 }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		DefaultSegmentNumber: qdrant.PtrOf(uint64(16)),
	},
})
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

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(default_segment_number=2),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  optimizers_config: {
    default_segment_number: 2,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, OptimizersConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .optimizers_config(
                OptimizersConfigDiffBuilder::default().default_segment_number(2),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder().setDefaultSegmentNumber(2).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	optimizersConfig: new OptimizersConfigDiff { DefaultSegmentNumber = 2 }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		DefaultSegmentNumber: qdrant.PtrOf(uint64(2)),
	},
})
```