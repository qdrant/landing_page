```csharp
client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-admin-key");

await client.CreateCollectionAsync(
	collectionName: "my_collection",
	vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
);

await client.UpsertAsync(
	collectionName: "my_collection",
	points: new List<PointStruct>
	{
		new() { Id = 1, Vectors = new[] { 0.1f, 0.2f, 0.3f, 0.4f } }
	}
);
```
