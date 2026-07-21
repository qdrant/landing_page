```csharp
var MODEL = "sentence-transformers/all-MiniLM-L6-v2";
var PIPELINE = "docs-prep-pipeline-v1";
var COLLECTION = "docs-sync-tutorial";

await client.CreateCollectionAsync(
	collectionName: COLLECTION,
	vectorsConfig: new VectorParams
	{
		Size = 384, // all-MiniLM-L6-v2 output dimension
		Distance = Distance.Cosine
	},
	metadata: new()
	{
		["embedding_model"] = MODEL,
		["pipeline_version"] = PIPELINE
	}
);
```
