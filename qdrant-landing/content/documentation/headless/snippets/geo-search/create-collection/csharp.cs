using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-api-key>"); // @hide

		await client.CreateCollectionAsync(
			collectionName: "venues",
			vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
		);
	}
}
