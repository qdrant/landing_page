using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-api-key>");

		await client.UpsertAsync(
		    collectionName: "{collection_name}",
		    points: new List<PointStruct>
		    {
		        new()
		        {
		            Id = 1,
		            Vectors = new Image()
		            {
		                Model = "cohere/embed-v4.0",
		                Image_ =
		                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC",
		                Options =
		                {
		                    ["cohere-api-key"] = "<YOUR_COHERE_API_KEY>",
		                    ["output_dimension"] = 512,
		                },
		            },
		        },
		    }
		);
	}
}
