```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("openai-api-key", "<YOUR_OPENAI_API_KEY>"))
    await client.UpsertAsync(
        collectionName: "{collection_name}",
        points: new List<PointStruct>
        {
            new()
            {
                Id = 1,
                Vectors = new Document()
                {
                    Model = "openai/text-embedding-3-large",
                    Text = "Recipe for baking chocolate chip cookies",
                },
            },
        }
    );
```
