using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient(
		  host: "xyz-example.qdrant.io",
		  port: 6334,
		  https: true,
		  apiKey: "<your-api-key>"
		);
		// @hide-end

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new Document() { Model = "<the-model-to-use>", Text = "My Query Text" }
		);
	}
}
