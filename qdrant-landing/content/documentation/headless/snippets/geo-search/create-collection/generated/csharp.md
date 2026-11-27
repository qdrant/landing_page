```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "venues",
	vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
);
```
