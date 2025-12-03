```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
    filter: MatchKeyword("city", "London"),
    searchParams: new SearchParams { Exact = false, HnswEf = 128 },
    limit: 3
);
```
