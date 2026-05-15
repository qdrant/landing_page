using Qdrant.Client; // @hide
using Qdrant.Client.Grpc; // @hide

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		// @block-start get-current-value
		var collectionInfo = await client.GetCollectionInfoAsync("{collection_name}");
		var baseEf = collectionInfo.Config.HnswConfig.EfConstruct;
		// @block-end get-current-value

		// @block-start update-collection
		await client.UpdateCollectionAsync(
			collectionName: "{collection_name}",
			hnswConfig: new HnswConfigDiff { EfConstruct = baseEf + 1 }
		);
		// @block-end update-collection
	}
}
