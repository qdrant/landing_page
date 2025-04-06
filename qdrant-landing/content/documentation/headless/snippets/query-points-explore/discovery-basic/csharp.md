```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new DiscoverInput {
        Target = new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
        Context = new ContextInput {
            Pairs = {
                new ContextInputPair {
                    Positive = 100,
                    Negative = 718
                },
                new ContextInputPair {
                    Positive = 200,
                    Negative = 300
                },
            }   
        },
    },
    limit: 10
);
```
