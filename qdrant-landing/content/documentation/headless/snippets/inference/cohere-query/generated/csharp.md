```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("cohere-api-key", "<YOUR_COHERE_API_KEY>"))
    await client.QueryAsync(
        collectionName: "{collection_name}",
        query: new Document()
        {
            Model = "cohere/embed-v4.0",
            Text = "a green square",
            Options = { ["output_dimension"] = 512 },
        }
    );
```
