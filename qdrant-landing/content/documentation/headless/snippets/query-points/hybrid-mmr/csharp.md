```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new NearestInputWithMmr {
    Nearest = new float[] { 0.01f, 0.45f, 0.67f }, // search vector
    Mmr = new Mmr {
      Diversity = 0.5f, // 0.0 - relevance; 1.0 - diversity
      CandidatesLimit = 100 // num of candidates to preselect
    }
  },
  limit: 10,
);```
