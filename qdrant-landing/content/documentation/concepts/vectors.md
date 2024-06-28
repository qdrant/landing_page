---
title: Vectors
weight: 41
aliases:
  - ../vectors
---


# Vectors

Vectors (or embeddings) are the core concept of the Qdrant Vector Search engine. 
Vectors define similarity between objects in the vector space.

If a pair of vectors are similar in the vector space, it means that the objects they represent are similar in some way.

For example, if you have a collection of images, you can represent each image as a vector.
If two images are similar, their vectors will be close to each other in the vector space.

In order to obtain a vector representation of an object, you need to apply a vectorization algorithm to the object.
Usually, this algorithm is a neural network that converts the object into a fixed-size vector.

The neural network is usually [trained](../articles/metric-learning-tips/) on a pairs or [triplets](../articles/triplet-loss/) of similar and dissimilar objects, so it learns to recognize a specific type of similarity.

By using this property of vectors, you can explore your data in a variety of ways, such as searching for similar objects, clustering objects, and more.


## Vector types

Modern neural networks can output vectors in different shapes and sizes, and Qdrant supports most of them.
Let's take a look at the most common types of vectors, supported by Qdrant.


### Dense Vectors

This is the most common type of vector. It is a simple list of numbers, it have a fixed length and each element of the list is a floating-point number.

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

Majority of the neural networks output dense vectors, so you can use them in Qdrant without any additional processing.
See a list of embedding models that we are sure will work with Qdrant out of the box in the [Embedding Providers](../embeddings/) section.

### Sparse Vectors

Sparse vectors are a special type of vectors. 
Mathematically, they are the same as dense vectors, but they have a lot of zeros in them so they are stored in a special format.

Sparse vectors in Qdrant don't have a fixed length, as it is dynamically allocated during the vector insertion.

In order to define a sparse vector, you need to provide a list of non-zero elements and their indexes.

```json
// A sparse vector with 4 non-zero elements
{
    "indexes": [1, 3, 5, 7],
    "values": [0.1, 0.2, 0.3, 0.4]
}
```

Sparse vectors in Qdrant are stored in a special storage and indexed in a special index, so their configuration is different from dense vectors.

To create collection with sparse vectors:


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
use qdrant_client::{
    client::QdrantClient,
    qdrant::{CreateCollection, SparseVectorConfig, SparseVectorParams},
};


let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        sparse_vectors_config: Some(SparseVectorConfig {
            map: [(
                "text".to_string(),
                SparseVectorParams {
                    ..Default::default()
                },
            )]
            .into(),
            ..Default::default()
        }),
        ..Default::default()
    })
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

Insert a point with sparse vector into the created collection:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 129,
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
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=129,
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

<!-- TODO: Add examples for other languages -->

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
      .setId(id(129))
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
      Id = 129,
        Vectors = new Dictionary < string, Vector > {
          ["text"] = ([0.1 f, 0.2 f, 0.3 f, 0.4 f], [1, 3, 5, 7])
        }
    }
  }
);
```

And search with sparse vectors:

```http
POST /collections/{collection_name}/points/search
{
    "vector": {
        "name": "text",
        "vector": {
            "indices": [1, 3, 5, 7],
            "values": [0.1, 0.2, 0.3, 0.4]
        }
    }
}
```

```python
# Searching for similar documents
result = client.search(
    collection_name="{collection_name}",
    query_vector=models.NamedSparseVector(
        name="text",
        vector=models.SparseVector(
            indices=[1, 3, 5, 7],
            values=[0.1, 0.2, 0.3, 0.4]
        ),
    )
)
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.SparseIndices;
import io.qdrant.client.grpc.Points.Vectors;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
  .searchAsync(
    SearchPoints.newBuilder()
    .setCollectionName("{collection_name}")
    .setVectorName("text")
    .addAllVector(List.of(0.1f, 0.2f, 0.3f, 0.4f))
    .setSparseIndices(SparseIndices.newBuilder().addAllData(List.of(1, 3, 5, 7)).build())
    .setLimit(3)
    .build())
  .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
  collectionName: "{collection_name}",
  vector: new float[] {0.1f, 0.2f, 0.3f, 0.4f},
  vectorName: "text",
  limit: 3,
  sparseIndices: new uint[] {1, 3, 5, 7}
);
```


### Multivectors

**Available as of v1.10.0**

Qdrant supports storing variable amount of same-shaped dense vectors in a single point.
That means that instead of a single dense vector, you can upload a matrix of dense vectors.

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

There are two scenarios where multivectors can be useful:

* **Multiple representation of the same object** - For example, you can store multiple embeddings for pictures of the same object, taken from different angles. This approach assumes that the payload is same for all vectors.
* **Late Interaction Embeddings** - Some text embedding models can output multiple vectors for a single text. 
For example, a family of models like ColBERT output a relatively small vector for each token in the text. 

In order to use multivectors, we need to specify a fuction that will be used to compare matrices of vectors between each other.

Currently, Qdrant supports `max_sim` function, that is defined as a sum of maximum similarities between each pair of vectors in the matrices.

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

And search with multivector (available in `query ` API): 

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


## Named vectors

Aside from storing multiple vectors of the same shape in a single point, Qdrant supports storing multiple different vectors in a single point.

Each of these vectors should have a unique configuration and should be addressed by a unique name.

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
            "size": 8,
            "distance": "Cosine"
        }
    }
}
```

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
        "image": {
            "size": 4,
            "distance": "Dot"
        },
        "text": {
            "size": 8,
            "distance": "Cosine"
        }
      }
    }'
```

```python
from qdrant_client import QdrantClient, models


client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={
        "image": models.VectorParams(size=4, distance=models.Distance.DOT),
        "text": models.VectorParams(size=8, distance=models.Distance.COSINE),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    image: { size: 4, distance: "Dot" },
    text: { size: 8, distance: "Cosine" },
  },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        vectors_config::Config, CreateCollection, Distance, VectorParams, VectorParamsMap,
        VectorsConfig,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::ParamsMap(VectorParamsMap {
                map: [
                    (
                        "image".to_string(),
                        VectorParams {
                            size: 4,
                            distance: Distance::Dot.into(),
                            ..Default::default()
                        },
                    ),
                    (
                        "text".to_string(),
                        VectorParams {
                            size: 8,
                            distance: Distance::Cosine.into(),
                            ..Default::default()
                        },
                    ),
                ]
                .into(),
            })),
        }),
        ..Default::default()
    })
    .await?;
```

```java
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        "{collection_name}",
        Map.of(
            "image", VectorParams.newBuilder().setSize(4).setDistance(Distance.Dot).build(),
            "text",
                VectorParams.newBuilder().setSize(8).setDistance(Distance.Cosine).build()))
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParamsMap {
    Map = {
      ["image"] = new VectorParams {
        Size = 4, Distance = Distance.Dot
      },
      ["text"] = new VectorParams {
        Size = 8, Distance = Distance.Cosine
      },
    }
  }
);
```


<!-- ToDo: Examples of insert and search -->


## Datatypes

Newest versions of embeddings models generate vectors with very large dimentionality.
In openai `text-embedding-3-large` embedding model the dimentionality goes up to 3072.

The size of memory required to store such vectors grows linearly with the dimentionality,
so it is important to choose the right datatype for the vectors.

The choice between datatypes is a trade-off between the memory consumption and the precision of the vectors.

Qdrant supports a number of datatypes for both dense and sparse vectors:

**Float32**

This is a default datatype for vectors in Qdrant. It is a 32-bit (4 bytes) floating-point number. 
Standard OpenAI embedding of 1536 dimentionality will require 6KB of memory to store in Float32.

You don't need to specify the datatype for vectors in Qdrant, as it is set to Float32 by default.

**Float16**

This is a 16-bit (2 bytes) floating-point number. Also known as half-precision float.
Intuitively, it looks like this:

```text
float32 -> float16 delta (float32 - float16).abs

0.79701585 -> 0.796875   delta 0.00014084578
0.7850789  -> 0.78515625 delta 0.00007736683
0.7775044  -> 0.77734375 delta 0.00016063452
0.85776305 -> 0.85791016 delta 0.00014710426
0.6616839  -> 0.6616211  delta 0.000062823296
```

The main advantage of Float16 is that it requires half the memory of Float32, while having virtually no impact on the quality of the vector search.

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

**Uint8**

Another step towards memory optimization is to use Uint8 datatype for vectors.
Unlike Float16, Uint8 is not a floating-point number, but an integer number in the range from 0 to 255.

Not all embeddings models generate vectors in the range from 0 to 255, so you need to be careful when using Uint8 datatype.

In order to convert a number from float range to Uint8 range, you need to apply a process called quantization.

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).

For other embeddings, you need to apply quantization yourself.


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
        "datatype": "uint8" // <-- And for sparse vectors 
      }
    }
  }
}
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

## Quantization

Apart from changing the datatype of the original vectors, qdrant can create quantized representations of the vectors alongside the original ones.
This quantized representation can be used to quickly select candidates for rescoring with the original vectors, or even used directly for search.

Quantization is applied in background, during the optimization process.

More information about the quantization process can be found in the [Quantization](../guides/quantization/) section.


## Vector storage

Depending on the requirements of the application, Qdrant can use one of the data storage options.
The choice has to be made between the search speed and the size of the RAM used.


More information about the storage options can be found in the [Storage](../concepts/storage/#vector-storage) section.
