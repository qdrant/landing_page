using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.UpdateCollectionClusterSetupAsync(new()
		{
		    CollectionName = "{collection_name}",
			ReplicatePoints = new()
		    {
		        FromShardKey = "default",
				ToShardKey = "user_1",
				Filter = MatchKeyword("group_id", "user_1")
		    }
		});
	}
}
