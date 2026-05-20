using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.UpsertAsync(
			collectionName: "documents",
			points: new List<PointStruct>
			{
				new()
				{
					Id = 200,
					Vectors = new Dictionary<string, Vector>(),
					Payload =
					{
						["title"] = "Document A",
						["text"] = "This is document A",
					},
				},
				new()
				{
					Id = 201,
					Vectors = new Dictionary<string, Vector>(),
					Payload =
					{
						["title"] = "Document B",
						["text"] = "This is document B",
					},
				},
			}
		);

		await client.UpsertAsync(
			collectionName: "chunks",
			points: new List<PointStruct>
			{
				new()
				{
					Id = 0,
					Vectors = new float[] { 0.1f, 0.2f, 0.3f, 0.4f },
					Payload = { ["document_id"] = 200 },
				},
				new()
				{
					Id = 1,
					Vectors = new float[] { 0.5f, 0.6f, 0.7f, 0.8f },
					Payload = { ["document_id"] = new Value[] { 200L, 201L } },
				},
			}
		);
	}
}
