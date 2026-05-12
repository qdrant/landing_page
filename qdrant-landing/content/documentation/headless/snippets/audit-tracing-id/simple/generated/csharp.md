```csharp
using Qdrant.Client;

using (RequestHeaders.Use("x-request-id", "my-trace-id"))
    await client.ListCollectionsAsync();
```
