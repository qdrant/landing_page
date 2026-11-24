using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		MatchKeyword("uuid", "f47ac10b-58cc-4372-a567-0e02b2c3d479");
	}
}
