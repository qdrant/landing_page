using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.SearchMatrixPairsAsync(
		    collectionName: "{collection_name}",
		    filter: MatchKeyword("color", "red"),
		    sample: 10,
		    limit: 2
		);
	}
}
