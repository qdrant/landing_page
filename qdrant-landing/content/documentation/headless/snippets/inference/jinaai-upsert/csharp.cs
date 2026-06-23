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
		    await client.UpsertAsync(
		        collectionName: "{collection_name}",
		        points: new List<PointStruct>
		        {
		            new()
		            {
		                Id = 1,
		                Vectors = new Image()
		                {
		                    Model = "jinaai/jina-clip-v2",
		                    Image_ = "https://qdrant.tech/example.png",
		                    Options = { ["dimensions"] = 512 },
		                },
		            },
		        }
		    );
	}
}
