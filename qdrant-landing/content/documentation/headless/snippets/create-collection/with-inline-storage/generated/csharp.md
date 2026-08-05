```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine, Memory = Memory.Cold },
	quantizationConfig: new QuantizationConfig
	{
		Binary = new BinaryQuantization { Memory = Memory.Cold }
	},
	hnswConfig: new HnswConfigDiff { Memory = Memory.Cold, InlineStorage = true }
);
```
