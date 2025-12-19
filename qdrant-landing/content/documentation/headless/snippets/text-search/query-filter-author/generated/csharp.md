```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
    collectionName: "books",
    query: new Document { Text = "time travel", Model = "sentence-transformers/all-minilm-l6-v2" },
    usingVector: "description-dense",
    filter: MatchKeyword("author", "H.G. Wells"),
    payloadSelector: true
);
```
