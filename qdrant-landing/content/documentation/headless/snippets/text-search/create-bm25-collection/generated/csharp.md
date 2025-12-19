```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.CreateCollectionAsync(
    collectionName: "books",
    sparseVectorsConfig: ("title-bm25", new SparseVectorParams { Modifier = Modifier.Idf })
);
```
