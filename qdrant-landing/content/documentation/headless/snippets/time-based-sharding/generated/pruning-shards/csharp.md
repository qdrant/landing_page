```csharp
string today = "2026-04-08";
string oldestShardKey = DateOnly.ParseExact(today, "yyyy-MM-dd")
	.AddDays(-7)
	.ToString("yyyy-MM-dd");

await client.CreateShardKeyAsync(
	collectionName,
	new CreateShardKey { ShardKey = new ShardKey { Keyword = today } }
);
await client.DeleteShardKeyAsync(
	collectionName,
	new DeleteShardKey { ShardKey = new ShardKey { Keyword = oldestShardKey } }
);
```
