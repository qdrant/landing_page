```csharp
using static Qdrant.Client.Grpc.Conditions;

Range("price", new Qdrant.Client.Grpc.Range { Gte = 100.0, Lte = 450 });
```
