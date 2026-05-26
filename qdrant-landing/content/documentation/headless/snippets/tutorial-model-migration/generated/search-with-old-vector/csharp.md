```csharp
var oldVectorResults = await client.QueryAsync(
	collectionName: COLLECTION,
	query: new Document { Text = "my query", Model = OLD_MODEL },
	usingVector: OLD_VECTOR,
	limit: 10
);
```
