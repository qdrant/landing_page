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
            // the time coordinate (the first value) is negated
            Query = new float[] { -3.2f, 0.3f, 0.4f },
            Limit = 100,
        },
    ],
    query: new Formula
    {
        Expression = new MultExpression
        {
            Mult =
            {
                -3.1622776601683795f, // -1 / sqrt(0.1)
                Expression.FromAcosh(
                    new MultExpression { Mult = { 0.1f, Expression.FromNeg("$score") } }
                ),
            },
        },
    },
    limit: 10
);
```
