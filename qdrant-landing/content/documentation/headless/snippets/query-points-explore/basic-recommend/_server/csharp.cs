using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new RecommendInput {
		        Positive = { 100, 231 },
		        Negative = { 718, new float[] { 0.2f, 0.3f, 0.4f, 0.5f } },
		        Strategy = RecommendStrategy.AverageVector
		    },
		    filter: MatchKeyword("city", "London"),
		    limit: 3
		);
	}
}
