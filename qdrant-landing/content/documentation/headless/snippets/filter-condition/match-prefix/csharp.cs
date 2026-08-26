using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		MatchPrefix("url", "https://qdrant.");
	}
}
