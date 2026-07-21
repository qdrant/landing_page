```csharp
foreach (var field in new[] { "content_hash", "url", "section_url" })
	await client.CreatePayloadIndexAsync(COLLECTION, field, PayloadSchemaType.Keyword);
```
