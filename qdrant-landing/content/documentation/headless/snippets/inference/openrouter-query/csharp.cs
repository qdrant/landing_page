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
		  apiKey: "<your-openrouter-key>"
		);
		// @hide-end

		using (RequestHeaders.Use("openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>"))
		    await client.QueryAsync(
		        collectionName: "{collection_name}",
		        query: new Document()
		        {
		            Model = "openrouter/mistralai/mistral-embed-2312",
		            Text = "How to bake cookies?",
		        }
		    );
	}
}
