```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch:
  [
    new PrefetchQuery { Query = new float[] { 0.01f, 0.45f, 0.67f }, Limit = 100 },
  ],
  query: new Formula
  {
    Expression = new SumExpression
    {
      Sum =
      {
        "$score",
        new MultExpression
        {
          Mult = { 0.5f, Match("tag", ["h1", "h2", "h3", "h4"]) },
        },
        new MultExpression { Mult = { 0.25f, Match("tag", ["p", "li"]) } },
      },
    },
  },
  limit: 10
);
```
