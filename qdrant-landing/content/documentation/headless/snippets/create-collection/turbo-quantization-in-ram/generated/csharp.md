```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams {
	    Size = 768, Distance = Distance.Cosine, Memory = Memory.Cold, Datatype = Datatype.Turbo4
	},
	quantizationConfig: new QuantizationConfig
	{
		Turboquant = new TurboQuantization { Memory = Memory.Pinned, Bits = TurboQuantBitSize.Bits1 }
	}
);
```
