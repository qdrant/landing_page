```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document() { Model = "qdrant/bm25", Text = "How to bake cookies?" },
    usingVector: "my-bm25-vector"
);
```
