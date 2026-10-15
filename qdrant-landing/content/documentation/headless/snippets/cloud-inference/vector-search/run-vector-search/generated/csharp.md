```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
collectionName: "{collection_name}", prefetch: new List <PrefetchQuery> {
  new() {
    Query = new Query { Text = new TextQuery { Query = queryText } },
    Using = "passage_text",
    Limit = 5
  },
  new() {
    Query = new Document {
      Text = queryText,
      Model = denseModel
    },
    Using = "dense_vector",
    Limit = 5
  }
},
query: Fusion.Rrf,
limit: 5
);
```
