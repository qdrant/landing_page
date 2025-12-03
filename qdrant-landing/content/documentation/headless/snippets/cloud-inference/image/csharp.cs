using Qdrant.Client;
using Qdrant.Client.Grpc;
using Value = Qdrant.Client.Grpc.Value;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		  host: "xyz-example.qdrant.io",
		  port: 6334,
		  https: true,
		  apiKey: "<paste-your-api-key-here>"
		);

		await client.UpsertAsync(
		  collectionName: "<your-collection>",
		  points: new List <PointStruct> {
		    new() {
		      Id = 1,
		        Vectors = new Image() {
		          Image_ = "https://qdrant.tech/example.png",
		          Model = "qdrant/clip-vit-b-32-vision",
		        },
		        Payload = {
		          ["title"] = "Example Image"
		        },
		    },
		  }
		);

		var points = await client.QueryAsync(
		  collectionName: "<your-collection>",
		  query: new Document() {
		    Text = "Mission to Mars",
		    Model = "qdrant/clip-vit-b-32-text"
		  }
		);

		foreach(var point in points) {
		  Console.WriteLine(point);
		}
	}
}
