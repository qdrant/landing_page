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
		    query: new RecommendInput {
		        Positive = { 100, 231 },
		        Negative = { 718 }
		    },
		    filter: MatchKeyword("city", "London"),
		    limit: 3
		);
	}
}
