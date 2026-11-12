```csharp
		await client.CountAsync(
            collectionName: COLLECTION,
            filter: new Filter { MustNot = { HasVector(NEW_VECTOR) } },
            exact: true
		);
```
