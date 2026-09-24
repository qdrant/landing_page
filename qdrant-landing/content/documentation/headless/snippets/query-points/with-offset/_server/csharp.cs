using Qdrant.Client; // @hide

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
		    payloadSelector: true,
		    vectorsSelector: true,
		    limit: 10,
		    offset: 100
		);
	}
}
