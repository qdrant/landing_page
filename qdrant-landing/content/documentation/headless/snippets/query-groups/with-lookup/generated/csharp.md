```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SearchGroupsAsync(
    collectionName: "{collection_name}",
    vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f},
    groupBy: "document_id",
    limit: 2,
    groupSize: 2,
    withLookup: new WithLookup
    {
        Collection = "documents",
        WithPayload = new WithPayloadSelector
        {
            Include = new PayloadIncludeSelector { Fields = { new string[] { "title", "text" } } }
        },
        WithVectors = false
    }
);
```
