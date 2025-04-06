```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new float[][] {
    [-0.013f, 0.020f, -0.007f, -0.111f],
    [-0.030f, -0.055f, 0.001 , 0.072f],
    [-0.041f, 0.014f, -0.032f, -0.062f],
  }
);
```
