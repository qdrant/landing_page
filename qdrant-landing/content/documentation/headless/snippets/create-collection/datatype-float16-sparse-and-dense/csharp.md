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
