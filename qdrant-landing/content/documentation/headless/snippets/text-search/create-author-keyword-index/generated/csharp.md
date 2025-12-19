```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.CreatePayloadIndexAsync(
    collectionName: "books",
    fieldName: "author",
    schemaType: PayloadSchemaType.Keyword
);
```
