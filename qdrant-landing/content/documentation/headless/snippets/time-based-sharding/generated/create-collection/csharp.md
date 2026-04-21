```csharp
string collectionName = "my_collection";

if (await client.CollectionExistsAsync(collectionName))
	await client.DeleteCollectionAsync(collectionName);

await client.CreateCollectionAsync(
	collectionName: collectionName,
	vectorsConfig: new VectorParamsMap
	{
		Map = {
			["dense_vector"] = new VectorParams { Size = 384, Distance = Distance.Cosine }
		}
	},
	shardingMethod: ShardingMethod.Custom
);
```
