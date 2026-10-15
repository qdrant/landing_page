```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.SearchMatrixOffsetsAsync(
    collectionName: "{collection_name}",
    filter: MatchKeyword("color", "red"),
    sample: 10,
    limit: 2
);
```
