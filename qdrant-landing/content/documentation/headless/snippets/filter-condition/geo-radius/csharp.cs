using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		GeoRadius("location", 52.520711, 13.403683, 1000.0f);
	}
}
