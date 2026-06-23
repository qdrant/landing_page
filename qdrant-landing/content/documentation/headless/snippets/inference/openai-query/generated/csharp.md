```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("openai-api-key", "<YOUR_OPENAI_API_KEY>"))
    await client.QueryAsync(
        collectionName: "{collection_name}",
        query: new Document()
        {
            Model = "openai/text-embedding-3-large",
            Text = "How to bake cookies?",
            Options = { ["dimensions"] = 512 },
        }
    );
```
