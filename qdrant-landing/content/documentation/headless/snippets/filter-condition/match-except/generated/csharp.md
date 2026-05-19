```csharp
using static Qdrant.Client.Grpc.Conditions;

MatchExcept("color", ["black", "yellow"]);
```
