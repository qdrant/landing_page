```csharp
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
```
