```csharp
using Qdrant.Client.Grpc;

var results = await client.QueryAsync(
    collectionName: "menu",
    query: new TextQuery { Query = "tahini" },
    usingVector: "description",
    limit: 3,
    payloadSelector: true
);

foreach (var hit in results)
{
    Console.WriteLine($"{hit.Payload["name"].StringValue} {hit.Score}");
}
```
