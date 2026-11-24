using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		MatchTextAny("description", "good cheap");
	}
}
