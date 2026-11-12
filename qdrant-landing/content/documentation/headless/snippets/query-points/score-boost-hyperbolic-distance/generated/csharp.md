```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch:
    [
        new PrefetchQuery
        {
            // the sign of the first element is flipped
            Query = new float[] { -1.118f, 0.3f, 0.4f },
            Limit = 100,
        },
    ],
    query: new Formula
    {
        Expression = Expression.FromNeg(Expression.FromAcosh(Expression.FromNeg("$score"))),
    },
    limit: 10
);
```
