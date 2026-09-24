```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "chunks",
	vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
);

await client.CreatePayloadIndexAsync(
	collectionName: "chunks",
	fieldName: "document_id",
	schemaType: PayloadSchemaType.Integer
);

// No vectors, payload only.
await client.CreateCollectionAsync(
	collectionName: "documents",
	vectorsConfig: new VectorParamsMap()
);
```
