package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;

import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                client
                    .deletePayloadAsync(
                        "{collection_name}",
                        List.of("color", "price"),
                        List.of(id(0), id(3), id(100)),
                        true,
                        null,
                        null)
                    .get();
        }
}
