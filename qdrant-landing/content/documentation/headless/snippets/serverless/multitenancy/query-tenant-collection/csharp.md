```csharp
using Qdrant.Client.Grpc;

var results = await client.QueryAsync(
    collectionName: $"tenant-{tenantId}",
    query: new Document { Text = "quarterly report", Model = "sentence-transformers/all-minilm-l6-v2" },
    limit: 10
);
```
