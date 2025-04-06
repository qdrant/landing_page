```csharp
using Qdrant.Client;

await client.FacetAsync(
    "{collection_name}",
    key: "size",
    exact: true,
);
```
