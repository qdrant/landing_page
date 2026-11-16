```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch:
    [
        new PrefetchQuery
        {
            Query = new Query { Text = new TextQuery { Query = "vector database" } },
            Using = "title",
            Limit = 50,
        },
        new PrefetchQuery
        {
            Query = new Query { Text = new TextQuery { Query = "vector database" } },
            Using = "body",
            Limit = 50,
        },
    ],
    query: new Formula
    {
        Expression = new MaxExpression
        {
            Max =
            {
                new MultExpression { Mult = { 3.0f, "$score[0]" } }, // boost title matches
                "$score[1]",
            },
        },
    },
    limit: 10
);
```
