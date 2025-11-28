package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;

import java.util.List;
import java.util.Map;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .overwritePayloadAsync(
                        "{collection_name}",
                        Map.of("property1", value("string"), "property2", value("string")),
                        List.of(id(0), id(3), id(10)),
                        true,
                        null,
                        null)
                    .get();
        }
}
