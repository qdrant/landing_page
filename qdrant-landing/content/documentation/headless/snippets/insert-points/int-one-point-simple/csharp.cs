using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.UpsertAsync(
			collectionName: "{collection_name}",
			points: new List<PointStruct>
			{
				new()
				{
					Id = 1,
					Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
					Payload = { ["color"] = "Red" }
				}
			}
		);
	}
}
