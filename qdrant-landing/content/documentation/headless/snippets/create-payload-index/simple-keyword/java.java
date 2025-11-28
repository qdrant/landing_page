package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.PayloadSchemaType;

public class Snippet {
        public static void run() throws Exception {
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
