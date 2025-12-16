```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
    payloadSelector: new WithPayloadSelector
    {
        Include = new PayloadIncludeSelector
        {
            Fields = { new string[] { "city", "village", "town" } }
        }
    },
    limit: 3
);
```
