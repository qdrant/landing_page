```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

var filter = MatchKeyword("city", "london");

await client.QueryBatchAsync(
    collectionName: "{collection_name}",
    queries:
    [
        new QueryPoints()
        {
            CollectionName = "{collection_name}",
            Query = new RecommendInput {
                Positive = { 100, 231 },
                Negative = { 718 },
            },
            Limit = 3,
            Filter = filter,
        },
                new QueryPoints()
        {
            CollectionName = "{collection_name}",
            Query = new RecommendInput {
                Positive = { 200, 67 },
                Negative = { 300 },
            },
            Limit = 3,
            Filter = filter,
        }
    ]
);
```
