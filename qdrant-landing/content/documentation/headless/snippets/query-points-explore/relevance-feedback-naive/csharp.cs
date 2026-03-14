using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "{collection_name}",
            query: new RelevanceFeedbackInput
            {
                Target = new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
                Feedback =
                {
                    new FeedbackItem { Example = 111, Score = 0.68f },
                    new FeedbackItem { Example = 222, Score = 0.72f },
                    new FeedbackItem { Example = 33, Score = 0.61f },
                },
                Strategy =
                {
                    Naive = new()
                    {
                        A = 0.12f,
                        B = 0.43f,
                        C = 0.16f,
                    },
                },
            }
        );
    }
}
