```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient(
	host: QDRANT_URL,
	https: true,
	apiKey: QDRANT_API_KEY
);

static string ImageToBase64Url(string imagePath)
{
	string prefix = "data:image/png;base64";
	byte[] bytes = File.ReadAllBytes(imagePath);
	return $"{prefix},{Convert.ToBase64String(bytes)}";
}

var documents = new[]
{
	new { Caption = "An image about plane emergency safety.", Image = "images/image-1.png" },
	new { Caption = "An image about airplane components.", Image = "images/image-2.png" },
	new { Caption = "An image about COVID safety restrictions.", Image = "images/image-3.png" },
	new { Caption = "A confidential image about UFO sightings.", Image = "images/image-4.png" },
	new { Caption = "An image about unusual footprints on Aralar 2011.", Image = "images/image-5.png" },
};

string collectionName = "multimodal-embeddings";

if (!await client.CollectionExistsAsync(collectionName))
{
	await client.CreateCollectionAsync(
		collectionName: collectionName,
		vectorsConfig: new VectorParamsMap
		{
			Map =
			{
				["image"] = new VectorParams { Size = 512, Distance = Distance.Cosine },
				["text"] = new VectorParams { Size = 512, Distance = Distance.Cosine },
			}
		}
	);
}

string cohereApiKey = Environment.GetEnvironmentVariable("COHERE_API_KEY")!;

var points = documents.Select((doc, idx) => new PointStruct
{
	Id = (ulong)idx,
	Vectors = new Dictionary<string, Vector>
	{
		["text"] = new Document
		{
			Text = doc.Caption,
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
		["image"] = new Image
		{
			Image_ = ImageToBase64Url(doc.Image),
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
	},
	Payload = { ["caption"] = doc.Caption, ["image"] = doc.Image }
}).ToList();

using (RequestHeaders.Use("cohere-api-key", cohereApiKey))
	await client.UpsertAsync(collectionName: collectionName, points: points);

IReadOnlyList<ScoredPoint> results;
using (RequestHeaders.Use("cohere-api-key", cohereApiKey))
	results = await client.QueryAsync(
		collectionName: collectionName,
		query: new Document
		{
			Text = "Plane components",
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
		usingVector: "image",
		payloadSelector: true,
		limit: 1
	);

Console.WriteLine(results[0].Payload["image"]);

using (RequestHeaders.Use("cohere-api-key", cohereApiKey))
	results = await client.QueryAsync(
		collectionName: collectionName,
		query: new Document
		{
			Text = "Componenti di un aereo",
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
		usingVector: "image",
		payloadSelector: true,
		limit: 1
	);

Console.WriteLine(results[0].Payload["image"]);

using (RequestHeaders.Use("cohere-api-key", cohereApiKey))
	results = await client.QueryAsync(
		collectionName: collectionName,
		query: new Image
		{
			Image_ = ImageToBase64Url("images/image-2.png"),
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
		usingVector: "text",
		payloadSelector: true,
		limit: 1
	);

Console.WriteLine(results[0].Payload["caption"]);
```
