```csharp
// The .NET client takes a host and port rather than a URL, so only the API key is read
// from the environment. Replace the host with your own from https://cloud.qdrant.io
var client = new QdrantClient(
	host: "xyz-example.qdrant.io",
	https: true,
	apiKey: Environment.GetEnvironmentVariable("QDRANT_API_KEY")
);
```
