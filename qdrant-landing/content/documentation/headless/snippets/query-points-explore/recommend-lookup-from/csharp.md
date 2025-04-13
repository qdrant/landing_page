```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new RecommendInput {
        Positive = { 100, 231 },
        Negative = { 718 }
    },
    usingVector: "image",
    limit: 10,
    lookupFrom: new LookupLocation
    {
        CollectionName = "{external_collection_name}",
        VectorName = "{external_vector_name}",
    }
);
```
