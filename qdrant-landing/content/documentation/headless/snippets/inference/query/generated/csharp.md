```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient(
  host: "xyz-example.qdrant.io",
  port: 6334,
  https: true,
  apiKey: "<your-api-key>"
);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document() { Model = "qdrant/bm25", Text = "How to bake cookies?" },
    usingVector: "my-bm25-vector"
);
```
