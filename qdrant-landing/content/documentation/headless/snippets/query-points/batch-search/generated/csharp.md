```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

var filter = MatchKeyword("city", "London");

var queries = new List<QueryPoints>
{
    new()
    {
        CollectionName = "{collection_name}",
        Query = new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
        Filter = filter,
        Limit = 3
    },
    new()
    {
        CollectionName = "{collection_name}",
        Query = new float[] { 0.5f, 0.3f, 0.2f, 0.3f },
        Filter = filter,
        Limit = 3
    }
};

await client.QueryBatchAsync(collectionName: "{collection_name}", queries: queries);
```
