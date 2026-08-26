```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
 collectionName: "{collection_name}",
 vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
 quantizationConfig: new QuantizationConfig
 {
  Product = new ProductQuantization { Compression = CompressionRatio.X16, Memory = Memory.Pinned }
 }
);
```
