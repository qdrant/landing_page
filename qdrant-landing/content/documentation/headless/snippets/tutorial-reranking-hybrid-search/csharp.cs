using System.Net.Http;
using Microsoft.VisualBasic.FileIO;
using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		string QDRANT_URL = "xyz-example.eu-central.aws.cloud.qdrant.io";
		string QDRANT_API_KEY = "<your-api-key>";
		// @hide-end
		// @block-start client-connection
		var client = new QdrantClient(
			host: QDRANT_URL,
			https: true,
			apiKey: QDRANT_API_KEY
		);
		// @block-end client-connection

		// @block-start define-models
		string denseEmbeddingModel = "sentence-transformers/all-MiniLM-L6-v2";
		string sparseEmbeddingModel = "qdrant/bm25";
		string lateInteractionEmbeddingModel = "answerdotai/answerai-colbert-small-v1";
		// @block-end define-models

		// @block-start create-collection
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
		// @block-end create-collection

		// @block-start ingest-data
		string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

		int batchSize = 25;
		ulong idx = 0;
		var buffer = new List<PointStruct>();

		using var httpClient = new HttpClient();
		using var stream = await httpClient.GetStreamAsync(csvUrl);
		using var parser = new TextFieldParser(new StreamReader(stream));
		parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
		parser.SetDelimiters(",");

		parser.ReadFields(); // skip header row // @hide

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
		// @block-end ingest-data

		// @block-start dense-retrieval
		string query = "time travel";

		var results = await client.QueryAsync(
			collectionName: collectionName,
			query: new Document { Text = query, Model = denseEmbeddingModel },
			usingVector: "dense",
			limit: 10
		);

		foreach (var result in results)
			Console.WriteLine(result);
		// @block-end dense-retrieval

		// @block-start sparse-retrieval
		results = await client.QueryAsync(
			collectionName: collectionName,
			query: new Document { Text = query, Model = sparseEmbeddingModel },
			usingVector: "sparse",
			limit: 10
		);

		foreach (var result in results)
			Console.WriteLine(result);
		// @block-end sparse-retrieval

		// @block-start hybrid-search
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
		// @block-end hybrid-search

		// @block-start rerank
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
		// @block-end rerank
	}
}
