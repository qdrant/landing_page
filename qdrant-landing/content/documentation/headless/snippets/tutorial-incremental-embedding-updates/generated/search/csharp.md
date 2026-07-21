```csharp
var QUERY = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

await client.QueryAsync(
	collectionName: COLLECTION,
	query: new Document { Text = QUERY, Model = MODEL },
	limit: 3,
	payloadSelector: new[] { "section_url", "text" }
);
```
