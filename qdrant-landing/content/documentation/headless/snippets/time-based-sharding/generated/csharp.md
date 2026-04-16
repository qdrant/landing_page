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

async IAsyncEnumerable<(string text, string datetime)> ParseCsv(string url)
{
	using var httpClient = new HttpClient();
	using var stream = await httpClient.GetStreamAsync(url);
	using var parser = new TextFieldParser(new StreamReader(stream));
	parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
	parser.SetDelimiters(",");
	string[]? headers = parser.ReadFields();
	int textIdx = Array.IndexOf(headers!, "text");
	int datetimeIdx = Array.IndexOf(headers!, "datetime");
	while (!parser.EndOfData)
	{
		var fields = parser.ReadFields()!;
		yield return (fields[textIdx], fields[datetimeIdx]);
	}
}

string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

// Retrieve a list of existing shard keys in the collection
var existingShardKeys = (await client.ListShardKeysAsync(collectionName))
	.Select(sk => sk.Key.Keyword)
	.ToHashSet();

string denseModel = "sentence-transformers/all-MiniLM-L6-v2";
int batchSize = 100;
string? currentDate = null;
var buffer = new List<PointStruct>();

await foreach (var (text, datetime) in ParseCsv(csvUrl))
{
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

	// Add point to buffer
	buffer.Add(new PointStruct
	{
		Id = Guid.NewGuid(),
		Vectors = new Dictionary<string, Vector>
		{
			["dense_vector"] = new Document { Text = text, Model = denseModel }
		},
		Payload = { ["text"] = text, ["datetime"] = datetime }
	});

	// Flush batch if buffer size exceeds batch size
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

result = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = queryText, Model = denseModel },
	usingVector: "dense_vector",
	limit: 5
);

foreach (var hit in result)
	Console.WriteLine(hit);

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
```
