using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.QueryAsync(
			collectionName: "{collection_name}",
			query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
			filter: MatchKeyword("city", "London"),
			searchParams: new SearchParams { HnswEf = 128, Exact = false },
			limit: 3,
			readConsistency: new ReadConsistency { Type = ReadConsistencyType.Majority }
		);
	}
}
