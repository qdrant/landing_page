```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateShardKeyAsync(
    "{collection_name}",
    new CreateShardKey { ShardKey = new ShardKey { Keyword = "default", }, ShardsNumber = 1 }
    );
```
