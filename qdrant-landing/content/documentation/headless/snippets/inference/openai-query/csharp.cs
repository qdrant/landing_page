using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		  host: "xyz-example.qdrant.io",
		  port: 6334,
		  https: true,
		  apiKey: "<your-api-key>"
		);

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new Document()
		    {
		        Model = "openai/text-embedding-3-large",
		        Text = "How to bake cookies?",
		        Options = { ["openai-api-key"] = "<YOUR_OPENAI_API_KEY>", ["dimensions"] = 512 },
		    }
		);
	}
}
