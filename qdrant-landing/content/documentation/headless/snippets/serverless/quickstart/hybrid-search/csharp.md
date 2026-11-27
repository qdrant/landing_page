```csharp
using Qdrant.Client.Grpc;

var query = "a vegetarian dish with tahini";

var results = await client.QueryAsync(
    collectionName: "menu",
    prefetch: new List<PrefetchQuery>
    {
        new()
        {
            Query = new Document { Text = query, Model = model },
            Using = "dense",
            Limit = 10
        },
        new()
        {
            Query = new TextQuery { Query = query },
            Using = "description",
            Limit = 10
        }
    },
    query: Fusion.Rrf,
    limit: 3,
    payloadSelector: true
);

foreach (var hit in results)
{
    Console.WriteLine($"{hit.Payload["name"].StringValue} {hit.Score}");
}
```
