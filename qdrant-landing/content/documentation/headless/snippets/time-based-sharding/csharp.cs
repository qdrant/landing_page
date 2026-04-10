using System.Net.Http;
using Microsoft.VisualBasic.FileIO;
using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		string QDRANT_URL = "";
		string QDRANT_API_KEY = "";
		// @hide-end

		// @block-start initialize-client
		var client = new QdrantClient(
			host: QDRANT_URL,
			https: true,
			apiKey: QDRANT_API_KEY
		);
		// @block-end initialize-client

		// @block-start create-collection
		string collectionName = "my_collection";

		if (await client.CollectionExistsAsync(collectionName))
			await client.DeleteCollectionAsync(collectionName);

		await client.CreateCollectionAsync(
			collectionName: collectionName,
			vectorsConfig: new VectorParamsMap
			{
				Map = {
					["dense_vector"] = new VectorParams { Size = 384, Distance = Distance.Cosine }
				}
			},
			shardingMethod: ShardingMethod.Custom
		);
		// @block-end create-collection

		// @block-start upload-vectors
		string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

		var existingShardKeys = (await client.ListShardKeysAsync(collectionName))
			.Select(sk => sk.Key.Keyword)
			.ToHashSet();

		string denseModel = "sentence-transformers/all-MiniLM-L6-v2";
		int batchSize = 100;
		string? currentDate = null;
		var buffer = new List<PointStruct>();

		using var httpClient = new HttpClient();
		using var stream = await httpClient.GetStreamAsync(csvUrl);
		using var parser = new TextFieldParser(new StreamReader(stream));
		parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
		parser.SetDelimiters(",");

		string[]? headers = parser.ReadFields();
		int textIdx = Array.IndexOf(headers!, "text");
		int datetimeIdx = Array.IndexOf(headers!, "datetime");

		while (!parser.EndOfData)
		{
			var fields = parser.ReadFields()!;
			string text = fields[textIdx];
			string datetime = fields[datetimeIdx];
			string shardDate = datetime[..10]; // Extract YYYY-MM-DD

			if (shardDate != currentDate)
			{
				// Flush buffer for the previous date before switching
				if (buffer.Count > 0)
				{
					await client.UpsertAsync(
						collectionName: collectionName,
						points: buffer,
						shardKeySelector: new ShardKeySelector
						{
							ShardKeys = { new List<ShardKey> { currentDate! } }
						}
					);
					buffer.Clear();
				}

				// Create shard for the new date if it doesn't exist yet
				if (!existingShardKeys.Contains(shardDate))
				{
					await client.CreateShardKeyAsync(
						collectionName,
						new CreateShardKey { ShardKey = new ShardKey { Keyword = shardDate } }
					);
					existingShardKeys.Add(shardDate);
				}

				currentDate = shardDate;
			}

			buffer.Add(new PointStruct
			{
				Id = Guid.NewGuid(),
				Vectors = new Dictionary<string, Vector>
				{
					["dense_vector"] = new Document { Text = text, Model = denseModel }
				},
				Payload = { ["text"] = text, ["datetime"] = datetime }
			});

			if (buffer.Count >= batchSize)
			{
				await client.UpsertAsync(
					collectionName: collectionName,
					points: buffer,
					shardKeySelector: new ShardKeySelector
					{
						ShardKeys = { new List<ShardKey> { currentDate! } }
					}
				);
				buffer.Clear();
			}
		}

		// Flush remaining partial batch
		if (buffer.Count > 0)
		{
			await client.UpsertAsync(
				collectionName: collectionName,
				points: buffer,
				shardKeySelector: new ShardKeySelector
				{
					ShardKeys = { new List<ShardKey> { currentDate! } }
				}
			);
		}
		// @block-end upload-vectors

		// @block-start search-single-shard
		string queryText = "coffee";

		var result = await client.QueryAsync(
			collectionName: collectionName,
			query: new Document { Text = queryText, Model = denseModel },
			usingVector: "dense_vector",
			limit: 5,
			shardKeySelector: new ShardKeySelector
			{
				ShardKeys = { new List<ShardKey> { "2026-04-07" } }
			}
		);

		foreach (var hit in result)
			Console.WriteLine(hit);
		// @block-end search-single-shard

		// @block-start search-multiple-shards
		result = await client.QueryAsync(
			collectionName: collectionName,
			query: new Document { Text = queryText, Model = denseModel },
			usingVector: "dense_vector",
			limit: 5,
			shardKeySelector: new ShardKeySelector
			{
				ShardKeys = { new List<ShardKey> { "2026-04-06", "2026-04-07" } }
			}
		);

		foreach (var hit in result)
			Console.WriteLine(hit);
		// @block-end search-multiple-shards

		// @block-start search-all-shards
		result = await client.QueryAsync(
			collectionName: collectionName,
			query: new Document { Text = queryText, Model = denseModel },
			usingVector: "dense_vector",
			limit: 5
		);

		foreach (var hit in result)
			Console.WriteLine(hit);
		// @block-end search-all-shards

		// @block-start pruning-shards
		string today = "2026-04-08";
		string oldestShardKey = DateOnly.ParseExact(today, "yyyy-MM-dd")
			.AddDays(-7)
			.ToString("yyyy-MM-dd");

		await client.CreateShardKeyAsync(
			collectionName,
			new CreateShardKey { ShardKey = new ShardKey { Keyword = today } }
		);
		await client.DeleteShardKeyAsync(
			collectionName,
			new DeleteShardKey { ShardKey = new ShardKey { Keyword = oldestShardKey } }
		);
		// @block-end pruning-shards

		// @block-start ingest-new-data
		await client.UpsertAsync(
			collectionName: collectionName,
			points: new List<PointStruct>
			{
				new()
				{
					Id = Guid.NewGuid(),
					Vectors = new Dictionary<string, Vector>
					{
						["dense_vector"] = new Document
						{
							Text = "The best way to start a Wednesday is with a cup of coffee",
							Model = denseModel
						}
					},
					Payload =
					{
						["text"] = "The best way to start a Wednesday is with a cup of coffee",
						["datetime"] = "2026-04-08T07:57:47"
					}
				}
			},
			shardKeySelector: new ShardKeySelector
			{
				ShardKeys = { new List<ShardKey> { today } }
			}
		);
		// @block-end ingest-new-data
	}
}
