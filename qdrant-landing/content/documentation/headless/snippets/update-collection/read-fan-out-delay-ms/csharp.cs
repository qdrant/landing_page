using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.UpdateCollectionAsync(
			collectionName: "{collection_name}",
			collectionParams: new CollectionParamsDiff { ReadFanOutDelayMs = 100 }
		);
	}
}
