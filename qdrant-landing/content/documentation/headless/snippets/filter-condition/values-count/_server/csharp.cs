using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		ValuesCount("comments", new ValuesCount { Gt = 2 });
	}
}
