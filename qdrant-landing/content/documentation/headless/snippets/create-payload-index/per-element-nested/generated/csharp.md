```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreatePayloadIndexAsync(
 collectionName: "{collection_name}",
 fieldName: "offers[].shop",
 schemaType: PayloadSchemaType.Keyword,
 indexParams: new PayloadIndexParams
 {
  KeywordIndexParams = new KeywordIndexParams { Nested = "offers" }
 }
);

await client.CreatePayloadIndexAsync(
 collectionName: "{collection_name}",
 fieldName: "offers[].price",
 schemaType: PayloadSchemaType.Float,
 indexParams: new PayloadIndexParams
 {
  FloatIndexParams = new FloatIndexParams { Nested = "offers" }
 }
);
```
