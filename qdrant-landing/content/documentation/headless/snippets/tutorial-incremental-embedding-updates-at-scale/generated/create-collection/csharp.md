```csharp
var MAIN = "docs-sync-scale";
var MODEL = "sentence-transformers/all-MiniLM-L6-v2";

if (!await client.CollectionExistsAsync(MAIN))
{
	await client.CreateCollectionAsync(
		collectionName: MAIN,
		vectorsConfig: new VectorParams
		{
			Size = 384,
			Distance = Distance.Cosine
		},
		metadata: new()
		{
			["embedding_model"] = MODEL,
			["pipeline_version"] = "1"
		}
	);
	await client.CreatePayloadIndexAsync(MAIN, "sync_bucket", PayloadSchemaType.Integer);
}
```
