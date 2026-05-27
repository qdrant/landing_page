```csharp
using Qdrant.Client;

var client = new QdrantClient(
    host: "xyz-example.eu-central.aws.cloud.qdrant.io",
    port: 6334,
    https: true,
    apiKey: null,
    grpcTimeout: default,
    loggerFactory: null,
    headers: new Dictionary<string, string>
    {
        { "authorization", "Bearer your_token_here" }
    });
```
