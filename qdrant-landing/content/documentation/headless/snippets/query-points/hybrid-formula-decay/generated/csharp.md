```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch:
    [
        new PrefetchQuery {
            Prefetch = {
                new PrefetchQuery {
                    Query = new(float, uint)[] { (0.22f, 1), (0.8f, 42) },
                    Using = "sparse",
                    Limit = 100
                },
                new PrefetchQuery {
                    Query = new float[] { 0.01f, 0.45f, 0.67f },
                    Using = "dense",
                    Limit = 100
                },
            },
            Query = new Rrf(),
            Limit = 100
        },
    ],
    query: new Formula
    {
        Expression = new SumExpression
        {
            Sum =
            {
                "$score", // the fused score from the RRF prefetch
                Expression.FromExpDecay(
                    new()
                    {
                        X = Expression.FromDateTimeKey("published_at"),
                        Target = Expression.FromDateTime("YYYY-MM-DDT00:00:00Z"),
                        Scale = 86400 * 180, // 180 days in seconds
                        Midpoint = 0.5f
                    }
                )
            }
        }
    },
    limit: 10
);
```
