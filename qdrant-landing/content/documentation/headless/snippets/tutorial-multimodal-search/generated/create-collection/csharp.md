```csharp
string collectionName = "multimodal-embeddings";

if (!await client.CollectionExistsAsync(collectionName))
{
	await client.CreateCollectionAsync(
		collectionName: collectionName,
		vectorsConfig: new VectorParamsMap
		{
			Map =
			{
				["image"] = new VectorParams { Size = 512, Distance = Distance.Cosine },
				["text"] = new VectorParams { Size = 512, Distance = Distance.Cosine },
			}
		}
	);
}
```
