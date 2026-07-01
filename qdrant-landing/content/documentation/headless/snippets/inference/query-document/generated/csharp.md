```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document() { Model = "<the-model-to-use>", Text = "My Query Text" }
);
```
