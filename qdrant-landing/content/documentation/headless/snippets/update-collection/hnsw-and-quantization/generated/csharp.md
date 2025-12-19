```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	hnswConfig: new HnswConfigDiff { EfConstruct = 123 },
	vectorsConfig: new VectorParamsDiffMap
	{
		Map =
		{
			{
				"my_vector",
				new VectorParamsDiff
				{
					HnswConfig = new HnswConfigDiff { M = 3, EfConstruct = 123 }
				}
			}
		}
	},
	quantizationConfig: new QuantizationConfigDiff
	{
		Scalar = new ScalarQuantization
		{
			Type = QuantizationType.Int8,
			Quantile = 0.8f,
			AlwaysRam = true
		}
	}
);
```
