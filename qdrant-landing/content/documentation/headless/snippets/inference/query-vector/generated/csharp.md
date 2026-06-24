```csharp
using Qdrant.Client;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new float[] { 0.12f, 0.34f, 0.56f, 0.78f }
);
```
