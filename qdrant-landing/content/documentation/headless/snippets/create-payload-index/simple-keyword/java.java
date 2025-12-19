package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.PayloadSchemaType;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client.createPayloadIndexAsync(
                    "{collection_name}",
                    "name_of_the_field_to_index",
                    PayloadSchemaType.Keyword,
                    null,
                    true,
                    null,
                    null);
        }
}
