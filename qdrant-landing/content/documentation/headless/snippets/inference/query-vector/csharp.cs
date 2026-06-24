using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new float[] { 0.12f, 0.34f, 0.56f, 0.78f }
		);
	}
}
