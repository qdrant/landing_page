```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine, Memory = Memory.Cached },
	hnswConfig: new HnswConfigDiff { Memory = Memory.Cold },
	quantizationConfig: new QuantizationConfig
	{
		Scalar = new ScalarQuantization { Type = QuantizationType.Int8, Memory = Memory.Pinned }
	},
	payload: new PayloadStorageParams { Memory = Memory.Cached }
);
```
