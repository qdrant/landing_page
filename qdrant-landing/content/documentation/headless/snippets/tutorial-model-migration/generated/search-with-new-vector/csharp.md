```csharp
var newVectorResults = await client.QueryAsync(
	collectionName: COLLECTION,
	query: new Document { Text = "my query", Model = NEW_MODEL },
	usingVector: NEW_VECTOR,
	limit: 10
);
```
