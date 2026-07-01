using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.CreateVectorNameAsync(new()
		{
			CollectionName = "{collection_name}",
			VectorName = "{vector_name}",
			SparseConfig = new() { Modifier = Modifier.Idf }
		});
	}
}
