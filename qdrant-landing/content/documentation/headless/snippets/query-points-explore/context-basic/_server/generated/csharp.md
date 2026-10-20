```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new ContextInput {
    Pairs = {
      new ContextInputPair {
        Positive = 100,
          Negative = 718
      },
      new ContextInputPair {
        Positive = 200,
          Negative = 300
      },
    }
  },
  limit: 10
);
```
