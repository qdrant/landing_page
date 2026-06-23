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

		using (RequestHeaders.Use("jina-api-key", "<YOUR_JINAAI_API_KEY>"))
		    await client.QueryAsync(
		        collectionName: "{collection_name}",
		        query: new Document()
		        {
		            Model = "jinaai/jina-clip-v2",
		            Text = "Mission to Mars",
		            Options = { ["dimensions"] = 512 },
		        }
		    );
	}
}
