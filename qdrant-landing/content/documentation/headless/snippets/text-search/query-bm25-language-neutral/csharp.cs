using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Document
            {
                Text = "Mieville",
                Model = "qdrant/bm25",
                Options =
                {
                    ["stemmer"] = new Dictionary<string, Value> { ["type"] = "none" },
                    ["stopwords"] = new Dictionary<string, Value>(),
                    ["tokenizer"] = "multilingual",
                    ["ascii_folding"] = true,
                },
            },
            usingVector: "author-bm25",
            payloadSelector: true,
            limit: 10
        );
    }
}
