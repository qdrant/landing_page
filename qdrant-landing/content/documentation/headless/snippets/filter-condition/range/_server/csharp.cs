using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		Range("price", new Qdrant.Client.Grpc.Range { Gte = 100.0, Lte = 450 });
	}
}
