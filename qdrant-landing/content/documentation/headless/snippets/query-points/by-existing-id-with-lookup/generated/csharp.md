```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: Guid.Parse("43cf51e2-8777-4f52-bc74-c2cbde0c8b04"), // <--- point id
  usingVector: "512d-vector",
  lookupFrom: new() {
    CollectionName = "another_collection", // <--- other collection name
      VectorName = "image-512" // <--- vector name in the other collection
  }
);
```
