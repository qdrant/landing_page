```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 1536, Distance = Distance.Cosine },
	quantizationConfig: new QuantizationConfig
	{
		Turboquant = new TurboQuantization { Memory = Memory.Pinned }
	}
);
```
