```csharp
using System.Net.Http;
using Microsoft.VisualBasic.FileIO;
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient(
	host: QDRANT_URL,
	https: true,
	apiKey: QDRANT_API_KEY
);

string denseEmbeddingModel = "sentence-transformers/all-MiniLM-L6-v2";
string sparseEmbeddingModel = "qdrant/bm25";
string lateInteractionEmbeddingModel = "answerdotai/answerai-colbert-small-v1";

string collectionName = "hybrid-search";

if (await client.CollectionExistsAsync(collectionName))
	await client.DeleteCollectionAsync(collectionName);

await client.CreateCollectionAsync(
	collectionName: collectionName,
	vectorsConfig: new VectorParamsMap
	{
		Map =
		{
			["dense"] = new VectorParams
			{
				Size = 384,
				Distance = Distance.Cosine,
			},
			["multi"] = new VectorParams
			{
				Size = 96,
				Distance = Distance.Cosine,
				MultivectorConfig = new() { Comparator = MultiVectorComparator.MaxSim },
				HnswConfig = new HnswConfigDiff { M = 0 }, // Disable HNSW for reranking
			},
		}
	},
	sparseVectorsConfig: new SparseVectorConfig
	{
		Map =
		{
			["sparse"] = new SparseVectorParams { Modifier = Modifier.Idf }
		}
	}
);

string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

int batchSize = 25;
ulong idx = 0;
var buffer = new List<PointStruct>();

using var httpClient = new HttpClient();
using var stream = await httpClient.GetStreamAsync(csvUrl);
using var parser = new TextFieldParser(new StreamReader(stream));
parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
parser.SetDelimiters(",");

while (!parser.EndOfData)
{
	var fields = parser.ReadFields()!;
	string title = fields[0];
	string author = fields[1];
	string description = fields[3];

	buffer.Add(new PointStruct
	{
		Id = idx++,
		Vectors = new Dictionary<string, Vector>
		{
			["dense"] = new Document { Text = description, Model = denseEmbeddingModel },
			["sparse"] = new Document { Text = description, Model = sparseEmbeddingModel },
			["multi"] = new Document { Text = description, Model = lateInteractionEmbeddingModel },
		},
		Payload = { ["title"] = title, ["author"] = author, ["description"] = description }
	});

	if (buffer.Count >= batchSize)
	{
		await client.UpsertAsync(collectionName: collectionName, points: buffer);
		buffer.Clear();
	}
}

if (buffer.Count > 0)
	await client.UpsertAsync(collectionName: collectionName, points: buffer);

string query = "time travel";

var results = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = query, Model = denseEmbeddingModel },
	usingVector: "dense",
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);

results = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = query, Model = sparseEmbeddingModel },
	usingVector: "sparse",
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);

results = await client.QueryAsync(
	collectionName: collectionName,
	prefetch: new List<PrefetchQuery>
	{
		new()
		{
			Query = new Document { Text = query, Model = denseEmbeddingModel },
			Using = "dense",
			Limit = 20,
		},
		new()
		{
			Query = new Document { Text = query, Model = sparseEmbeddingModel },
			Using = "sparse",
			Limit = 20,
		},
	},
	query: Fusion.Rrf,
	payloadSelector: true,
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);

results = await client.QueryAsync(
	collectionName: collectionName,
	prefetch: new List<PrefetchQuery>
	{
		new()
		{
			Query = new Document { Text = query, Model = denseEmbeddingModel },
			Using = "dense",
			Limit = 20,
		},
		new()
		{
			Query = new Document { Text = query, Model = sparseEmbeddingModel },
			Using = "sparse",
			Limit = 20,
		},
	},
	query: new Document { Text = query, Model = lateInteractionEmbeddingModel },
	usingVector: "multi",
	payloadSelector: true,
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
