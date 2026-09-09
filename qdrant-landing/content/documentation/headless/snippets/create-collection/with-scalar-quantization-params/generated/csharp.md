```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
 collectionName: "{collection_name}",
 vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
 quantizationConfig: new QuantizationConfig
 {
  Scalar = new ScalarQuantization
  {
   Type = QuantizationType.Int8,
   Quantile = 0.99f,
   Memory = Memory.Pinned
  }
 }
);
```
