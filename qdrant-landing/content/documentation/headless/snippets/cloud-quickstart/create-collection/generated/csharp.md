```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "items",
	vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
);
```
