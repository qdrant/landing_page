```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
 collectionName: "{collection_name}",
 vectorsConfig: new VectorParams { Size = 1536, Distance = Distance.Cosine },
 quantizationConfig: new QuantizationConfig
 {
  Binary = new BinaryQuantization { AlwaysRam = true }
 }
);
```
