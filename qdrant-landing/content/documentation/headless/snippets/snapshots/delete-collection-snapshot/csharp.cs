using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.DeleteSnapshotAsync(collectionName: "{collection_name}", snapshotName: "{snapshot_name}");
	}
}
