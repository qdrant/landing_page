```csharp
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
```
