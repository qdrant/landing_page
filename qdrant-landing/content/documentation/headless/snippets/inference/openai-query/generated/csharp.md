```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document()
    {
        Model = "openai/text-embedding-3-large",
        Text = "How to bake cookies?",
        Options = { ["openai-api-key"] = "<YOUR_OPENAI_API_KEY>", ["dimensions"] = 512 },
    }
);
```
