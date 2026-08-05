using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.CreateCollectionAsync(
			"{collection_name}",
			new VectorParams
			{
				Size = 768,
				Distance = Distance.Cosine,
				Memory = Memory.Cold
			}
		);
	}
}
