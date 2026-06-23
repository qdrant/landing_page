```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>"))
    await client.QueryAsync(
        collectionName: "{collection_name}",
        query: new Document()
        {
            Model = "openrouter/mistralai/mistral-embed-2312",
            Text = "How to bake cookies?",
        }
    );
```
