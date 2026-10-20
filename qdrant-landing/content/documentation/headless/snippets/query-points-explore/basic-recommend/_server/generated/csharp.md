```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new RecommendInput {
        Positive = { 100, 231 },
        Negative = { 718, new float[] { 0.2f, 0.3f, 0.4f, 0.5f } },
        Strategy = RecommendStrategy.AverageVector
    },
    filter: MatchKeyword("city", "London"),
    limit: 3
);
```
