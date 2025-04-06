```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: Guid.Parse("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")
);
```
