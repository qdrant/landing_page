```csharp
var QDRANT_URL = Environment.GetEnvironmentVariable("QDRANT_URL");
var QDRANT_API_KEY = Environment.GetEnvironmentVariable("QDRANT_API_KEY");

var client = new QdrantClient(
	host: QDRANT_URL!,
	https: true,
	apiKey: QDRANT_API_KEY
);
```
