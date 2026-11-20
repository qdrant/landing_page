using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.QueryAsync(
		  collectionName: "{collection_name}",
		  prefetch: new List <PrefetchQuery> {
		    new() {
		      Query = new float[] {
		          0.01f, 0.45f, 0.67f
		        },
		        Filter = Range("price", new Qdrant.Client.Grpc.Range { Gte = 10, Lte = 80 }),
		        Limit = 100
		    }
		  },
		  query: new OrderBy { Key = "price", Direction = Direction.Asc },
		  payloadSelector: true,
		  limit: 10
		);
	}
}
