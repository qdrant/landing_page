
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet // @hide
{ // @hide
    public static async Task Run() // @hide
    { // @hide
        var client = new QdrantClient("localhost", 6334); // @hide


        await client.CreatePayloadIndexAsync(
            collectionName: "books",
            fieldName: "author",
            schemaType: PayloadSchemaType.Keyword
        );

    } // @hide
} // @hide
