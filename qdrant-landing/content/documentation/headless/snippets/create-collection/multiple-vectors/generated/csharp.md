```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParamsMap
	{
		Map =
		{
			["image"] = new VectorParams { Size = 4, Distance = Distance.Dot },
			["text"] = new VectorParams { Size = 8, Distance = Distance.Cosine },
		}
	}
);
```
