```csharp
using Qdrant.Client.Grpc;

Conditions.DatetimeRange(
    field: "date",
    gt: new DateTime(2023, 2, 8, 10, 49, 0, DateTimeKind.Utc),
    lte: new DateTime(2024, 1, 31, 10, 14, 31, DateTimeKind.Utc)
);
```
