---
title: Vectors
weight: 41
aliases:
  - /vectors
---


# Vectors

Vectors (or embeddings) are the core concept of the Qdrant Vector Search engine. 
Vectors define the similarity between objects in the vector space.

If a pair of vectors are similar in vector space, it means that the objects they represent are similar in some way.

For example, if you have a collection of images, you can represent each image as a vector.
If two images are similar, their vectors will be close to each other in the vector space.

In order to obtain a vector representation of an object, you need to apply a vectorization algorithm to the object.
Usually, this algorithm is a neural network that converts the object into a fixed-size vector.

The neural network is usually [trained](/articles/metric-learning-tips/) on a pairs or [triplets](/articles/triplet-loss/) of similar and dissimilar objects, so it learns to recognize a specific type of similarity.

By using this property of vectors, you can explore your data in a number of ways; e.g. by searching for similar objects, clustering objects, and more.


## Vector Types

Modern neural networks can output vectors in different shapes and sizes, and Qdrant supports most of them.
Let's take a look at the most common types of vectors supported by Qdrant.


### Dense Vectors

This is the most common type of vector. It is a simple list of numbers, it has a fixed length and each element of the list is a floating-point number.

It looks like this:

```json

// A piece of a real-world dense vector
[
    -0.013052909,
    0.020387933,
    -0.007869,
    -0.11111383,
    -0.030188112,
    -0.0053388323,
    0.0010654867,
    0.072027855,
    -0.04167721,
    0.014839341,
    -0.032948174,
    -0.062975034,
    -0.024837125,
    ....
]
```

The majority of neural networks create dense vectors, so you can use them with Qdrant without any additional processing.
Although compatible with most embedding models out there, Qdrant has been tested with the following [verified embedding providers](/documentation/embeddings/).

### Sparse Vectors

Sparse vectors are a special type of vectors. 
Mathematically, they are the same as dense vectors, but they contain many zeros so they are stored in a special format.

Sparse vectors in Qdrant don't have a fixed length, as it is dynamically allocated during vector insertion.
The amount of non-zero values in sparse vectors is currently limited to u32 datatype range (4294967295). 

In order to define a sparse vector, you need to provide a list of non-zero elements and their indexes.

```json
// A sparse vector with 4 non-zero elements
{
    "indexes": [1, 3, 5, 7],
    "values": [0.1, 0.2, 0.3, 0.4]
}
```

Sparse vectors in Qdrant are kept in special storage and indexed in a separate index, so their configuration is different from dense vectors.

To create a collection with sparse vectors:


```http
PUT /collections/{collection_name}
{
    "sparse_vectors": {
        "text": { },
    }
}
```

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "sparse_vectors": {
        "text": { }
    }
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={},
    sparse_vectors_config={
        "text": models.SparseVectorParams(),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  sparse_vectors: {
    text: { },
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, SparseVectorParamsBuilder, SparseVectorsConfigBuilder,
};

use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut sparse_vectors_config = SparseVectorsConfigBuilder::default();

sparse_vectors_config.add_named_vector_params("text", SparseVectorParamsBuilder::default());

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .sparse_vectors_config(sparse_vectors_config),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setSparseVectorsConfig(
                SparseVectorConfig.newBuilder()
                    .putMap("text", SparseVectorParams.getDefaultInstance()))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	sparseVectorsConfig: ("text", new SparseVectorParams())
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
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"text": {},
		}),
})
```

Insert a point with a sparse vector into the created collection:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": {
                "text": {
                    "indices": [1, 3, 5, 7],
                    "values": [0.1, 0.2, 0.3, 0.4]
                }
            }
        }
    ]
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={},  # Add any additional payload if necessary
            vector={
                "text": models.SparseVector(
                    indices=[1, 3, 5, 7],
                    values=[0.1, 0.2, 0.3, 0.4]
                )
            },
        )
    ],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        text: {
          indices: [1, 3, 5, 7],
          values: [0.1, 0.2, 0.3, 0.4]
        },
      },
    }
  ]
});
```

```rust
use qdrant_client::qdrant::{NamedVectors, PointStruct, UpsertPointsBuilder, Vector};

use qdrant_client::{Payload, Qdrant};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![PointStruct::new(
    1,
    NamedVectors::default().add_vector(
        "text",
        Vector::new_sparse(vec![1, 3, 5, 7], vec![0.1, 0.2, 0.3, 0.4]),
    ),
    Payload::new(),
)];

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}", points))
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
  .upsertAsync(
    "{collection_name}",
    List.of(
      PointStruct.newBuilder()
      .setId(id(1))
      .setVectors(
        namedVectors(Map.of(
          "text", vector(List.of(1.0f, 2.0f), List.of(6, 7))))
      )
      .build()))
  .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
  collectionName: "{collection_name}",
  points: new List < PointStruct > {
    new() {
      Id = 1,
        Vectors = new Dictionary <string, Vector> {
          ["text"] = ([0.1f, 0.2f, 0.3f, 0.4f], [1, 3, 5, 7])
        }
    }
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

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsMap(
				map[string]*qdrant.Vector{
					"text": qdrant.NewVectorSparse(
						[]uint32{1, 3, 5, 7},
						[]float32{0.1, 0.2, 0.3, 0.4}),
				}),
		},
	},
})
```

Now you can run a search with sparse vectors:

```http
POST /collections/{collection_name}/points/query
{
    "query": {
        "indices": [1, 3, 5, 7],
        "values": [0.1, 0.2, 0.3, 0.4]
    },
    "using": "text"
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")


result = client.query_points(
    collection_name="{collection_name}",
    query=models.SparseVector(indices=[1, 3, 5, 7], values=[0.1, 0.2, 0.3, 0.4]),
    using="text",
).points
```

```rust
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![(1, 0.2), (3, 0.1), (5, 0.9), (7, 0.7)])
            .limit(10)
            .using("text"),
    )
    .await?;
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: {
        indices: [1, 3, 5, 7],
        values: [0.1, 0.2, 0.3, 0.4]
    },
    using: "text",
    limit: 3,
});
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;

import static io.qdrant.client.QueryFactory.nearest;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setUsing("text")
                .setQuery(nearest(List.of(0.1f, 0.2f, 0.3f, 0.4f), List.of(1, 3, 5, 7)))
                .setLimit(3)
                .build())
        .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new (float, uint)[] {(0.1f, 1), (0.2f, 3), (0.3f, 5), (0.4f, 7)},
  usingVector: "text",
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
	Query: qdrant.NewQuerySparse(
		[]uint32{1, 3, 5, 7},
		[]float32{0.1, 0.2, 0.3, 0.4}),
	Using: qdrant.PtrOf("text"),
})
```

### Multivectors

**Available as of v1.10.0**

Qdrant supports the storing of a variable amount of same-shaped dense vectors in a single point. 
This means that instead of a single dense vector, you can upload a matrix of dense vectors.

The length of the matrix is fixed, but the number of vectors in the matrix can be different for each point.

Multivectors look like this:

```json
// A multivector of size 4
"vector": [
    [-0.013,  0.020, -0.007, -0.111],
    [-0.030, -0.055,  0.001,  0.072],
    [-0.041,  0.014, -0.032, -0.062],
    ....
]

```

There are two scenarios where multivectors are useful:

* **Multiple representation of the same object** - For example, you can store multiple embeddings for pictures of the same object, taken from different angles. This approach assumes that the payload is same for all vectors.
* **Late interaction embeddings** - Some text embedding models can output multiple vectors for a single text. 
For example, a family of models such as ColBERT output a relatively small vector for each token in the text. 

In order to use multivectors, we need to specify a function that will be used to compare between matrices of vectors

Currently, Qdrant supports `max_sim` function, which is defined as a sum of maximum similarities between each pair of vectors in the matrices.

$$
score = \sum_{i=1}^{N} \max_{j=1}^{M} \text{Sim}(\text{vectorA}_i, \text{vectorB}_j)
$$

Where $N$ is the number of vectors in the first matrix, $M$ is the number of vectors in the second matrix, and $\text{Sim}$ is a similarity function, for example, cosine similarity.

To use multivectors, create a collection with the following configuration:

```http
PUT collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "multivector_config": {
      "comparator": "max_sim"
    }
  }
}
```

```python

from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        multivector_config=models.MultiVectorConfig(
            comparator=models.MultiVectorComparator.MAX_SIM
        ),
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 128,
    distance: "Cosine",
    multivector_config: {
      comparator: "max_sim"
    }
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, VectorParamsBuilder,
    MultiVectorComparator, MultiVectorConfigBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(
                VectorParamsBuilder::new(100, Distance::Cosine)
                    .multivector_config(
                        MultiVectorConfigBuilder::new(MultiVectorComparator::MaxSim)
                    ),
            ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.MultiVectorComparator;
import io.qdrant.client.grpc.Collections.MultiVectorConfig;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.createCollectionAsync("{collection_name}",
  VectorParams.newBuilder().setSize(128)
  .setDistance(Distance.Cosine)
  .setMultivectorConfig(MultiVectorConfig.newBuilder()
    .setComparator(MultiVectorComparator.MaxSim)
    .build())
  .build()).get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParams {
    Size = 128,
      Distance = Distance.Cosine,
      MultivectorConfig = new() {
        Comparator = MultiVectorComparator.MaxSim
      }
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
		Size:     128,
		Distance: qdrant.Distance_Cosine,
		MultivectorConfig: &qdrant.MultiVectorConfig{
			Comparator: qdrant.MultiVectorComparator_MaxSim,
		},
	}),
})
```

To insert a point with multivector:

```http
PUT collections/{collection_name}/points
{
  "points": [
    {
      "id": 1,
      "vector": [
        [-0.013,  0.020, -0.007, -0.111, ...],
        [-0.030, -0.055,  0.001,  0.072, ...],
        [-0.041,  0.014, -0.032, -0.062, ...]
      ]
    }
  ]
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector=[
                [-0.013,  0.020, -0.007, -0.111],
                [-0.030, -0.055,  0.001,  0.072],
                [-0.041,  0.014, -0.032, -0.062]
            ],
        )
    ],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: [
        [-0.013,  0.020, -0.007, -0.111, ...],
        [-0.030, -0.055,  0.001,  0.072, ...],
        [-0.041,  0.014, -0.032, -0.062, ...]
      ],
    }
  ]
});
```

```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder, Vector};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![
    PointStruct::new(
        1,
        Vector::new_multi(vec![
            vec![-0.013, 0.020, -0.007, -0.111],
            vec![-0.030, -0.055, 0.001, 0.072],
            vec![-0.041, 0.014, -0.032, -0.062],
        ]),
        Payload::new()
    )
];

client
    .upsert_points(
        UpsertPointsBuilder::new("{collection_name}", points)
    ).await?;

```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorsFactory.vectors;
import static io.qdrant.client.VectorFactory.multiVector;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
.upsertAsync(
    "{collection_name}",
    List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(vectors(multiVector(new float[][] {
                {-0.013f,  0.020f, -0.007f, -0.111f},
                {-0.030f, -0.055f,  0.001f,  0.072f},
                {-0.041f,  0.014f, -0.032f, -0.062f}
            })))
            .build()
    ))
.get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
  collectionName: "{collection_name}",
  points: new List <PointStruct> {
    new() {
      Id = 1,
        Vectors = new float[][] {
          [-0.013f, 0.020f, -0.007f, -0.111f],
          [-0.030f, -0.05f, 0.001f, 0.072f],
          [-0.041f, 0.014f, -0.032f, -0.062f ],
        },
    },
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

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsMulti(
				[][]float32{
					{-0.013, 0.020, -0.007, -0.111},
					{-0.030, -0.055, 0.001, 0.072},
					{-0.041, 0.014, -0.032, -0.062}}),
		},
	},
})
```

To search with multivector (available in `query` API): 

```http
POST collections/{collection_name}/points/query
{
  "query": [
    [-0.013,  0.020, -0.007, -0.111, ...],
    [-0.030, -0.055,  0.001,  0.072, ...],
    [-0.041,  0.014, -0.032, -0.062, ...]
  ]
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=[
        [-0.013,  0.020, -0.007, -0.111],
        [-0.030, -0.055,  0.001,  0.072],
        [-0.041,  0.014, -0.032, -0.062]
    ],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
  "query": [
    [-0.013, 0.020, -0.007, -0.111],
    [-0.030, -0.055, 0.001, 0.072],
    [-0.041, 0.014, -0.032, -0.062]
  ]
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{ QueryPointsBuilder, VectorInput };

let client = Qdrant::from_url("http://localhost:6334").build()?;

let res = client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(VectorInput::new_multi(
            vec![
                vec![-0.013,  0.020, -0.007, -0.111],
                vec![-0.030, -0.055,  0.001,  0.072],
                vec![-0.041,  0.014, -0.032, -0.062],
            ]
        ))
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
    .setQuery(nearest(new float[][] {
        {-0.013f, 0.020f, -0.007f, -0.111f}, 
        {-0.030f, -0.055f, 0.001f, 0.072f}, 
        {-0.041f, 0.014f, -0.032f, -0.062f}
    }))
    .build()).get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new float[][] {
    [-0.013f, 0.020f, -0.007f, -0.111f],
    [-0.030f, -0.055f, 0.001 , 0.072f],
    [-0.041f, 0.014f, -0.032f, -0.062f],
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

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryMulti(
		[][]float32{
			{-0.013, 0.020, -0.007, -0.111},
			{-0.030, -0.055, 0.001, 0.072},
			{-0.041, 0.014, -0.032, -0.062},
		}),
})
```


## Named Vectors

In Qdrant, you can store multiple vectors of different sizes and [types](#vector-types) in the same data [point](/documentation/concepts/points/). This is useful when you need to define your data with multiple embeddings to represent different features or modalities (e.g., image, text or video). 

To store different vectors for each point, you need to create separate named vector spaces in the [collection](/documentation/concepts/collections/). You can define these vector spaces during collection creation and manage them independently.

<aside role="status">
Each vector should have a unique name. Vectors can represent different modalities and you can use different embedding models to generate them.
</aside>

To create a collection with named vectors, you need to specify a configuration for each vector:

```http
PUT /collections/{collection_name}
{
  "vectors": {
    "image": {
      "size": 4,
      "distance": "Dot"
    },
    "text": {
      "size": 5,
      "distance": "Cosine"
    }
  },
  "sparse_vectors": {
    "text-sparse": {}
  }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={
        "image": models.VectorParams(size=4, distance=models.Distance.DOT),
        "text": models.VectorParams(size=5, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={"text-sparse": models.SparseVectorParams()},
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    vectors: {
        image: { size: 4, distance: "Dot" },
        text: { size: 5, distance: "Cosine" },
    },
    sparse_vectors: {
        text_sparse: {}
    }
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, SparseVectorParamsBuilder, SparseVectorsConfigBuilder,
    VectorParamsBuilder, VectorsConfigBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut vector_config = VectorsConfigBuilder::default();
vector_config.add_named_vector_params("text", VectorParamsBuilder::new(5, Distance::Dot));
vector_config.add_named_vector_params("image", VectorParamsBuilder::new(4, Distance::Cosine));

let mut sparse_vectors_config = SparseVectorsConfigBuilder::default();
sparse_vectors_config
    .add_named_vector_params("text-sparse", SparseVectorParamsBuilder::default());

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(vector_config)
            .sparse_vectors_config(sparse_vectors_config),
    )
    .await?;
```

```java
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(VectorsConfig.newBuilder().setParamsMap(
                VectorParamsMap.newBuilder().putAllMap(Map.of("image",
                    VectorParams.newBuilder()
                        .setSize(4)
                        .setDistance(Distance.Dot)
                        .build(),
                    "text",
                    VectorParams.newBuilder()
                        .setSize(5)
                        .setDistance(Distance.Cosine)
                        .build()))))
            .setSparseVectorsConfig(SparseVectorConfig.newBuilder().putMap(
                "text-sparse", SparseVectorParams.getDefaultInstance()))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParamsMap
  {
      Map = {
      ["image"] = new VectorParams {
        Size = 4, Distance = Distance.Dot
      },
      ["text"] = new VectorParams {
        Size = 5, Distance = Distance.Cosine
      },
    }
  },
  sparseVectorsConfig: new SparseVectorConfig
  {
      Map = {
        ["text-sparse"] = new()
    }
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
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"image": {
				Size:     4,
				Distance: qdrant.Distance_Dot,
			},
			"text": {
				Size:     5,
				Distance: qdrant.Distance_Cosine,
			},
		}),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"text-sparse": {},
		},
	),
})
```

To insert a point with named vectors:

```http
PUT /collections/{collection_name}/points?wait=true
{
    "points": [
        {
            "id": 1,
            "vector": {
                "image": [0.9, 0.1, 0.1, 0.2],
                "text": [0.4, 0.7, 0.1, 0.8, 0.1],
                "text-sparse": {
                  "indices": [1, 3, 5, 7],
                  "values": [0.1, 0.2, 0.3, 0.4]
                }
            }
        }
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "image": [0.9, 0.1, 0.1, 0.2],
                "text": [0.4, 0.7, 0.1, 0.8, 0.1],
                "text-sparse": {
                    "indices": [1, 3, 5, 7],
                    "values": [0.1, 0.2, 0.3, 0.4],
                },
            },
        ),
    ],
)
```

```typescript
client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                image: [0.9, 0.1, 0.1, 0.2],
                text: [0.4, 0.7, 0.1, 0.8, 0.1],
                text_sparse: {
                    indices: [1, 3, 5, 7],
                    values: [0.1, 0.2, 0.3, 0.4]
                }
            },
        },
    ],
});
```

```rust

use qdrant_client::qdrant::{
    NamedVectors, PointStruct, UpsertPointsBuilder, Vector,
};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                1,
                NamedVectors::default()
                    .add_vector("text", Vector::new_dense(vec![0.4, 0.7, 0.1, 0.8, 0.1]))
                    .add_vector("image", Vector::new_dense(vec![0.9, 0.1, 0.1, 0.2]))
                    .add_vector(
                        "text-sparse",
                        Vector::new_sparse(vec![1, 3, 5, 7], vec![0.1, 0.2, 0.3, 0.4]),
                    ),
                Payload::default(),
            )],
        )
        .wait(true),
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.grpc.Points.PointStruct;

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "image",
                            vector(List.of(0.9f, 0.1f, 0.1f, 0.2f)),
                            "text",
                            vector(List.of(0.4f, 0.7f, 0.1f, 0.8f, 0.1f)),
                            "text-sparse",
                            vector(List.of(0.1f, 0.2f, 0.3f, 0.4f), List.of(1, 3, 5, 7)))))
                .build()))
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: new List<PointStruct>
    {
        new()
        {
            Id = 1,
            Vectors = new Dictionary<string, Vector>
            {
                ["image"] = new() {
                    Data = {0.9f, 0.1f, 0.1f, 0.2f}
                },
                ["text"] = new() {
                    Data = {0.4f, 0.7f, 0.1f, 0.8f, 0.1f}
                },
                ["text-sparse"] = ([0.1f, 0.2f, 0.3f, 0.4f], [1, 3, 5, 7]),
            }
        }
    }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"image": qdrant.NewVector(0.9, 0.1, 0.1, 0.2),
				"text":  qdrant.NewVector(0.4, 0.7, 0.1, 0.8, 0.1),
				"text-sparse": qdrant.NewVectorSparse(
					[]uint32{1, 3, 5, 7},
					[]float32{0.1, 0.2, 0.3, 0.4}),
			}),
		},
	},
})
```

You can also upload
To search with named vectors (available in `query` API):

```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "using": "image",
    "limit": 3
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
    using="image",
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
  query: [0.2, 0.1, 0.9, 0.7],
  using: "image",
  limit: 3,
});
```

```rust
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .using("image"),
    )
    .await?;
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;

import static io.qdrant.client.QueryFactory.nearest;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
        .setUsing("image")
        .setLimit(3)
        .build()).get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	usingVector: "image",
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
	Using:          qdrant.PtrOf("image"),
})
```

## Datatypes

Newest versions of embeddings models generate vectors with very large dimentionalities.
With OpenAI's `text-embedding-3-large` embedding model, the dimensionality can go up to 3072.

The amount of memory required to store such vectors grows linearly with the dimensionality,
so it is important to choose the right datatype for the vectors.

The choice between datatypes is a trade-off between memory consumption and precision of vectors.

Qdrant supports a number of datatypes for both dense and sparse vectors:

**Float32**

This is the default datatype for vectors in Qdrant. It is a 32-bit (4 bytes) floating-point number. 
The standard OpenAI embedding of 1536 dimensionality will require 6KB of memory to store in Float32.

You don't need to specify the datatype for vectors in Qdrant, as it is set to Float32 by default.

**Float16**

This is a 16-bit (2 bytes) floating-point number. It is also known as half-precision float.
Intuitively, it looks like this:

```text
float32 -> float16 delta (float32 - float16).abs

0.79701585 -> 0.796875   delta 0.00014084578
0.7850789  -> 0.78515625 delta 0.00007736683
0.7775044  -> 0.77734375 delta 0.00016063452
0.85776305 -> 0.85791016 delta 0.00014710426
0.6616839  -> 0.6616211  delta 0.000062823296
```

The main advantage of Float16 is that it requires half the memory of Float32, while having virtually no impact on the quality of vector search.

To use Float16, you need to specify the datatype for vectors in the collection configuration:

```http
PUT /collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "datatype": "float16" // <-- For dense vectors
  },
  "sparse_vectors": {
    "text": {
      "index": {
        "datatype": "float16" // <-- And for sparse vectors 
      }
    }
  }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        datatype=models.Datatype.FLOAT16
    ),
    sparse_vectors_config={
        "text": models.SparseVectorParams(
            index=models.SparseIndexParams(datatype=models.Datatype.FLOAT16)
        ),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 128,
    distance: "Cosine",
    datatype: "float16"
  },
  sparse_vectors: {
    text: {
      index: {
        datatype: "float16"
      }
    }
  }
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, SparseIndexConfigBuilder, SparseVectorParamsBuilder, SparseVectorsConfigBuilder, VectorParamsBuilder
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut sparse_vector_config = SparseVectorsConfigBuilder::default();
sparse_vector_config.add_named_vector_params(
    "text",
    SparseVectorParamsBuilder::default()
        .index(SparseIndexConfigBuilder::default().datatype(Datatype::Float32)),
);

let create_collection = CreateCollectionBuilder::new("{collection_name}")
    .sparse_vectors_config(sparse_vector_config)
    .vectors_config(
        VectorParamsBuilder::new(128, Distance::Cosine).datatype(Datatype::Float16),
    );

client.create_collection(create_collection).await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.SparseIndexConfig;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
  .createCollectionAsync(
    CreateCollection.newBuilder()
    .setCollectionName("{collection_name}")
    .setVectorsConfig(VectorsConfig.newBuilder()
      .setParams(VectorParams.newBuilder()
        .setSize(128)
        .setDistance(Distance.Cosine)
        .setDatatype(Datatype.Float16)
        .build())
      .build())
    .setSparseVectorsConfig(
      SparseVectorConfig.newBuilder()
      .putMap("text", SparseVectorParams.newBuilder()
        .setIndex(SparseIndexConfig.newBuilder()
          .setDatatype(Datatype.Float16)
          .build())
        .build()))
    .build())
  .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParams {
    Size = 128,
      Distance = Distance.Cosine,
      Datatype = Datatype.Float16
  },
  sparseVectorsConfig: (
    "text",
    new SparseVectorParams {
      Index = new SparseIndexConfig {
        Datatype = Datatype.Float16
      }
    }
  )
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
		Size:     128,
		Distance: qdrant.Distance_Cosine,
		Datatype: qdrant.Datatype_Float16.Enum(),
	}),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"text": {
				Index: &qdrant.SparseIndexConfig{
					Datatype: qdrant.Datatype_Float16.Enum(),
				},
			},
		}),
})
```

**Uint8**

Another step towards memory optimization is to use the Uint8 datatype for vectors.
Unlike Float16, Uint8 is not a floating-point number, but an integer number in the range from 0 to 255.

Not all embeddings models generate vectors in the range from 0 to 255, so you need to be careful when using Uint8 datatype.

In order to convert a number from float range to Uint8 range, you need to apply a process called quantization.

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).

For other embeddings, you will need to apply quantization yourself.


<aside role="alert">
There is a difference in how Uint8 vectors are handled for dense and sparse vectors.
Dense vectors are required to be in the range from 0 to 255, while sparse vectors can be quantized in-flight.
</aside>


```http
PUT /collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "datatype": "uint8" // <-- For dense vectors
  },
  "sparse_vectors": {
    "text": {
      "index": {
        "datatype": "uint8" // <-- For sparse vectors 
      }
    }
  }
}
```


```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=128, distance=models.Distance.COSINE, datatype=models.Datatype.UINT8
    ),
    sparse_vectors_config={
        "text": models.SparseVectorParams(
            index=models.SparseIndexParams(datatype=models.Datatype.UINT8)
        ),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 128,
    distance: "Cosine",
    datatype: "uint8"
  },
  sparse_vectors: {
    text: {
      index: {
        datatype: "uint8"
      }
    }
  }
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, SparseIndexConfigBuilder,
    SparseVectorParamsBuilder, SparseVectorsConfigBuilder, VectorParamsBuilder,
};

use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut sparse_vector_config = SparseVectorsConfigBuilder::default();

sparse_vector_config.add_named_vector_params(
    "text",
    SparseVectorParamsBuilder::default()
        .index(SparseIndexConfigBuilder::default().datatype(Datatype::Uint8)),
);
let create_collection = CreateCollectionBuilder::new("{collection_name}")
    .sparse_vectors_config(sparse_vector_config)
    .vectors_config(
        VectorParamsBuilder::new(128, Distance::Cosine)
            .datatype(Datatype::Uint8)
    );

client.create_collection(create_collection).await?;
```


```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.SparseIndexConfig;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
  .createCollectionAsync(
    CreateCollection.newBuilder()
    .setCollectionName("{collection_name}")
    .setVectorsConfig(VectorsConfig.newBuilder()
      .setParams(VectorParams.newBuilder()
        .setSize(128)
        .setDistance(Distance.Cosine)
        .setDatatype(Datatype.Uint8)
        .build())
      .build())
    .setSparseVectorsConfig(
      SparseVectorConfig.newBuilder()
      .putMap("text", SparseVectorParams.newBuilder()
        .setIndex(SparseIndexConfig.newBuilder()
          .setDatatype(Datatype.Uint8)
          .build())
        .build()))
    .build())
  .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParams {
    Size = 128,
      Distance = Distance.Cosine,
      Datatype = Datatype.Uint8
  },
  sparseVectorsConfig: (
    "text",
    new SparseVectorParams {
      Index = new SparseIndexConfig {
        Datatype = Datatype.Uint8
      }
    }
  )
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
		Size:     128,
		Distance: qdrant.Distance_Cosine,
		Datatype: qdrant.Datatype_Uint8.Enum(),
	}),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"text": {
				Index: &qdrant.SparseIndexConfig{
					Datatype: qdrant.Datatype_Uint8.Enum(),
				},
			},
		}),
})
```

## Quantization

Apart from changing the datatype of the original vectors, Qdrant can create quantized representations of vectors alongside the original ones.
This quantized representation can be used to quickly select candidates for rescoring with the original vectors or even used directly for search.

Quantization is applied in the background, during the optimization process.

More information about the quantization process can be found in the [Quantization](/documentation/guides/quantization/) section.


## Vector Storage

Depending on the requirements of the application, Qdrant can use one of the data storage options.
Keep in mind that you will have to tradeoff between search speed and the size of RAM used.

More information about the storage options can be found in the [Storage](/documentation/concepts/storage/#vector-storage) section.
