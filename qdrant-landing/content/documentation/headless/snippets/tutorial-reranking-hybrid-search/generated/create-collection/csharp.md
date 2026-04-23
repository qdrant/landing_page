```csharp
string collectionName = "hybrid-search";

if (await client.CollectionExistsAsync(collectionName))
	await client.DeleteCollectionAsync(collectionName);

await client.CreateCollectionAsync(
	collectionName: collectionName,
	vectorsConfig: new VectorParamsMap
	{
		Map =
		{
			["dense"] = new VectorParams
			{
				Size = 384,
				Distance = Distance.Cosine,
			},
			["multi"] = new VectorParams
			{
				Size = 96,
				Distance = Distance.Cosine,
				MultivectorConfig = new() { Comparator = MultiVectorComparator.MaxSim },
				HnswConfig = new HnswConfigDiff { M = 0 }, // Disable HNSW for reranking
			},
		}
	},
	sparseVectorsConfig: new SparseVectorConfig
	{
		Map =
		{
			["sparse"] = new SparseVectorParams { Modifier = Modifier.Idf }
		}
	}
);
```
