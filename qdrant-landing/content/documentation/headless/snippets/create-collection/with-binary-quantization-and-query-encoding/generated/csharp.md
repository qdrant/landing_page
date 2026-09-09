```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParams { Size = 1536, Distance = Distance.Cosine },
  quantizationConfig: new QuantizationConfig
  {
    Binary = new BinaryQuantization {
      QueryEncoding = new BinaryQuantizationQueryEncoding
      {
        Setting = BinaryQuantizationQueryEncoding.Types.Setting.Scalar8Bits,
      },
      Memory = Memory.Pinned
    }
  }
);
```
