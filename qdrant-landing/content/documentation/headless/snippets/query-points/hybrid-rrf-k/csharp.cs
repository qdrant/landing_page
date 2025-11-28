using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.QueryAsync(
		  collectionName: "{collection_name}",
		  prefetch: new List<PrefetchQuery>
		  {
			  // 2+ prefetches here
		  },
		  query: new Rrf
		  {
			  K = 60,
		  }
		);
	}
}
