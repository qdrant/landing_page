// @block-start upsert-no-auth
using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(host: "localhost", port: 6334, https: true);

		try
		{
			await client.CreateCollectionAsync(
				collectionName: "my_collection",
				vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
			);

			await client.UpsertAsync(
				collectionName: "my_collection",
				points: new List<PointStruct>
				{
					new() { Id = 1, Vectors = new[] { 0.1f, 0.2f, 0.3f, 0.4f } }
				}
			);
		}
		catch (Exception e)
		{
			Console.WriteLine(e.Message); // Unauthenticated
		}
		// @block-end upsert-no-auth

		// @block-start upsert-admin-key
		client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-admin-key");

		await client.CreateCollectionAsync(
			collectionName: "my_collection",
			vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
		);

		await client.UpsertAsync(
			collectionName: "my_collection",
			points: new List<PointStruct>
			{
				new() { Id = 1, Vectors = new[] { 0.1f, 0.2f, 0.3f, 0.4f } }
			}
		);
		// @block-end upsert-admin-key

		// @block-start delete-read-only-key
		client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-read-only-key");

		try
		{
			await client.DeleteAsync(collectionName: "my_collection", ids: (ulong[])[1]);
		}
		catch (Exception e)
		{
			Console.WriteLine(e.Message); // PermissionDenied
		}
		// @block-end delete-read-only-key

		// @block-start upsert-jwt-rw-collection
		client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "<your-jwt>");

		await client.UpsertAsync(
			collectionName: "my_collection",
			points: new List<PointStruct>
			{
				new() { Id = 2, Vectors = new[] { 0.5f, 0.6f, 0.7f, 0.8f } }
			}
		);
		// @block-end upsert-jwt-rw-collection

		// @block-start upsert-jwt-ro-collection
		client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "<your-jwt>");

		try
		{
			await client.UpsertAsync(
				collectionName: "other_collection",
				points: new List<PointStruct>
				{
					new() { Id = 2, Vectors = new[] { 0.5f, 0.6f, 0.7f, 0.8f } }
				}
			);
		}
		catch (Exception e)
		{
			Console.WriteLine(e.Message); // PermissionDenied
		}
		// @block-end upsert-jwt-ro-collection
	}
}
