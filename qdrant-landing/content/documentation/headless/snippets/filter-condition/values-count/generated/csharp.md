```csharp
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

ValuesCount("comments", new ValuesCount { Gt = 2 });
```
