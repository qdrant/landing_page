using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		new OrderBy
		{
		 Key = "timestamp",
		 Direction = Direction.Desc,
		 StartFrom = 123
		};
	}
}
