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
			}
		);

		await client.CreatePayloadIndexAsync(
			collectionName: collectionName,
			fieldName: "description",
			schemaType: PayloadSchemaType.Text,
			indexParams: new PayloadIndexParams
			{
				TextIndexParams = new TextIndexParams
				{
					Tokenizer = TokenizerType.Word,
					Stemmer = new StemmingAlgorithm
					{
						Snowball = new SnowballParams { Language = "english" }
					},
					Stopwords = new StopwordsSet { Languages = { "english" } },
					// Enable BM25 scoring
					Scoring = new TextScoringParams { Type = TextScoringType.Bm25 }
				}
			}
		);
		// @block-end create-collection

		// @block-start parse-csv
		async IAsyncEnumerable<(string title, string author, string description)> ParseCsv(string url)
		{
			using var httpClient = new HttpClient();
			using var stream = await httpClient.GetStreamAsync(url);
			using var parser = new TextFieldParser(new StreamReader(stream));
			parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
			parser.SetDelimiters(",");
			string[]? headers = parser.ReadFields();
			int titleIdx = Array.IndexOf(headers!, "Title");
			int authorIdx = Array.IndexOf(headers!, "Author");
			int descriptionIdx = Array.IndexOf(headers!, "Description");
			while (!parser.EndOfData)
			{
				var fields = parser.ReadFields()!;
				yield return (fields[titleIdx], fields[authorIdx], fields[descriptionIdx]);
			}
		}
		// @block-end parse-csv

		// @block-start ingest-data
		string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

		int batchSize = 25;
		ulong idx = 0;
		var buffer = new List<PointStruct>();

		await foreach (var (title, author, description) in ParseCsv(csvUrl))
		{
			buffer.Add(new PointStruct
			{
				Id = idx++,
				Vectors = new Dictionary<string, Vector>
				{
					["dense"] = new Document { Text = description, Model = denseEmbeddingModel },
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

		// @block-start bm25-retrieval
		results = await client.QueryAsync(
			collectionName: collectionName,
			query: new Query { Text = new TextQuery { Query = query } },
			usingVector: "description",
			limit: 10
		);

		foreach (var result in results)
			Console.WriteLine(result);
		// @block-end bm25-retrieval

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
					Query = new Query { Text = new TextQuery { Query = query } },
					Using = "description",
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
					Query = new Query { Text = new TextQuery { Query = query } },
					Using = "description",
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
