```csharp
await client.UpdateAliasesAsync(new AliasOperations[]
{
	new() { DeleteAlias = new DeleteAlias { AliasName = "prod" } },
	new()
	{
		CreateAlias = new CreateAlias
		{
			AliasName = "prod",
			CollectionName = NEW_COLLECTION
		}
	}
});
```
