using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.QueryGroupsAsync(
		    collectionName: "{collection_name}",
		    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
		    groupBy: "document_id",
		    limit: 4,
		    groupSize: 2
		);
	}
}
