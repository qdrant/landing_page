```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreatePayloadIndexAsync(
	collectionName: "venues",
	fieldName: "location",
	schemaType: PayloadSchemaType.Geo
);
```
