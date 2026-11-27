```csharp
using Serverless = Qdrant.Client.Grpc.Serverless;

var tenantId = "acme";

await client.CreateCollectionAsync(
    collectionName: $"tenant-{tenantId}",
    config: new Serverless.DenseVectorConfig { Size = 384, Distance = Serverless.Distance.Cosine }
);
```
