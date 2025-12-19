```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch:
    [
        new PrefetchQuery {
            Query = new float[] { 0.1f, 0.45f, 0.67f }, // <-- dense vector
            Limit = 50
        },
    ],
    query: new Formula
     {
        Expression = new SumExpression
        {
            Sum = //  the final score = score + exp_decay(target_time - x_time)
            {
                "$score",
                Expression.FromExpDecay(
                    new()
                    {
                        X = Expression.FromDateTimeKey("update_time"),  // payload key
                        Target = Expression.FromDateTime("YYYY-MM-DDT00:00:00Z"),  // current datetime
                        Midpoint = 0.5f,
                        Scale = 86400 // 1 day in seconds
                    }
                )
            }
        }
    }
);
```
