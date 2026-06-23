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

		using (RequestHeaders.Use("cohere-api-key", "<YOUR_COHERE_API_KEY>"))
		    await client.QueryAsync(
		        collectionName: "{collection_name}",
		        query: new Document()
		        {
		            Model = "cohere/embed-v4.0",
		            Text = "a green square",
		            Options = { ["output_dimension"] = 512 },
		        }
		    );
	}
}
