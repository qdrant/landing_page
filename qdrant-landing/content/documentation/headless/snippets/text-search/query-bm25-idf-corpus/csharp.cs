using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Document { Text = "time travel", Model = "qdrant/bm25" },
            usingVector: "title-bm25",
            filter: new Filter
            {
                Must =
                {
                    MatchKeyword("tenant", "acme"),
                    Match("year", 2024),
                },
            },
            searchParams: new SearchParams
            {
                Idf = new IdfParams
                {
                    Corpus = new Filter
                    {
                        Must = { MatchKeyword("tenant", "acme") },
                    },
                },
            },
            limit: 10
        );
    }
}
