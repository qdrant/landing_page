```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var denseModel = "sentence-transformers/all-minilm-l6-v2";
var bm25Model = "qdrant/bm25";
// NOTE: LoadDataset is a user-defined function.
// Implement it to return 100 random rows with distinct passages, as the Python version does.
var dataset = LoadDataset("miriad/miriad-4.4M", "train");
var points = new List<PointStruct>();

foreach (var item in dataset)
{
    var passage = item["passage_text"].ToString();

    var point = new PointStruct
    {
        Id = Guid.NewGuid(),
        Vectors = new Dictionary<string, Vector>
        {
            ["dense_vector"] = new Document
            {
                Text = passage,
                Model = denseModel
            },
            ["bm25_sparse_vector"] = new Document
            {
                Text = passage,
                Model = bm25Model
            }
        },
    };

    points.Add(point);
}

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: points
);
```
