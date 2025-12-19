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
			Stopwords = new StopwordsSet
			{
				Languages = { "english", "spanish" },
				Custom = { "example" }
			}
		}
	}
);
```
