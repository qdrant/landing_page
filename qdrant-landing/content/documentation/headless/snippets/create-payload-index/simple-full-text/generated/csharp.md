```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreatePayloadIndexAsync(
	collectionName: "{collection_name}",
	fieldName: "name_of_the_field_to_index",
	schemaType: PayloadSchemaType.Text,
	indexParams: new PayloadIndexParams
	{
		TextIndexParams = new TextIndexParams
		{
			Tokenizer = TokenizerType.Word,
			MinTokenLen = 2,
			MaxTokenLen = 10,
			Lowercase = true
		}
	}
);
```
