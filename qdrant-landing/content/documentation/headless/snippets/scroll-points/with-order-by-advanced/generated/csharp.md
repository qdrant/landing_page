```csharp
using Qdrant.Client.Grpc;

new OrderBy
{
 Key = "timestamp",
 Direction = Direction.Desc,
 StartFrom = 123
};
```
