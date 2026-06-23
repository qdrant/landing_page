```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("cohere-api-key", "<YOUR_COHERE_API_KEY>"))
    await client.UpsertAsync(
        collectionName: "{collection_name}",
        points: new List<PointStruct>
        {
            new()
            {
                Id = 1,
                Vectors = new Image()
                {
                    Model = "cohere/embed-v4.0",
                    Image_ =
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC",
                    Options =
                    {
                        ["output_dimension"] = 512,
                    },
                },
            },
        }
    );
```
