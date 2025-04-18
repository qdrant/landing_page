```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Expression;

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
                FromExpDecay(
                    new()
                    {
                        X = new GeoDistance
                        {
                            Origin = new GeoPoint { Lat = 52.504043, Lon = 13.393236 },
                            To = "geo.location",
                        },
                        Scale = 5000,
                    }
                ),
            },
        },
        Defaults =
        {
            ["geo.location"] = new Dictionary<string, Value>
            {
                ["lat"] = 48.137154,
                ["lon"] = 11.576124,
            },
        },
    }
);
```
