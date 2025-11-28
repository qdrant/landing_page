```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.FacetAsync(
    "{collection_name}",
    key: "size",
    exact: true
);
```
