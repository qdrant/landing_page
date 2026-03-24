```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document()
    {
        Model = "cohere/embed-v4.0",
        Text = "a green square",
        Options = { ["cohere-api-key"] = "<YOUR_COHERE_API_KEY>", ["output_dimension"] = 512 },
    }
);
```
