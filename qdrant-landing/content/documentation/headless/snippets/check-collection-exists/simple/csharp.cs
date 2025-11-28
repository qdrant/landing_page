using Qdrant.Client; // @hide

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide
		await client.CollectionExistsAsync("{collection_name}");
	}
}
